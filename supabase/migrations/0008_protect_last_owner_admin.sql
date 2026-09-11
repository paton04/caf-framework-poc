-- Nothing currently stops an Owner/Admin from demoting themselves (or the
-- last remaining Owner/Admin) and locking everyone out of /admin with no
-- way back except raw SQL. Blocked at the trigger level — the real
-- enforcement — rather than only in the app, since RLS already lets any
-- owner_admin write any row in user_roles and nothing stops a different
-- client from doing this directly.

create or replace function public.protect_last_owner_admin_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  remaining int;
begin
  if old.role = 'owner_admin' and new.role <> 'owner_admin' then
    select count(*) into remaining
    from public.user_roles
    where role = 'owner_admin' and user_id <> old.user_id;

    if remaining = 0 then
      raise exception 'Cannot change this — they are the last Owner/Admin. Promote someone else first.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_last_owner_admin_update_trigger on public.user_roles;
create trigger protect_last_owner_admin_update_trigger
  before update on public.user_roles
  for each row execute function public.protect_last_owner_admin_update();

-- Same protection against deleting the row outright rather than just
-- changing its role — no app path does this today, but nothing should
-- rely on that staying true.
create or replace function public.protect_last_owner_admin_delete()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  remaining int;
begin
  if old.role = 'owner_admin' then
    select count(*) into remaining
    from public.user_roles
    where role = 'owner_admin' and user_id <> old.user_id;

    if remaining = 0 then
      raise exception 'Cannot remove this — they are the last Owner/Admin.';
    end if;
  end if;

  return old;
end;
$$;

drop trigger if exists protect_last_owner_admin_delete_trigger on public.user_roles;
create trigger protect_last_owner_admin_delete_trigger
  before delete on public.user_roles
  for each row execute function public.protect_last_owner_admin_delete();
