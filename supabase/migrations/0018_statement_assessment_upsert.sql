-- igp_statement_assessments (0015) deliberately uses two partial unique
-- indexes rather than one composite constraint, since scope_item_id is
-- nullable and NULLs aren't equal to each other in a normal unique
-- constraint (see that migration's comment). PostgREST's upsert only
-- ever sends a bare column list for ON CONFLICT, with no way to add the
-- "WHERE scope_item_id IS NULL" / "WHERE scope_item_id IS NOT NULL"
-- predicate a partial index's conflict target requires — so a plain
-- client-side .upsert() can't target either index correctly. This
-- function does the ON CONFLICT with the right predicate itself, in SQL,
-- where it's expressible.
--
-- security invoker (the default — no "security definer" here) so RLS on
-- igp_statement_assessments still applies exactly as it does to a direct
-- insert/update: owner_admin/contributor only, GRC blocked. The
-- stamp/rollup/audit triggers from 0015 still fire normally either way,
-- since they're attached to the table, not the calling path.

create or replace function public.upsert_statement_assessment(
  p_statement_id uuid,
  p_scope_item_id uuid, -- null = enterprise-wide
  p_status text,
  p_note text
) returns public.igp_statement_assessments
language plpgsql
set search_path = public
as $$
declare
  result public.igp_statement_assessments;
begin
  if p_scope_item_id is null then
    insert into public.igp_statement_assessments (statement_id, scope_item_id, status, note)
    values (p_statement_id, null, p_status, p_note)
    on conflict (statement_id) where scope_item_id is null
    do update set status = excluded.status, note = excluded.note
    returning * into result;
  else
    insert into public.igp_statement_assessments (statement_id, scope_item_id, status, note)
    values (p_statement_id, p_scope_item_id, p_status, p_note)
    on conflict (statement_id, scope_item_id) where scope_item_id is not null
    do update set status = excluded.status, note = excluded.note
    returning * into result;
  end if;
  return result;
end;
$$;

grant execute on function public.upsert_statement_assessment(uuid, uuid, text, text) to authenticated;
