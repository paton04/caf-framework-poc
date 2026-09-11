-- General audit log for significant actions — a requirement from the
-- original security brief, never actually built until now. Append-only:
-- every write to this table happens through log_audit_event(), called
-- only from SECURITY DEFINER triggers below, so no policy grants any user
-- (including Owner/Admin) direct INSERT/UPDATE/DELETE — not even the app
-- can edit or remove an entry once written, only read them.

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  summary text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;

create policy "Owner/admin reads audit log" on public.audit_log
  for select using (public.current_user_role() = 'owner_admin');

create or replace function public.log_audit_event(
  p_action text,
  p_entity_type text,
  p_entity_id text,
  p_summary text,
  p_metadata jsonb default null
) returns void
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.audit_log (actor_id, action, entity_type, entity_id, summary, metadata)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_summary, p_metadata);
end;
$$;

-- ---------------------------------------------------------------------
-- Evidence review: extends the existing permission-enforcing trigger
-- rather than adding a second one, since it already runs on every
-- evidence_files update and already knows exactly what changed.
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
     and public.current_user_role() <> 'owner_admin' then
    raise exception 'Only Owner/Admin can review evidence.';
  end if;

  if new.review_status is distinct from old.review_status then
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

-- ---------------------------------------------------------------------
-- IGP assessment changes (status/narrative/owner) — one log entry per
-- save, summarising what changed rather than logging every field.
-- ---------------------------------------------------------------------

create or replace function public.audit_igp_assessment_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  changes text[] := array[]::text[];
begin
  if new.status is distinct from old.status then
    changes := changes || ('status: ' || old.status || ' -> ' || new.status);
  end if;
  if new.owner is distinct from old.owner then
    changes := changes || ('owner: ' || coalesce(old.owner, '(none)') || ' -> ' || coalesce(new.owner, '(none)'));
  end if;
  if new.narrative is distinct from old.narrative then
    changes := changes || 'narrative updated';
  end if;

  if array_length(changes, 1) > 0 then
    perform public.log_audit_event(
      'igp_assessment.updated',
      'igp_assessment',
      new.igp_code,
      'Assessment for ' || new.igp_code || ' updated (' || array_to_string(changes, ', ') || ')',
      jsonb_build_object(
        'igp_code', new.igp_code,
        'old_status', old.status, 'new_status', new.status,
        'old_owner', old.owner, 'new_owner', new.owner
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists igp_assessment_audit on public.igp_assessments;
create trigger igp_assessment_audit
  after update on public.igp_assessments
  for each row execute function public.audit_igp_assessment_change();

-- ---------------------------------------------------------------------
-- Scope register changes (create/update/delete).
-- ---------------------------------------------------------------------

create or replace function public.audit_scope_item_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_audit_event(
      'scope_item.created', 'scope_item', new.id::text,
      'Scope item "' || new.name || '" added',
      jsonb_build_object('name', new.name, 'type', new.type, 'criticality', new.criticality)
    );
  elsif tg_op = 'UPDATE' then
    perform public.log_audit_event(
      'scope_item.updated', 'scope_item', new.id::text,
      'Scope item "' || new.name || '" updated',
      jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new))
    );
  elsif tg_op = 'DELETE' then
    perform public.log_audit_event(
      'scope_item.deleted', 'scope_item', old.id::text,
      'Scope item "' || old.name || '" removed',
      jsonb_build_object('name', old.name)
    );
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists scope_item_audit on public.scope_items;
create trigger scope_item_audit
  after insert or update or delete on public.scope_items
  for each row execute function public.audit_scope_item_change();

-- ---------------------------------------------------------------------
-- Role assignment changes.
-- ---------------------------------------------------------------------

create or replace function public.audit_user_role_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.log_audit_event(
    case when tg_op = 'INSERT' then 'user_role.assigned' else 'user_role.changed' end,
    'user_role', new.user_id::text,
    'Role set to ' || new.role,
    jsonb_build_object(
      'user_id', new.user_id, 'role', new.role,
      'previous_role', case when tg_op = 'UPDATE' then old.role else null end
    )
  );
  return new;
end;
$$;

drop trigger if exists user_role_audit on public.user_roles;
create trigger user_role_audit
  after insert or update on public.user_roles
  for each row execute function public.audit_user_role_change();

-- ---------------------------------------------------------------------
-- Supplier access grants/revocations.
-- ---------------------------------------------------------------------

create or replace function public.audit_supplier_access_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_audit_event(
      'supplier_access.granted', 'supplier_igp_access', new.user_id::text || ':' || new.igp_code,
      'Supplier access granted to ' || new.igp_code,
      jsonb_build_object('user_id', new.user_id, 'igp_code', new.igp_code)
    );
  elsif tg_op = 'DELETE' then
    perform public.log_audit_event(
      'supplier_access.revoked', 'supplier_igp_access', old.user_id::text || ':' || old.igp_code,
      'Supplier access revoked for ' || old.igp_code,
      jsonb_build_object('user_id', old.user_id, 'igp_code', old.igp_code)
    );
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists supplier_access_audit on public.supplier_igp_access;
create trigger supplier_access_audit
  after insert or delete on public.supplier_igp_access
  for each row execute function public.audit_supplier_access_change();
