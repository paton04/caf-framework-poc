-- Bug found testing the statement checklist UI live (2026-10-29):
-- setting a statement's status for a scope item that had never had a
-- manual igp_assessments row created for that outcome did nothing to
-- the heatmap tile — it stayed on the "no row" default ("Not started")
-- even though the derived status should have changed.
--
-- 0015's recompute_igp_assessment_status only ever UPDATEd an existing
-- igp_assessments row, deliberately never creating one — meant to avoid
-- an enterprise-wide statement edit silently creating a row for every
-- scope item in the system. But that same rule also blocked the much
-- more common, directly-intended case: a user setting *this* scope
-- item's own statement, which should obviously be allowed to create
-- this scope item's derived outcome status if it doesn't exist yet.
--
-- Fix: upsert instead of update-only. The enterprise-wide fan-out loop
-- in the trigger function (0015) is unchanged and still only touches
-- scope items that already have a row — an enterprise-only edit (no
-- scope-item-specific statement ever set) still won't retroactively
-- create every scope item's row, which is an acceptable, documented
-- limitation rather than the bug this migration fixes.

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

  insert into public.igp_assessments (scope_item_id, igp_code, status, updated_at)
  values (p_scope_item_id, p_igp_code, v_new_status, now())
  on conflict (scope_item_id, igp_code)
  do update set status = excluded.status, updated_at = excluded.updated_at;
end;
$$;
