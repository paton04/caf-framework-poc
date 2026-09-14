-- Major restructure per Zuber's feedback (session notes, 2026-09-14):
-- assessment is now keyed by scope item x CAF indicator, not indicator
-- alone — the same B2.a can be Achieved for one scope item and Not
-- applicable for another. Existing igp_assessments data is deliberately
-- scrapped (Fiona: "can scrap it/replace it"), not migrated.
--
-- Also adds the GRC role: a new tier, not a reframing of Owner/Admin.
-- Evidence review moves from Owner/Admin to GRC exclusively — Owner/Admin
-- keeps account/access administration but no longer reviews evidence.

-- ---------------------------------------------------------------------
-- GRC role
-- ---------------------------------------------------------------------

alter table public.user_roles drop constraint if exists user_roles_role_check;
alter table public.user_roles add constraint user_roles_role_check
  check (role in ('owner_admin', 'contributor', 'supplier', 'grc'));

-- ---------------------------------------------------------------------
-- Rekey igp_assessments to (scope_item_id, igp_code). Dropping and
-- recreating rather than migrating — old data is being scrapped.
-- ---------------------------------------------------------------------

drop table if exists public.igp_assessments cascade;

create table public.igp_assessments (
  scope_item_id uuid not null references public.scope_items (id) on delete cascade,
  igp_code text not null references public.caf_igps (code) on delete cascade,
  status text not null default 'none'
    check (status in ('none', 'partial', 'achieved', 'not', 'not_applicable')),
  narrative text not null default '',
  owner text not null default '',
  owner_id uuid references auth.users (id),
  updated_at timestamptz not null default now(),
  primary key (scope_item_id, igp_code)
);

alter table public.igp_assessments enable row level security;

-- Contributor/owner_admin do the work (fill in status/narrative/owner);
-- GRC reviews — read access only, matches "GRC reviews, doesn't do the work".
create policy "Internal roles read/write assessments" on public.igp_assessments
  for all using (public.current_user_role() in ('owner_admin', 'contributor'))
  with check (public.current_user_role() in ('owner_admin', 'contributor'));
create policy "GRC reads assessments" on public.igp_assessments
  for select using (public.current_user_role() = 'grc');

create or replace function public.audit_igp_assessment_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  changes text[] := array[]::text[];
  new_owner_email text;
begin
  if new.status is distinct from old.status then
    changes := changes || ('status: ' || old.status || ' -> ' || new.status);
  end if;
  if new.owner is distinct from old.owner then
    changes := changes || ('owner: ' || coalesce(old.owner, '(none)') || ' -> ' || coalesce(new.owner, '(none)'));
  end if;
  if new.owner_id is distinct from old.owner_id then
    if new.owner_id is not null then
      select email into new_owner_email from public.profiles where id = new.owner_id;
      changes := changes || ('linked to account: ' || coalesce(new_owner_email, new.owner_id::text));
    else
      changes := changes || 'account link removed';
    end if;
  end if;
  if new.narrative is distinct from old.narrative then
    changes := changes || 'narrative updated';
  end if;

  if array_length(changes, 1) > 0 then
    perform public.log_audit_event(
      'igp_assessment.updated',
      'igp_assessment',
      new.scope_item_id::text || ':' || new.igp_code,
      'Assessment for ' || new.igp_code || ' (scope item ' || new.scope_item_id || ') updated (' || array_to_string(changes, ', ') || ')',
      jsonb_build_object(
        'scope_item_id', new.scope_item_id, 'igp_code', new.igp_code,
        'old_status', old.status, 'new_status', new.status,
        'old_owner', old.owner, 'new_owner', new.owner
      )
    );
  end if;

  return new;
end;
$$;

-- AFTER UPDATE only — new rows are created via upsert from the app
-- (assessments aren't pre-seeded per scope item), so there's no "insert"
-- case to log the same way; a freshly-created row's first values aren't
-- a "change" worth logging the same way an edit is.
drop trigger if exists igp_assessment_audit on public.igp_assessments;
create trigger igp_assessment_audit
  after update on public.igp_assessments
  for each row execute function public.audit_igp_assessment_change();

-- ---------------------------------------------------------------------
-- Evidence now ties to a scope item too, not just an indicator — nullable
-- so supplier-submitted evidence (unaffected by this restructure, see
-- session notes on suppliers being deferred) keeps working unchanged.
-- ---------------------------------------------------------------------

alter table public.evidence_files
  add column if not exists scope_item_id uuid references public.scope_items (id) on delete set null;

-- ---------------------------------------------------------------------
-- Evidence review moves to GRC exclusively — redefines the same trigger
-- 0005/0009/0011 already built on. Self-upload block (0011) unchanged.
-- ---------------------------------------------------------------------

create or replace function public.enforce_evidence_review_permissions()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (new.review_status is distinct from old.review_status
      or new.review_note is distinct from old.review_note
      or new.expiry_date is distinct from old.expiry_date)
     and public.current_user_role() <> 'grc' then
    raise exception 'Only GRC can review evidence.';
  end if;

  if new.review_status is distinct from old.review_status then
    if old.uploaded_by is not null and old.uploaded_by = auth.uid() then
      raise exception 'You cannot review evidence you uploaded yourself — ask another GRC reviewer.';
    end if;

    new.reviewed_by := auth.uid();
    new.reviewed_at := now();

    perform public.log_audit_event(
      'evidence.' || new.review_status,
      'evidence_file',
      new.id::text,
      'Evidence "' || new.file_name || '" for ' || new.igp_code || ' marked ' || new.review_status
        || case when coalesce(new.review_note, '') <> '' then ': ' || new.review_note else '' end,
      jsonb_build_object(
        'igp_code', new.igp_code,
        'file_name', new.file_name,
        'previous_status', old.review_status,
        'note', new.review_note,
        'expiry_date', new.expiry_date
      )
    );
  end if;

  return new;
end;
$$;

-- GRC needs to actually open the files they're reviewing, not just see
-- their metadata — read-only, no upload (GRC doesn't submit evidence).
create policy "GRC reads evidence storage" on storage.objects
  for select using (bucket_id = 'evidence' and public.current_user_role() = 'grc');

-- GRC needs uploader/reviewer emails visible in the review panel — same
-- read as Internal roles already get (0003), just extended to GRC too.
create policy "GRC reads all profiles" on public.profiles
  for select using (public.current_user_role() = 'grc');

-- GRC needs to see which scope item a piece of evidence belongs to.
create policy "GRC reads scope items" on public.scope_items
  for select using (public.current_user_role() = 'grc');

-- GRC had no RLS grant on evidence_files at all until now — the trigger
-- above assumes GRC can update review_status, but the permission trigger
-- only runs once RLS already let the row through, and the existing
-- "Internal roles" policy doesn't cover GRC. Without these, GRC could
-- select 0 rows and update nothing, regardless of the trigger.
create policy "GRC reads evidence" on public.evidence_files
  for select using (public.current_user_role() = 'grc');
create policy "GRC reviews evidence" on public.evidence_files
  for update using (public.current_user_role() = 'grc')
  with check (public.current_user_role() = 'grc');
