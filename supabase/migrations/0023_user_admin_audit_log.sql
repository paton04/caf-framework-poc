-- The new admin user-management actions (invite/disable/delete/reset
-- password/reset MFA) don't touch any public-schema table a trigger
-- could hang off — they go through the Supabase Auth Admin API
-- (service_role), which only affects auth.users and its related auth
-- tables, not anything this schema can attach a trigger to. These are
-- exactly the kind of "significant action" audit_log exists to record
-- (see 0005_audit_log.sql), so the app code logs them directly via
-- this RPC — the one deliberate exception to "nothing in the app
-- writes here directly".
--
-- This is NOT just log_audit_event exposed over RPC — that function
-- has no caller restriction (fine, since it was only ever called from
-- inside other trigger functions, never from the client). Granting it
-- directly to `authenticated` would let any signed-in user call
-- supabase.rpc('log_audit_event', ...) themselves and forge arbitrary
-- audit entries. This wrapper checks the caller is owner_admin first —
-- the same function-internal role check pattern already used elsewhere
-- (e.g. the evidence-review permission trigger), not just a GRANT.

create or replace function public.log_user_admin_event(p_action text, p_user_id text, p_summary text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if public.current_user_role() <> 'owner_admin' then
    raise exception 'Only Owner/Admin can do this.';
  end if;

  perform public.log_audit_event(p_action, 'user', p_user_id, p_summary, null);
end;
$$;

grant execute on function public.log_user_admin_event(text, text, text) to authenticated;
