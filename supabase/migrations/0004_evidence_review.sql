-- Epic 3: evidence review workflow.
--
-- Review is a role, not a named person (see AGENTS/session notes — a
-- specific-reviewer model needs real user references on `owner` too,
-- which is Epic 6's job). Any Owner/Admin can approve or reject; the
-- restriction is enforced by a trigger rather than RLS alone, since RLS
-- can't scope which *columns* an UPDATE is allowed to touch — a
-- Contributor still needs to be able to do other things to a row without
-- being able to slip a review_status change through the same UPDATE.
--
-- Run this once in the Supabase SQL Editor, same as the earlier migrations.

alter table public.evidence_files
  add column if not exists review_status text not null default 'pending'
    check (review_status in ('pending', 'approved', 'rejected')),
  add column if not exists review_note text,
  add column if not exists reviewed_by uuid references auth.users (id),
  add column if not exists reviewed_at timestamptz,
  add column if not exists expiry_date date;

create or replace function public.enforce_evidence_review_permissions()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (new.review_status is distinct from old.review_status
      or new.review_note is distinct from old.review_note
      or new.expiry_date is distinct from old.expiry_date)
     and public.current_user_role() <> 'owner_admin' then
    raise exception 'Only Owner/Admin can review evidence.';
  end if;

  -- Always server-stamped, never trusted from client input.
  if new.review_status is distinct from old.review_status then
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists evidence_review_guard on public.evidence_files;
create trigger evidence_review_guard
  before update on public.evidence_files
  for each row execute function public.enforce_evidence_review_permissions();
