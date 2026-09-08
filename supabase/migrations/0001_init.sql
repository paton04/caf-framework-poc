-- CAF trial: initial schema
--
-- Design intent: RLS is switched ON for every table from day one, but the
-- policies below are deliberately permissive ("any authenticated user may
-- read/write") — there is only one role for now. Epic 7 replaces these
-- policies with role- and scope-aware ones once user_roles exists; the
-- table shapes themselves shouldn't need to change.
--
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New
-- query), or via `supabase db push` once the CLI is set up.

-- ---------------------------------------------------------------------
-- Reference data: CAF structure (Sections -> IGPs)
-- ---------------------------------------------------------------------

create table if not exists public.caf_sections (
  code text primary key,
  name text not null,
  sort_order int not null
);

create table if not exists public.caf_igps (
  code text primary key, -- e.g. 'B2.a'
  section_code text not null references public.caf_sections (code) on delete cascade,
  name text not null,
  sort_order int not null
);

-- ---------------------------------------------------------------------
-- Live assessment state — one row per IGP for the current (unfrozen) cycle.
-- Epic 5 (freeze/snapshot) will add a separate read-only table that this
-- gets copied into; this table always reflects "now".
-- ---------------------------------------------------------------------

create table if not exists public.igp_assessments (
  igp_code text primary key references public.caf_igps (code) on delete cascade,
  status text not null default 'none' check (status in ('none', 'partial', 'achieved', 'not')),
  narrative text not null default '',
  owner text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.evidence_files (
  id uuid primary key default gen_random_uuid(),
  igp_code text not null references public.caf_igps (code) on delete cascade,
  file_name text not null,
  storage_path text not null, -- path within the 'evidence' storage bucket
  uploaded_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Scope register
-- ---------------------------------------------------------------------

create table if not exists public.scope_items (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  type text not null check (type in ('Environment', 'Application', 'Other')),
  description text not null default '',
  essential_function text not null default '',
  criticality text not null default 'Tier 3' check (criticality in ('Tier 1', 'Tier 2', 'Tier 3')),
  owner text not null default '',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- User profiles — every signed-up user gets a row automatically.
-- No role/scope column yet; Epic 7 adds a separate user_roles table.
-- ---------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Row-level security — on for every table, permissive for now.
-- ---------------------------------------------------------------------

alter table public.caf_sections enable row level security;
alter table public.caf_igps enable row level security;
alter table public.igp_assessments enable row level security;
alter table public.evidence_files enable row level security;
alter table public.scope_items enable row level security;
alter table public.profiles enable row level security;

create policy "Authenticated read" on public.caf_sections
  for select using (auth.role() = 'authenticated');
create policy "Authenticated read" on public.caf_igps
  for select using (auth.role() = 'authenticated');

create policy "Authenticated read/write" on public.igp_assessments
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated read/write" on public.evidence_files
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated read/write" on public.scope_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Read own profile" on public.profiles
  for select using (auth.uid() = id);

-- ---------------------------------------------------------------------
-- Storage bucket for evidence files
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', false)
on conflict (id) do nothing;

create policy "Authenticated read evidence files" on storage.objects
  for select using (bucket_id = 'evidence' and auth.role() = 'authenticated');
create policy "Authenticated upload evidence files" on storage.objects
  for insert with check (bucket_id = 'evidence' and auth.role() = 'authenticated');

-- ---------------------------------------------------------------------
-- Seed reference data + demo assessment state
-- (matches src/lib/caf-data/seed.ts, so the real app shows the same demo
-- content the wireframe/local-state version showed)
-- ---------------------------------------------------------------------

insert into public.caf_sections (code, name, sort_order) values
  ('A', 'Managing security risk', 1),
  ('B', 'Protecting against attack', 2),
  ('C', 'Detecting security events', 3),
  ('D', 'Minimising impact', 4),
  ('E', 'Physical security', 5)
on conflict (code) do nothing;

insert into public.caf_igps (code, section_code, name, sort_order) values
  ('A1.a', 'A', 'Governance', 1),
  ('A2.a', 'A', 'Risk management', 2),
  ('A3.a', 'A', 'Asset management', 3),
  ('A4.a', 'A', 'Supply chain', 4),
  ('B1.a', 'B', 'Service protection policy', 1),
  ('B2.a', 'B', 'Identity and access management', 2),
  ('B3.a', 'B', 'Data security', 3),
  ('B4.a', 'B', 'System security', 4),
  ('B5.a', 'B', 'Resilient networks', 5),
  ('B6.a', 'B', 'Staff awareness', 6),
  ('C1.a', 'C', 'Security monitoring', 1),
  ('C2.a', 'C', 'Proactive discovery', 2),
  ('D1.a', 'D', 'Response and recovery planning', 1),
  ('D2.a', 'D', 'Lessons learned', 2),
  ('E1.a', 'E', 'Site access control', 1),
  ('E2.a', 'E', 'Perimeter and monitoring', 2)
on conflict (code) do nothing;

insert into public.igp_assessments (igp_code, status, narrative, owner) values
  ('A1.a', 'achieved', 'Security governance is owned by the IT Security Steering Group, chaired quarterly by the CISO. Roles and responsibilities for NIS compliance are documented and reviewed annually.', 'R. Coyle — Identity & Access'),
  ('A2.a', 'achieved', 'Risk register maintained centrally and reviewed monthly by the risk owner. NIS-relevant risks are flagged and tracked to closure with assigned owners.', 'S. Patel — Risk & Compliance'),
  ('A3.a', 'partial', 'Asset inventory exists for corporate IT and is reconciled quarterly. OT asset inventory is in progress — SCADA and field devices not yet fully catalogued.', 'J. Adeyemi — OT Engineering'),
  ('A4.a', 'not', '', 'Unassigned'),
  ('B1.a', 'achieved', 'Service protection policy published and acknowledged by all engineering staff. Reviewed annually alongside the security governance charter.', 'R. Coyle — Identity & Access'),
  ('B2.a', 'achieved', 'MFA is enforced across all corporate and OT-adjacent identity providers. Policy reviewed quarterly by the identity team. See attached policy and configuration extract.', 'R. Coyle — Identity & Access'),
  ('B3.a', 'partial', 'Encryption at rest confirmed for corporate systems. OT historian encryption pending upgrade scheduled for next maintenance window.', 'J. Adeyemi — OT Engineering'),
  ('B4.a', 'partial', 'Hardening baseline applied to corporate estate. OT systems patching cadence still under review with the vendor.', 'M. Osei — Third-party Assurance'),
  ('B5.a', 'none', '', 'Unassigned'),
  ('B6.a', 'achieved', 'Annual security awareness training completed by 98% of staff. Phishing simulation run quarterly with results reported to the steering group.', 'S. Patel — Risk & Compliance'),
  ('C1.a', 'partial', 'SIEM deployed across corporate estate with 24/7 alerting. OT network monitoring coverage still being extended to remaining sites.', 'J. Adeyemi — OT Engineering'),
  ('C2.a', 'none', '', 'Unassigned'),
  ('D1.a', 'partial', 'Incident response plan documented and tested via tabletop exercise in Q4. Business continuity plan due for its annual refresh.', 'S. Patel — Risk & Compliance'),
  ('D2.a', 'none', '', 'Unassigned'),
  ('E1.a', 'achieved', 'Badge access control in place at all sites with visitor sign-in and escort policy. Access logs retained for 12 months.', 'R. Coyle — Identity & Access'),
  ('E2.a', 'achieved', 'CCTV and perimeter alarm coverage confirmed at all Tier 1 sites, monitored by the 24/7 control room.', 'J. Adeyemi — OT Engineering')
on conflict (igp_code) do nothing;

insert into public.scope_items (name, type, description, essential_function, criticality, owner) values
  ('OT Network Monitoring Platform', 'Environment', 'Monitors OT network traffic for anomalies across gas distribution sites.', 'Gas flow control', 'Tier 1', 'J. Adeyemi'),
  ('Field Engineering Scheduler', 'Application', 'Schedules and dispatches field engineers to maintenance jobs.', 'Maintenance dispatch', 'Tier 2', 'S. Patel'),
  ('Corporate Identity Provider', 'Environment', 'Single sign-on and identity provider for all corporate and OT-adjacent systems.', 'Access control (all)', 'Tier 1', 'R. Coyle'),
  ('SCADA Historian', 'Environment', 'Historical data store for SCADA telemetry across the distribution network.', 'Gas flow control', 'Tier 1', 'J. Adeyemi'),
  ('Supplier Portal (pilot)', 'Application', 'Pilot portal allowing third-party suppliers to submit their own compliance evidence.', 'Third-party assurance', 'Tier 3', 'M. Osei')
on conflict (name) do nothing;
