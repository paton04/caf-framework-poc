-- Epic 7: role-based access control, enforced via RLS (not UI-only).
--
-- Three roles: owner_admin, contributor, supplier. A supplier's access is
-- scoped to specific IGPs via supplier_igp_access — they can only see/submit
-- evidence for IGPs they're explicitly linked to, and never see internal
-- narrative (igp_assessments stays off-limits to them entirely).
--
-- Run this once in the Supabase SQL Editor, same as the earlier migrations.

-- ---------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('owner_admin', 'contributor', 'supplier')),
  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

-- Every existing account pre-dates roles entirely — treat them as the
-- owner/admins they already effectively are. New accounts get a role
-- assigned explicitly via the admin page from here on.
insert into public.user_roles (user_id, role)
select id, 'owner_admin' from auth.users
on conflict (user_id) do nothing;

-- Supplier access: which IGPs a given supplier user may see/submit
-- evidence against. Managed by owner_admins on the admin page.
create table if not exists public.supplier_igp_access (
  user_id uuid not null references auth.users (id) on delete cascade,
  igp_code text not null references public.caf_igps (code) on delete cascade,
  primary key (user_id, igp_code)
);

alter table public.supplier_igp_access enable row level security;

-- security definer functions used inside RLS policies below — querying
-- user_roles directly from a policy on user_roles itself (or from policies
-- that need a user's role) would otherwise recurse into RLS again.
create or replace function public.current_user_role()
returns text
language sql
stable
security definer set search_path = public
as $$
  select role from public.user_roles where user_id = auth.uid();
$$;

create or replace function public.has_supplier_access(p_igp_code text)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.supplier_igp_access
    where user_id = auth.uid() and igp_code = p_igp_code
  );
$$;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.has_supplier_access(text) to authenticated;

create policy "Owner/admin manage roles" on public.user_roles
  for all using (public.current_user_role() = 'owner_admin')
  with check (public.current_user_role() = 'owner_admin');
create policy "Read own role" on public.user_roles
  for select using (auth.uid() = user_id);

create policy "Owner/admin manage supplier access" on public.supplier_igp_access
  for all using (public.current_user_role() = 'owner_admin')
  with check (public.current_user_role() = 'owner_admin');
create policy "Supplier reads own access" on public.supplier_igp_access
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- profiles: 0001 only let a user read their own row. The admin page and
-- the suppliers list both need to read every invited user's email, so
-- owner_admin/contributor need broader read access here too.
-- ---------------------------------------------------------------------

create policy "Internal roles read all profiles" on public.profiles
  for select using (public.current_user_role() in ('owner_admin', 'contributor'));

-- ---------------------------------------------------------------------
-- Replace the permissive "any authenticated user" policies from 0001
-- with role- and scope-aware ones.
-- ---------------------------------------------------------------------

drop policy if exists "Authenticated read/write" on public.igp_assessments;
drop policy if exists "Authenticated read/write" on public.evidence_files;
drop policy if exists "Authenticated read/write" on public.scope_items;

-- igp_assessments holds internal narrative — suppliers never see this,
-- only owner_admin/contributor.
create policy "Internal roles read/write assessments" on public.igp_assessments
  for all using (public.current_user_role() in ('owner_admin', 'contributor'))
  with check (public.current_user_role() in ('owner_admin', 'contributor'));

-- evidence_files: internal roles see/manage everything; a supplier only
-- sees/uploads evidence for the IGP(s) they're linked to.
create policy "Internal roles read/write evidence" on public.evidence_files
  for all using (public.current_user_role() in ('owner_admin', 'contributor'))
  with check (public.current_user_role() in ('owner_admin', 'contributor'));
create policy "Supplier reads own-scope evidence" on public.evidence_files
  for select using (public.has_supplier_access(igp_code));
create policy "Supplier uploads own-scope evidence" on public.evidence_files
  for insert with check (public.has_supplier_access(igp_code));

-- scope_items: internal roles only — not part of a supplier's restricted view.
create policy "Internal roles read/write scope items" on public.scope_items
  for all using (public.current_user_role() in ('owner_admin', 'contributor'))
  with check (public.current_user_role() in ('owner_admin', 'contributor'));

-- ---------------------------------------------------------------------
-- Storage: same split as evidence_files — internal roles get full access,
-- suppliers only within their assigned IGPs. Evidence is stored under
-- `<igp_code>/<filename>`, so the IGP code is the first path segment.
-- ---------------------------------------------------------------------

drop policy if exists "Authenticated read evidence files" on storage.objects;
drop policy if exists "Authenticated upload evidence files" on storage.objects;

create policy "Internal roles read evidence storage" on storage.objects
  for select using (
    bucket_id = 'evidence' and public.current_user_role() in ('owner_admin', 'contributor')
  );
create policy "Internal roles upload evidence storage" on storage.objects
  for insert with check (
    bucket_id = 'evidence' and public.current_user_role() in ('owner_admin', 'contributor')
  );
create policy "Supplier reads own-scope evidence storage" on storage.objects
  for select using (
    bucket_id = 'evidence' and public.has_supplier_access((storage.foldername(name))[1])
  );
create policy "Supplier uploads own-scope evidence storage" on storage.objects
  for insert with check (
    bucket_id = 'evidence' and public.has_supplier_access((storage.foldername(name))[1])
  );
