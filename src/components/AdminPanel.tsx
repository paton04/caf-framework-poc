"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setSupplierAccess, setUserRole } from "@/app/actions/admin";
import type { ProfileWithRole, UserRole } from "@/lib/caf-data/types";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "owner_admin", label: "Owner/Admin" },
  { value: "contributor", label: "Contributor" },
  { value: "supplier", label: "Supplier" },
];

interface AdminPanelProps {
  profiles: ProfileWithRole[];
  igps: { code: string; name: string }[];
  supplierAccess: Record<string, string[]>;
}

// Role changes and supplier-access assignments both go straight to
// Supabase — RLS restricts who can actually write these tables to
// owner_admin, this is just the interface for it. The role select reads
// straight from the `profiles` prop rather than mirroring it into local
// state, so a failed change (e.g. demoting the last Owner/Admin, blocked
// by a DB trigger) just leaves it showing the real, unchanged value
// instead of needing a manual revert.
export function AdminPanel({ profiles, igps, supplierAccess }: AdminPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [access, setAccess] = useState<Record<string, string[]>>(supplierAccess);

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

  return (
    <>
      {error && <div className="banner auth-error">{error}</div>}
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((p) => (
            <Fragment key={p.id}>
              <tr>
                <td>{p.email}</td>
                <td>
                  <select
                    value={p.role ?? ""}
                    disabled={savingUserId === p.id}
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
              </tr>
              {p.role === "supplier" && (
                <tr>
                  <td colSpan={2}>
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
          ))}
        </tbody>
      </table>
    </>
  );
}
