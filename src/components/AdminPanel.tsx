"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setSupplierAccess, setUserRole } from "@/app/actions/admin";
import {
  deleteUserAccount,
  inviteUser,
  resetUserMfa,
  resetUserPassword,
  setUserBanned,
} from "@/app/actions/user-admin";
import type { AdminUserStatus, ProfileWithRole, UserRole } from "@/lib/caf-data/types";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "owner_admin", label: "Owner/Admin" },
  { value: "contributor", label: "Contributor" },
  { value: "grc", label: "GRC" },
  { value: "supplier", label: "Supplier" },
];

interface AdminPanelProps {
  profiles: ProfileWithRole[];
  igps: { code: string; name: string }[];
  supplierAccess: Record<string, string[]>;
  // null means the service_role key isn't configured yet (see
  // src/lib/supabase/admin.ts) — the invite/disable/delete/reset
  // controls below degrade to a plain explanation rather than offering
  // actions that would just fail.
  userStatuses: Map<string, AdminUserStatus> | null;
  currentUserId: string | null;
}

// Role changes and supplier-access assignments both go straight to
// Supabase — RLS restricts who can actually write these tables to
// owner_admin, this is just the interface for it. The role select reads
// straight from the `profiles` prop rather than mirroring it into local
// state, so a failed change (e.g. demoting the last Owner/Admin, blocked
// by a DB trigger) just leaves it showing the real, unchanged value
// instead of needing a manual revert.
//
// Invite/disable/delete/reset-password/reset-MFA are different in kind
// from the above — they go through the Supabase Admin API (service_role,
// bypasses RLS entirely), not ordinary RLS-governed tables, so each
// action re-checks the caller is owner_admin itself server-side (see
// src/app/actions/user-admin.ts) rather than relying on RLS the way
// everything else here does.
export function AdminPanel({ profiles, igps, supplierAccess, userStatuses, currentUserId }: AdminPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [access, setAccess] = useState<Record<string, string[]>>(supplierAccess);

  const [inviting, setInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("contributor");

  function handleRoleChange(userId: string, role: UserRole) {
    setError(null);
    setSavingUserId(userId);
    startTransition(async () => {
      try {
        await setUserRole(userId, role);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        setSavingUserId(null);
      }
    });
  }

  function toggleIgp(userId: string, code: string) {
    setAccess((prev) => {
      const current = prev[userId] ?? [];
      const next = current.includes(code)
        ? current.filter((c) => c !== code)
        : [...current, code];
      return { ...prev, [userId]: next };
    });
  }

  function handleSaveAccess(userId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await setSupplierAccess(userId, access[userId] ?? []);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  function run(userId: string, action: () => Promise<void>, successNotice?: string) {
    setError(null);
    setNotice(null);
    setSavingUserId(userId);
    startTransition(async () => {
      try {
        await action();
        if (successNotice) setNotice(successNotice);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        setSavingUserId(null);
      }
    });
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    startTransition(async () => {
      try {
        await inviteUser(inviteEmail, inviteRole);
        setInviteEmail("");
        setInviting(false);
        setNotice(`Invited ${inviteEmail}.`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  function handleDelete(userId: string, email: string) {
    if (!window.confirm(`Permanently delete ${email}'s account? This can't be undone.`)) return;
    run(userId, () => deleteUserAccount(userId, email), `Deleted ${email}.`);
  }

  return (
    <>
      {error && <div className="banner auth-error">{error}</div>}
      {notice && <div className="banner">{notice}</div>}

      {userStatuses === null && (
        <div className="banner" style={{ marginBottom: 16 }}>
          Invite/disable/delete/reset-password/reset-MFA need
          SUPABASE_SERVICE_ROLE_KEY set (not a regular env var — it has
          full admin access, so it only ever lives server-side, never in
          the browser). Add it to <code className="mono">.env.local</code>{" "}
          (and Vercel&apos;s project env vars for production), from the
          Supabase dashboard: Project Settings → API → service_role
          secret. Role and supplier-access management below still work
          without it.
        </div>
      )}

      {userStatuses !== null &&
        (inviting ? (
          <form onSubmit={handleInvite} className="field" style={{ marginBottom: 16, maxWidth: 420 }}>
            <label>Invite a new account</label>
            <input
              className="narrative-box"
              style={{ minHeight: "auto" }}
              type="email"
              placeholder="email@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
            <div className="status-select" style={{ marginTop: 8 }}>
              {ROLE_OPTIONS.map((r) => (
                <button
                  type="button"
                  key={r.value}
                  className={`status-opt ${inviteRole === r.value ? "sel-neutral" : ""}`}
                  onClick={() => setInviteRole(r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button type="submit" className="btn-primary" disabled={isPending}>
                {isPending ? "Sending invite…" : "Send invite"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={isPending}
                onClick={() => {
                  setInviting(false);
                  setError(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button type="button" className="btn-primary" style={{ marginBottom: 16 }} onClick={() => setInviting(true)}>
            + Invite user
          </button>
        ))}

      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            {userStatuses !== null && (
              <>
                <th>Status</th>
                <th>Actions</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {profiles.map((p) => {
            const status = userStatuses?.get(p.id);
            const isSelf = p.id === currentUserId;
            const rowBusy = savingUserId === p.id && isPending;
            return (
              <Fragment key={p.id}>
                <tr>
                  <td>{p.email}</td>
                  <td>
                    <select
                      value={p.role ?? ""}
                      disabled={rowBusy}
                      onChange={(e) => handleRoleChange(p.id, e.target.value as UserRole)}
                    >
                      <option value="" disabled>
                        — none —
                      </option>
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  {userStatuses !== null && (
                    <>
                      <td>
                        {!status ? (
                          <span className="fmeta">Not found</span>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            {status.banned && <span className="status st-not">Disabled</span>}
                            <span className="fmeta">{status.mfaEnrolled ? "MFA enrolled" : "No MFA"}</span>
                            {status.lastSignInAt && (
                              <span className="fmeta">Last signed in {status.lastSignInAt}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        {status && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            <button
                              type="button"
                              className="btn-secondary"
                              disabled={rowBusy || isSelf}
                              title={isSelf ? "You can't disable your own account" : undefined}
                              onClick={() =>
                                run(
                                  p.id,
                                  () => setUserBanned(p.id, p.email, !status.banned),
                                  status.banned ? `Re-enabled ${p.email}.` : `Disabled ${p.email}.`
                                )
                              }
                            >
                              {status.banned ? "Enable" : "Disable"}
                            </button>
                            <button
                              type="button"
                              className="btn-secondary"
                              disabled={rowBusy}
                              onClick={() =>
                                run(
                                  p.id,
                                  () => resetUserPassword(p.email),
                                  `Sent a password reset email to ${p.email}.`
                                )
                              }
                            >
                              Reset password
                            </button>
                            {status.mfaEnrolled && (
                              <button
                                type="button"
                                className="btn-secondary"
                                disabled={rowBusy}
                                onClick={() =>
                                  run(p.id, () => resetUserMfa(p.id, p.email), `Reset MFA for ${p.email}.`)
                                }
                              >
                                Reset MFA
                              </button>
                            )}
                            <button
                              type="button"
                              className="link-btn"
                              disabled={rowBusy || isSelf}
                              title={isSelf ? "You can't delete your own account" : undefined}
                              onClick={() => handleDelete(p.id, p.email)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </>
                  )}
                </tr>
                {p.role === "supplier" && (
                  <tr>
                    <td colSpan={userStatuses !== null ? 4 : 2}>
                      <div className="field">
                        <label>Indicators {p.email} can access</label>
                        <div className="status-select">
                          {igps.map((igp) => (
                            <button
                              type="button"
                              key={igp.code}
                              className={`status-opt ${
                                (access[p.id] ?? []).includes(igp.code) ? "sel-achieved" : ""
                              }`}
                              onClick={() => toggleIgp(p.id, igp.code)}
                            >
                              {igp.code}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ marginTop: 10 }}
                          disabled={isPending}
                          onClick={() => handleSaveAccess(p.id)}
                        >
                          Save access
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
