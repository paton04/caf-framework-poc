-- v2 rearchitecture, structural piece (see docs/v2-rearchitecture-design.md).
--
-- Additive only — nothing existing is dropped or scrapped, unlike 0012.
-- Adds: the real numbered IGP statements under each outcome
-- (caf_igp_statements), per-statement status with enterprise-wide
-- resolution (igp_statement_assessments), a conversational comment
-- thread with @mentions (statement_comments /
-- statement_comment_mentions), a link from evidence to a specific
-- statement, and new bp/ep columns on caf_igps.
--
-- Run this once in the Supabase SQL Editor, same as every migration
-- before it. 0016 (separate file) expands/corrects the outcome
-- catalogue itself — this file is schema only, no reference data.

-- ---------------------------------------------------------------------
-- caf_igps: BP/EP target levels + Ofgem's own "evidence expected" text.
-- Nullable/empty for now — not populated until we have DESNZ's
-- per-outcome target-attainment doc, or Simon/Agha confirm directly.
-- ---------------------------------------------------------------------

alter table public.caf_igps
  add column if not exists bp_required_level text
    check (bp_required_level in ('achieved', 'partially_achieved', 'not_applicable')),
  add column if not exists ep_required_level text
    check (ep_required_level in ('achieved', 'partially_achieved', 'not_applicable')),
  add column if not exists evidence_examples text not null default '';

-- ---------------------------------------------------------------------
-- The real numbered IGP statements (what SGN's sheet's 1-15 rows are).
-- Reference data, same read-access pattern as caf_igps/caf_sections.
-- Content (actual statement wording) is seeded separately once sourced
-- — see design doc §3.1 and §6.
-- ---------------------------------------------------------------------

create table if not exists public.caf_igp_statements (
  id uuid primary key default gen_random_uuid(),
  igp_code text not null references public.caf_igps (code) on delete cascade,
  statement_number int not null, -- the Overlay's own numbering, kept for traceability
  level text not null check (level in ('partially_achieved', 'achieved')),
  statement text not null,
  sort_order int not null,
  unique (igp_code, statement_number)
);

alter table public.caf_igp_statements enable row level security;

create policy "Authenticated read" on public.caf_igp_statements
  for select using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------
-- Per-statement status. scope_item_id = null means "enterprise-wide" —
-- applies org-wide rather than to one scope item (per Ofgem Overlay
-- §1.34-1.38: an OES may run one management system across its whole NIS
-- scope, or split per system). A scope item's own row, when present,
-- takes precedence over the enterprise-wide one for that statement.
--
-- Status vocabulary adopts SGN's own terms directly (yes/no/NO-100/
-- YES-P2/not-in-scope), plus an app-internal not_reviewed default.
-- ---------------------------------------------------------------------

create table if not exists public.igp_statement_assessments (
  id uuid primary key default gen_random_uuid(),
  statement_id uuid not null references public.caf_igp_statements (id) on delete cascade,
  scope_item_id uuid references public.scope_items (id) on delete cascade,
  status text not null default 'not_reviewed'
    check (status in ('not_reviewed', 'yes', 'no', 'no_pending', 'yes_future_phase', 'not_in_scope')),
  note text not null default '',
  reviewed_by uuid references auth.users (id),
  updated_at timestamptz not null default now()
);

-- Postgres treats NULLs as distinct in a normal unique constraint, so
-- "one row per statement per scope item, and at most one enterprise-wide
-- row per statement" needs two partial unique indexes rather than one
-- composite constraint.
create unique index if not exists igp_statement_assessments_per_scope_item
  on public.igp_statement_assessments (statement_id, scope_item_id)
  where scope_item_id is not null;
create unique index if not exists igp_statement_assessments_enterprise_wide
  on public.igp_statement_assessments (statement_id)
  where scope_item_id is null;

alter table public.igp_statement_assessments enable row level security;

-- Same split as igp_assessments (0012): internal roles do the work, GRC
-- reviews (read-only).
create policy "Internal roles read/write statement assessments" on public.igp_statement_assessments
  for all using (public.current_user_role() in ('owner_admin', 'contributor'))
  with check (public.current_user_role() in ('owner_admin', 'contributor'));
create policy "GRC reads statement assessments" on public.igp_statement_assessments
  for select using (public.current_user_role() = 'grc');

-- reviewed_by/updated_at are always server-stamped, never trusted from
-- client input — same tamper-resistant pattern as evidence's
-- uploaded_by/reviewed_by (0004/0007).
create or replace function public.stamp_igp_statement_assessment()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.reviewed_by := auth.uid();
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists igp_statement_assessment_stamp on public.igp_statement_assessments;
create trigger igp_statement_assessment_stamp
  before insert or update on public.igp_statement_assessments
  for each row execute function public.stamp_igp_statement_assessment();

-- ---------------------------------------------------------------------
-- Roll a scope item's statement statuses up to its outcome-level status
-- (igp_assessments.status), the way the real CAF derives achieved/
-- partially achieved/not achieved from individual IGP statements.
--
-- Only touches igp_assessments rows that already exist — never creates
-- one just because a statement changed (assessments are still only
-- created via upsert from the app, per 0012's existing comment). An
-- outcome with no statements populated yet is left alone entirely, so
-- this rolls out incrementally: populate an outcome's statements and
-- its status starts being derived; leave it alone and it behaves
-- exactly as it does today (manually set).
-- ---------------------------------------------------------------------

create or replace function public.recompute_igp_assessment_status(p_scope_item_id uuid, p_igp_code text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
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

  select
    count(*) filter (where s.level = 'achieved'),
    count(*) filter (where s.level = 'achieved' and eff.status in ('yes', 'yes_future_phase', 'not_in_scope')),
    count(*) filter (where s.level = 'partially_achieved'),
    count(*) filter (where s.level = 'partially_achieved' and eff.status in ('yes', 'yes_future_phase', 'not_in_scope')),
    bool_or(eff.status <> 'not_reviewed')
  into v_total_achieved, v_satisfied_achieved, v_total_partial, v_satisfied_partial, v_any_reviewed
  from public.caf_igp_statements s
  cross join lateral (
    -- Scope-item-specific answer wins; fall back to the enterprise-wide
    -- one; default to not_reviewed if neither exists.
    select coalesce(
      (select status from public.igp_statement_assessments
        where statement_id = s.id and scope_item_id = p_scope_item_id),
      (select status from public.igp_statement_assessments
        where statement_id = s.id and scope_item_id is null),
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

  update public.igp_assessments
    set status = v_new_status, updated_at = now()
    where scope_item_id = p_scope_item_id and igp_code = p_igp_code;
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

  if v_scope_item_id is not null then
    perform public.recompute_igp_assessment_status(v_scope_item_id, v_igp_code);
  else
    -- Enterprise-wide row changed: recompute for every scope item that
    -- already has an assessment row for this outcome (fan-out), never
    -- creating new ones.
    for r in select scope_item_id from public.igp_assessments where igp_code = v_igp_code loop
      perform public.recompute_igp_assessment_status(r.scope_item_id, v_igp_code);
    end loop;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists igp_statement_assessment_rollup on public.igp_statement_assessments;
create trigger igp_statement_assessment_rollup
  after insert or update or delete on public.igp_statement_assessments
  for each row execute function public.recompute_igp_assessment_on_statement_change();

-- Audit logging — same pattern as audit_igp_assessment_change (0006),
-- AFTER UPDATE only (a freshly-upserted row's first values aren't a
-- "change" worth logging the same way an edit is).
create or replace function public.audit_igp_statement_assessment_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  changes text[] := array[]::text[];
  v_igp_code text;
  v_statement_number int;
begin
  if new.status is distinct from old.status then
    changes := changes || ('status: ' || old.status || ' -> ' || new.status);
  end if;
  if new.note is distinct from old.note then
    changes := changes || 'note updated';
  end if;

  if array_length(changes, 1) > 0 then
    select igp_code, statement_number into v_igp_code, v_statement_number
      from public.caf_igp_statements where id = new.statement_id;

    perform public.log_audit_event(
      'igp_statement_assessment.updated',
      'igp_statement_assessment',
      new.id::text,
      coalesce(v_igp_code, '?') || ' #' || coalesce(v_statement_number::text, '?')
        || case when new.scope_item_id is not null
             then ' (scope item ' || new.scope_item_id::text || ')'
             else ' (enterprise-wide)' end
        || ' updated (' || array_to_string(changes, ', ') || ')',
      jsonb_build_object(
        'statement_id', new.statement_id, 'scope_item_id', new.scope_item_id, 'igp_code', v_igp_code,
        'old_status', old.status, 'new_status', new.status
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists igp_statement_assessment_audit on public.igp_statement_assessments;
create trigger igp_statement_assessment_audit
  after update on public.igp_statement_assessments
  for each row execute function public.audit_igp_statement_assessment_change();

-- ---------------------------------------------------------------------
-- Evidence can now attach to a specific statement too, alongside the
-- existing outcome-level (igp_code) and scope-item-general (description)
-- attachment points. Reuses all existing review/RLS/storage machinery —
-- just one more nullable FK, same pattern as 0012's scope_item_id.
-- ---------------------------------------------------------------------

alter table public.evidence_files
  add column if not exists statement_assessment_id uuid
    references public.igp_statement_assessments (id) on delete set null;

-- ---------------------------------------------------------------------
-- Comments: a conversational thread per statement assessment, with
-- @mentions. Append-only by design (confirmed with Fiona) — with RLS on
-- and no UPDATE/DELETE policy defined, Postgres denies both outright,
-- so immutability is enforced at the database layer, not just app
-- convention. Matches audit_log/cycle_snapshots's append-only
-- philosophy elsewhere in this schema.
-- ---------------------------------------------------------------------

create table if not exists public.statement_comments (
  id uuid primary key default gen_random_uuid(),
  statement_assessment_id uuid not null references public.igp_statement_assessments (id) on delete cascade,
  author_id uuid not null references auth.users (id),
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.statement_comments enable row level security;

create policy "Internal roles read comments" on public.statement_comments
  for select using (public.current_user_role() in ('owner_admin', 'contributor', 'grc'));
create policy "Internal roles post comments" on public.statement_comments
  for insert with check (public.current_user_role() in ('owner_admin', 'contributor', 'grc'));

-- author_id is always server-stamped, never trusted from client input —
-- same pattern as evidence's uploaded_by.
create or replace function public.stamp_statement_comment_author()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.author_id := auth.uid();
  return new;
end;
$$;

drop trigger if exists statement_comment_author_stamp on public.statement_comments;
create trigger statement_comment_author_stamp
  before insert on public.statement_comments
  for each row execute function public.stamp_statement_comment_author();

create or replace function public.audit_statement_comment_created()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.log_audit_event(
    'statement_comment.created', 'statement_comment', new.id::text,
    'Comment posted on statement assessment ' || new.statement_assessment_id::text,
    jsonb_build_object('statement_assessment_id', new.statement_assessment_id)
  );
  return new;
end;
$$;

drop trigger if exists statement_comment_audit on public.statement_comments;
create trigger statement_comment_audit
  after insert on public.statement_comments
  for each row execute function public.audit_statement_comment_created();

-- @mentions — who was tagged in a comment, feeding the existing
-- Notification mechanism (app-code follow-up, not this migration).
-- Which users are offered in the @-picker is an app/UI concern (only
-- internal-role users), not enforced at the DB layer here — a
-- deliberate simplification, see design doc §4.
create table if not exists public.statement_comment_mentions (
  comment_id uuid not null references public.statement_comments (id) on delete cascade,
  mentioned_user_id uuid not null references auth.users (id) on delete cascade,
  primary key (comment_id, mentioned_user_id)
);

alter table public.statement_comment_mentions enable row level security;

create policy "Internal roles read mentions" on public.statement_comment_mentions
  for select using (public.current_user_role() in ('owner_admin', 'contributor', 'grc'));
create policy "Internal roles create mentions" on public.statement_comment_mentions
  for insert with check (public.current_user_role() in ('owner_admin', 'contributor', 'grc'));
