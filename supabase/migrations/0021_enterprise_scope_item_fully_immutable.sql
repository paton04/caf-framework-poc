-- 0020 only blocked deleting the Enterprise-wide scope item and
-- unsetting its is_enterprise flag — every other column (name, type,
-- description, criticality, owner...) was still freely editable, and
-- the UI didn't know any of this was special, so someone could open
-- "Edit scope details" and change it, or click Delete and get a raw
-- Postgres exception instead of a clear explanation.
--
-- Per Fiona: it should be immutable, full stop, not just undeletable.
-- Once a row has is_enterprise = true, no UPDATE at all is allowed to
-- it (not just to is_enterprise) — if it ever genuinely needs to
-- change, that's a deliberate migration, not a casual edit through the
-- app. The UI change (hiding Edit/Delete entirely for this item,
-- rather than exposing a button that reliably fails) is the paired fix
-- in the same commit as this migration.

create or replace function public.protect_enterprise_scope_item()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'The Enterprise-wide scope item cannot be deleted.';
  end if;
  if tg_op = 'UPDATE' then
    raise exception 'The Enterprise-wide scope item is a fixed, protected record and cannot be edited.';
  end if;
  return coalesce(new, old);
end;
$$;

-- Replaces 0020's narrower "only block un-setting is_enterprise"
-- trigger with one that blocks any update at all.
drop trigger if exists protect_enterprise_scope_item_flag on public.scope_items;
create trigger protect_enterprise_scope_item_update
  before update on public.scope_items
  for each row when (old.is_enterprise)
  execute function public.protect_enterprise_scope_item();
