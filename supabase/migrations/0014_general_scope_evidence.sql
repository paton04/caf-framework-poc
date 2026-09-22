-- Generic scope-item evidence, raised by Agha (SGN), 2026-09-22: some
-- evidence describes a scope item as a whole (e.g. a network diagram, an
-- asset register extract) rather than justifying one specific CAF
-- indicator. igp_code becomes nullable for this case — scope_item_id and
-- a description are required instead, since there's no indicator name to
-- identify it by.

alter table public.evidence_files alter column igp_code drop not null;
alter table public.evidence_files add column if not exists description text not null default '';

alter table public.evidence_files add constraint evidence_files_generic_requires_scope_and_description
  check (
    igp_code is not null
    or (scope_item_id is not null and description <> '')
  );

-- Redefine the review-permission trigger (0012) so the audit log summary
-- doesn't collapse to null when igp_code is null — string concatenation
-- with a null operand yields null in Postgres.
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
      'Evidence "' || new.file_name || '" for '
        || coalesce(new.igp_code, 'scope item ' || new.scope_item_id::text || ' (general)')
        || ' marked ' || new.review_status
        || case when coalesce(new.review_note, '') <> '' then ': ' || new.review_note else '' end,
      jsonb_build_object(
        'igp_code', new.igp_code,
        'scope_item_id', new.scope_item_id,
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
