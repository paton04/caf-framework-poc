-- Epic 6: ownership/routing.
--
-- `owner` stays free text (so demo data and real stakeholders without a
-- login still work exactly as before) — this adds an optional owner_id
-- link to a registered account alongside it. Only linked items are
-- routable (show up in that person's "My items" view); unlinked ones
-- display exactly as today.

alter table public.igp_assessments add column if not exists owner_id uuid references auth.users (id);
alter table public.scope_items add column if not exists owner_id uuid references auth.users (id);

-- Extends the audit trigger from 0005 to also log ownership links —
-- redefining rather than adding a second trigger, same as 0005 did to
-- 0004's evidence trigger.
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
      new.igp_code,
      'Assessment for ' || new.igp_code || ' updated (' || array_to_string(changes, ', ') || ')',
      jsonb_build_object(
        'igp_code', new.igp_code,
        'old_status', old.status, 'new_status', new.status,
        'old_owner', old.owner, 'new_owner', new.owner,
        'old_owner_id', old.owner_id, 'new_owner_id', new.owner_id
      )
    );
  end if;

  return new;
end;
$$;

-- No RLS changes needed — owner_id is just another column on tables
-- owner_admin/contributor already have full read/write on, and
-- scope_item.updated's audit entry already diffs the whole row via
-- to_jsonb(old)/to_jsonb(new), so it picks up owner_id automatically.
