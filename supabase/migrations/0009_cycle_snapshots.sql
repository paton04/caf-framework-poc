-- Epic 5 (scoped down, see session notes): freeze the current live state
-- as a permanent, immutable, read-only snapshot. Live tables
-- (igp_assessments, evidence_files, scope_items) are completely
-- untouched by this — nothing resets, nothing is deleted. The richer
-- cycles/versioning/evidence-reuse vision is deliberately deferred to a
-- future epic; this is deliberately just an archive mechanism.

create table if not exists public.cycle_snapshots (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  frozen_by uuid references auth.users (id),
  frozen_at timestamptz not null default now(),
  data jsonb not null
);

alter table public.cycle_snapshots enable row level security;

-- Internal roles can browse history; only owner_admin can create a
-- snapshot. No update/delete policy for anyone — once frozen, permanent,
-- same append-only philosophy as audit_log.
create policy "Internal roles read snapshots" on public.cycle_snapshots
  for select using (public.current_user_role() in ('owner_admin', 'contributor'));
create policy "Owner/admin creates snapshots" on public.cycle_snapshots
  for insert with check (public.current_user_role() = 'owner_admin');

-- frozen_by is stamped here, not trusted from the insert — same
-- tamper-resistant pattern as evidence's uploaded_by/reviewed_by.
create or replace function public.stamp_cycle_snapshot_freezer()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.frozen_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists cycle_snapshot_freezer_stamp on public.cycle_snapshots;
create trigger cycle_snapshot_freezer_stamp
  before insert on public.cycle_snapshots
  for each row execute function public.stamp_cycle_snapshot_freezer();

create or replace function public.audit_cycle_snapshot_created()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.log_audit_event(
    'cycle_snapshot.created', 'cycle_snapshot', new.id::text,
    'Cycle "' || new.label || '" frozen as a snapshot',
    jsonb_build_object('label', new.label)
  );
  return new;
end;
$$;

drop trigger if exists cycle_snapshot_audit on public.cycle_snapshots;
create trigger cycle_snapshot_audit
  after insert on public.cycle_snapshots
  for each row execute function public.audit_cycle_snapshot_created();
