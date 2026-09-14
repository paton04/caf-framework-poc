-- Owner/Admin-editable announcement banner, shown to every signed-in user.
-- Single-row settings table rather than a key-value store — there's
-- exactly one thing to configure right now.

create table if not exists public.app_settings (
  id text primary key default 'singleton',
  announcement text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id)
);

insert into public.app_settings (id) values ('singleton') on conflict (id) do nothing;

alter table public.app_settings enable row level security;

-- Broadly readable — an announcement is meant to be seen by everyone,
-- not role-gated the way most of this app's data is.
create policy "Authenticated read announcement" on public.app_settings
  for select using (auth.role() = 'authenticated');
create policy "Owner/admin updates announcement" on public.app_settings
  for update using (public.current_user_role() = 'owner_admin')
  with check (public.current_user_role() = 'owner_admin');

-- updated_by/updated_at stamped here, not trusted from the update — same
-- pattern as evidence's uploaded_by/reviewed_by.
create or replace function public.stamp_and_audit_announcement()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.updated_by := auth.uid();
  new.updated_at := now();

  if new.announcement is distinct from old.announcement then
    perform public.log_audit_event(
      'app_settings.announcement_updated', 'app_settings', new.id,
      case when coalesce(new.announcement, '') = '' then 'Announcement cleared' else 'Announcement updated' end,
      jsonb_build_object('announcement', new.announcement)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists app_settings_audit on public.app_settings;
create trigger app_settings_audit
  before update on public.app_settings
  for each row execute function public.stamp_and_audit_announcement();
