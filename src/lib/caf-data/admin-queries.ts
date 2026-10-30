import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminUserStatus } from "./types";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Ban state and MFA enrollment for every account — only obtainable via
 * the Admin API (service_role), unlike everything in getProfilesWithRoles
 * which comes from ordinary RLS-governed tables. Caller (the /admin page)
 * is already gated to owner_admin; this itself doesn't re-check, since
 * it's read-only and the page that calls it already enforces that.
 */
export async function getAdminUserStatuses(): Promise<Map<string, AdminUserStatus>> {
  const admin = createAdminClient();
  const statusById = new Map<string, AdminUserStatus>();

  // perPage caps at 1000 server-side; fine for a trial-scale user base,
  // worth revisiting with real pagination if that ever stops being true.
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error(error.message);

  for (const user of data.users) {
    statusById.set(user.id, {
      id: user.id,
      banned: !!user.banned_until && new Date(user.banned_until) > new Date(),
      mfaEnrolled: (user.factors ?? []).some((f) => f.status === "verified"),
      lastSignInAt: user.last_sign_in_at ? formatDateTime(user.last_sign_in_at) : null,
    });
  }

  return statusById;
}
