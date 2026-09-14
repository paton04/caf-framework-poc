-- Segregation of duties: whoever uploaded a piece of evidence can't be the
-- one who approves/rejects it, even though they're Owner/Admin and would
-- otherwise be allowed to. Redefines the same trigger 0005 and 0009
-- already extended, same pattern — one function, each migration adds to it.
--
-- Not the "nominated reviewer" model Zuber also floated (a specific
-- person/role assigned per area) — that needs owner_id-style routing
-- design and is its own future piece. This is just "not yourself".

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

  if new.review_status is distinct from old.review_status then
    if old.uploaded_by is not null and old.uploaded_by = auth.uid() then
      raise exception 'You cannot review evidence you uploaded yourself — ask another Owner/Admin.';
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
