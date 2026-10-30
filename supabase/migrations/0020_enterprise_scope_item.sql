-- Replaces the nullable-scope_item_id "enterprise-wide" model (0015/0018)
-- with a real scope item representing the whole organisation, per
-- Fiona's feedback testing the statement checklist live (2026-10-29):
-- "I think we should have something like a default, required scope item
-- which represents the entire enterprise."
--
-- This also resolves her "the checkbox is supposed to apply to an
-- entire indicator" point — there's no longer a per-statement toggle at
-- all. Assessing an outcome on the Enterprise-wide scope item *is* its
-- organisation-wide default, through the exact same UI every other
-- scope item already uses; any other scope item's own answer for a
-- given statement still overrides that default, same resolution logic
-- as before, just keyed by two real scope item ids instead of a real
-- one and NULL.
--
-- Side benefit: igp_statement_assessments no longer needs a nullable
-- scope_item_id or the two partial unique indexes that required —
-- which in turn means 0018's RPC workaround (PostgREST's upsert can't
-- target a partial index) is no longer needed either. One normal unique
-- constraint, one plain client-side upsert.

-- ---------------------------------------------------------------------
-- The enterprise-wide scope item itself
-- ---------------------------------------------------------------------

alter table public.scope_items add column if not exists is_enterprise boolean not null default false;

-- At most one row can ever have is_enterprise = true.
create unique index if not exists scope_items_single_enterprise
  on public.scope_items (is_enterprise)
  where is_enterprise;

insert into public.scope_items (name, type, description, essential_function, criticality, is_enterprise)
values (
  'Enterprise-wide',
  'Other',
  'Represents the organisation as a whole — assess an indicator here when a policy or control applies across every scope item rather than one system specifically (e.g. a company-wide data handling policy). Any other scope item''s own answer for the same statement still takes precedence over this default.',
  'Organisation-wide controls',
  'Tier 1',
  true
)
on conflict (name) do nothing;

-- Can't be deleted, and the flag can't be unset once set — both are
-- deliberate: nothing in the app currently exposes scope-item deletion,
-- but this is cheap insurance against a direct DB edit removing the one
-- row half the schema's resolution logic depends on finding.
create or replace function public.protect_enterprise_scope_item()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'The Enterprise-wide scope item cannot be deleted.';
  end if;
  if tg_op = 'UPDATE' and old.is_enterprise and not new.is_enterprise then
    raise exception 'The Enterprise-wide flag cannot be removed from this scope item.';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists protect_enterprise_scope_item_delete on public.scope_items;
create trigger protect_enterprise_scope_item_delete
  before delete on public.scope_items
  for each row when (old.is_enterprise)
  execute function public.protect_enterprise_scope_item();

drop trigger if exists protect_enterprise_scope_item_flag on public.scope_items;
create trigger protect_enterprise_scope_item_flag
  before update on public.scope_items
  for each row when (old.is_enterprise and not new.is_enterprise)
  execute function public.protect_enterprise_scope_item();

-- ---------------------------------------------------------------------
-- igp_statement_assessments: scope_item_id becomes required. Any
-- existing NULL ("enterprise-wide") rows move to the new real row first.
-- ---------------------------------------------------------------------

update public.igp_statement_assessments
set scope_item_id = (select id from public.scope_items where is_enterprise limit 1)
where scope_item_id is null;

alter table public.igp_statement_assessments alter column scope_item_id set not null;

drop index if exists public.igp_statement_assessments_per_scope_item;
drop index if exists public.igp_statement_assessments_enterprise_wide;

alter table public.igp_statement_assessments
  add constraint igp_statement_assessments_statement_scope_unique unique (statement_id, scope_item_id);

-- 0018's RPC existed solely to work around the partial unique indexes
-- above, which are gone now — a plain client-side upsert targets the
-- new full unique constraint fine.
drop function if exists public.upsert_statement_assessment(uuid, uuid, text, text);

-- ---------------------------------------------------------------------
-- Rollup: resolve against the real enterprise scope item id instead of
-- NULL, and fan out to dependent scope items when the row that changed
-- *was* the enterprise one (same intent as 0015's fan-out, just no
-- longer keyed off scope_item_id being NULL to detect that case).
-- ---------------------------------------------------------------------

create or replace function public.recompute_igp_assessment_status(p_scope_item_id uuid, p_igp_code text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_enterprise_id uuid;
  v_total_achieved int;
  v_satisfied_achieved int;
  v_total_partial int;
  v_satisfied_partial int;
  v_any_reviewed boolean;
  v_new_status text;
begin
  if not exists (select 1 from public.caf_igp_statements where igp_code = p_igp_code) then
    return;
  end if;

  select id into v_enterprise_id from public.scope_items where is_enterprise limit 1;

  select
    count(*) filter (where s.level = 'achieved'),
    count(*) filter (where s.level = 'achieved' and eff.status in ('yes', 'yes_future_phase', 'not_in_scope')),
    count(*) filter (where s.level = 'partially_achieved'),
    count(*) filter (where s.level = 'partially_achieved' and eff.status in ('yes', 'yes_future_phase', 'not_in_scope')),
    bool_or(eff.status <> 'not_reviewed')
  into v_total_achieved, v_satisfied_achieved, v_total_partial, v_satisfied_partial, v_any_reviewed
  from public.caf_igp_statements s
  cross join lateral (
    -- This scope item's own answer wins; fall back to the enterprise
    -- default; not_reviewed if neither exists. When p_scope_item_id
    -- *is* the enterprise item, the first branch already resolves it —
    -- no special-casing needed.
    select coalesce(
      (select status from public.igp_statement_assessments
        where statement_id = s.id and scope_item_id = p_scope_item_id),
      (select status from public.igp_statement_assessments
        where statement_id = s.id and scope_item_id = v_enterprise_id),
      'not_reviewed'
    ) as status
  ) eff
  where s.igp_code = p_igp_code;

  if v_total_achieved > 0 and v_satisfied_achieved = v_total_achieved then
    v_new_status := 'achieved';
  elsif v_total_partial > 0 and v_satisfied_partial = v_total_partial then
    v_new_status := 'partial';
  elsif v_any_reviewed then
    v_new_status := 'not';
  else
    v_new_status := 'none';
  end if;

  insert into public.igp_assessments (scope_item_id, igp_code, status, updated_at)
  values (p_scope_item_id, p_igp_code, v_new_status, now())
  on conflict (scope_item_id, igp_code)
  do update set status = excluded.status, updated_at = excluded.updated_at;
end;
$$;

create or replace function public.recompute_igp_assessment_on_statement_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_statement_id uuid;
  v_scope_item_id uuid;
  v_igp_code text;
  v_enterprise_id uuid;
  r record;
begin
  if tg_op = 'DELETE' then
    v_statement_id := old.statement_id;
    v_scope_item_id := old.scope_item_id;
  else
    v_statement_id := new.statement_id;
    v_scope_item_id := new.scope_item_id;
  end if;

  select igp_code into v_igp_code from public.caf_igp_statements where id = v_statement_id;
  if v_igp_code is null then
    return coalesce(new, old);
  end if;

  perform public.recompute_igp_assessment_status(v_scope_item_id, v_igp_code);

  select id into v_enterprise_id from public.scope_items where is_enterprise limit 1;
  if v_scope_item_id = v_enterprise_id then
    -- The organisation-wide default changed — every other scope item
    -- that inherits from it (and already has an assessment row for
    -- this outcome) may now resolve differently too.
    for r in
      select scope_item_id from public.igp_assessments
      where igp_code = v_igp_code and scope_item_id <> v_enterprise_id
    loop
      perform public.recompute_igp_assessment_status(r.scope_item_id, v_igp_code);
    end loop;
  end if;

  return coalesce(new, old);
end;
$$;
