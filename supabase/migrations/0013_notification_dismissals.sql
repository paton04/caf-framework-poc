-- Lets a user dismiss a notification without hiding the underlying issue
-- forever: dismissing stores the count it was dismissed at, and the app
-- only suppresses that notification while the count stays the same. If
-- it changes (e.g. another item goes without evidence, or the pending
-- count drops then rises again), it reappears — dismissing never lets a
-- real compliance gap go permanently unnoticed.

create table public.notification_dismissals (
  user_id uuid not null references auth.users (id) on delete cascade,
  notification_id text not null,
  dismissed_count integer not null,
  dismissed_at timestamptz not null default now(),
  primary key (user_id, notification_id)
);

alter table public.notification_dismissals enable row level security;

create policy "Users manage their own dismissals" on public.notification_dismissals
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
