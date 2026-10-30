"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionAndRole } from "@/lib/auth";
import type { UserRole } from "@/lib/caf-data/types";

// Every action here uses createAdminClient() (service_role — bypasses
// RLS entirely), so unlike every other action file in this app, RLS is
// NOT the enforcement layer. Each one re-checks the caller is
// owner_admin itself, first, before doing anything. See
// src/lib/supabase/admin.ts for why this client exists at all, and
// 0023_user_admin_audit_log.sql for why audit logging here goes
// through a dedicated RPC rather than a direct table write.

async function requireOwnerAdmin() {
  const { user, role } = await getSessionAndRole();
  if (!user || role !== "owner_admin") {
    throw new Error("Only Owner/Admin can do this.");
  }
  return user;
}

async function logAdminAction(action: string, userId: string, summary: string) {
  try {
    const supabase = await createClient();
    await supabase.rpc("log_user_admin_event", { p_action: action, p_user_id: userId, p_summary: summary });
  } catch {
    // Non-fatal — the admin action itself already succeeded; an
    // audit-log hiccup shouldn't surface as if the whole thing failed.
  }
}

// Blocks disabling or deleting the last Owner/Admin — the same failure
// mode 0008_protect_last_owner_admin.sql already guards against for
// role changes, but that trigger only fires on user_roles writes.
// Disabling never touches user_roles at all (pure auth.users state),
// so there's no existing DB-level protection for it; this is that
// check, done in app code before either action proceeds.
async function assertNotLastOwnerAdmin(userId: string, verb: string) {
  const supabase = await createClient();
  const { data: targetRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  if (targetRole?.role !== "owner_admin") return;

  const { count } = await supabase
    .from("user_roles")
    .select("user_id", { count: "exact", head: true })
    .eq("role", "owner_admin");

  if ((count ?? 0) <= 1) {
    throw new Error(`Can't be ${verb} — they're the last Owner/Admin. Promote someone else first.`);
  }
}

export async function inviteUser(email: string, role: UserRole) {
  await requireOwnerAdmin();

  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) throw new Error("Enter an email address.");

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(trimmedEmail);
  if (error) throw new Error(error.message);

  // handle_new_user (0001) already created their profiles row via the
  // auth.users insert trigger — this just assigns their starting role.
  const supabase = await createClient();
  const { error: roleError } = await supabase
    .from("user_roles")
    .upsert({ user_id: data.user.id, role }, { onConflict: "user_id" });
  if (roleError) throw new Error(roleError.message);

  await logAdminAction("user.invited", data.user.id, `Invited ${trimmedEmail} as ${role}`);
  revalidatePath("/admin");
}

export async function setUserBanned(userId: string, email: string, banned: boolean) {
  await requireOwnerAdmin();
  if (banned) await assertNotLastOwnerAdmin(userId, "disabled");

  const admin = createAdminClient();
  // GoTrue's ban_duration has no literal "forever" — a very long
  // duration (~100 years) serves as the de facto permanent disable
  // until explicitly re-enabled with "none".
  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: banned ? "876000h" : "none",
  });
  if (error) throw new Error(error.message);

  await logAdminAction(
    banned ? "user.disabled" : "user.enabled",
    userId,
    `${banned ? "Disabled" : "Re-enabled"} ${email}'s account`
  );
  revalidatePath("/admin");
}

export async function deleteUserAccount(userId: string, email: string) {
  const caller = await requireOwnerAdmin();
  if (userId === caller.id) throw new Error("You can't delete your own account.");
  await assertNotLastOwnerAdmin(userId, "deleted");

  const admin = createAdminClient();
  // shouldSoftDelete intentionally omitted — "Delete" here is meant to
  // be permanent, distinct from "Disable" which is the reversible one.
  // Evidence, reviews, comments, audit entries etc. they're attributed
  // to all survive this (see 0022_user_delete_preserves_history.sql) —
  // only the account itself and things *about* the account (profile,
  // role, supplier access) go with it.
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);

  await logAdminAction("user.deleted", userId, `Deleted ${email}'s account`);
  revalidatePath("/admin");
}

// Sends Supabase's standard password-reset email — no service_role
// needed for this one, resetPasswordForEmail works for any address on
// the regular client the same way sign-up/invite emails already do.
export async function resetUserPassword(email: string) {
  await requireOwnerAdmin();

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw new Error(error.message);

  await logAdminAction("user.password_reset_sent", email, `Sent a password reset email to ${email}`);
}

export async function resetUserMfa(userId: string, email: string) {
  await requireOwnerAdmin();

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.mfa.listFactors({ userId });
  if (error) throw new Error(error.message);

  for (const factor of data.factors) {
    const { error: deleteError } = await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId });
    if (deleteError) throw new Error(deleteError.message);
  }

  await logAdminAction(
    "user.mfa_reset",
    userId,
    `Reset MFA for ${email} (removed ${data.factors.length} factor${data.factors.length === 1 ? "" : "s"}) — they'll be prompted to re-enrol next sign-in`
  );
  revalidatePath("/admin");
}
