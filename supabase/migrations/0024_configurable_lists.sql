-- Generic, admin-managed reference lists — per Fiona: "I'd also like to
-- be able to configure other parts of the product from there", starting
-- with scope item Types and Essential Functions, but built as one
-- reusable mechanism (list_name as a discriminator) rather than a
-- one-off table per field, since more of these are likely to come.
--
-- Removing a value is a SOFT delete (removed_at, never an actual row
-- delete) — existing scope_items keep whatever text they already had
-- verbatim; the app just stops offering a removed value for new
-- selections and marks it "(removed)" wherever an existing record still
-- shows it. scope_items.type/essential_function stay plain text rather
-- than a hard foreign key into this table — a composite FK against
-- (list_name, value) where list_name is effectively a per-column
-- constant isn't natural to express cleanly in Postgres, and the
-- RLS-is-the-real-enforcement pattern already used throughout this
-- schema covers the gap: the UI only ever offers current, non-removed
-- values, same trust boundary as everything else here.

create table public.configurable_lists (
  list_name text not null,
  value text not null,
  sort_order int not null,
  removed_at timestamptz,
  primary key (list_name, value)
);

alter table public.configurable_lists enable row level security;

create policy "Authenticated read" on public.configurable_lists
  for select using (auth.role() = 'authenticated');
create policy "Owner/admin add list values" on public.configurable_lists
  for insert with check (public.current_user_role() = 'owner_admin');
create policy "Owner/admin remove/restore list values" on public.configurable_lists
  for update using (public.current_user_role() = 'owner_admin')
  with check (public.current_user_role() = 'owner_admin');
-- No delete policy at all — removal is soft (set removed_at), same
-- append-only-ish philosophy as everything else in this schema that
-- shouldn't lose history (audit_log, statement_comments, snapshots).

-- scope_items.type was a fixed CHECK constraint (Environment/
-- Application/Other) — replaced by the list above, now editable.
alter table public.scope_items drop constraint if exists scope_items_type_check;

insert into public.configurable_lists (list_name, value, sort_order) values
  ('scope_item_type', 'Environment', 1),
  ('scope_item_type', 'Application', 2),
  ('scope_item_type', 'Other', 3)
on conflict (list_name, value) do nothing;

-- essential_function was free text, not a fixed list at all — seed the
-- new list from whatever's already actually in use, so converting it
-- to a managed list doesn't orphan or blank any existing scope item's
-- value. Duplicates collapse naturally (the list is keyed by value).
insert into public.configurable_lists (list_name, value, sort_order)
select 'essential_function', d.essential_function, row_number() over (order by d.essential_function)
from (
  select distinct essential_function
  from public.scope_items
  where essential_function is not null and essential_function <> ''
) d
on conflict (list_name, value) do nothing;
