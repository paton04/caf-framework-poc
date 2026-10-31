-- caf_igps.bp_required_level / ep_required_level (added 0015, defaulted
-- to a placeholder by 0029) could so far only be set via a migration —
-- real DESNZ/Ofgem values for the DGE sector aren't published (confirmed
-- directly: DESNZ treats the equivalent Tier-1-load-control profile as
-- "sensitive... shared via email", not a public document), and the
-- required levels would differ again for any other NIS sector this app
-- is ever used for. Per Fiona: this should be admin-editable in the app
-- itself, same reasoning as 0024's configurable_lists (scope item Type/
-- Essential function) — a setting that needs changing without a code
-- deploy once the real numbers are known.
--
-- caf_igps only had a read policy (0001) — no write policy at all, so
-- any update was denied by RLS. This adds an owner_admin update policy,
-- same shape as 0024's. Full-row, not column-restricted: owner_admin is
-- already broadly trusted throughout this app (user/role management
-- etc.), and the app's own UI only ever writes the two required-level
-- columns regardless.

create policy "Owner/admin edit required levels" on public.caf_igps
  for update using (public.current_user_role() = 'owner_admin')
  with check (public.current_user_role() = 'owner_admin');
