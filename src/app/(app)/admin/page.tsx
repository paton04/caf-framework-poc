import { redirect } from "next/navigation";
import { AdminPanel } from "@/components/AdminPanel";
import {
  getAllIgpCodes,
  getAuditLog,
  getProfilesWithRoles,
  getSuppliers,
} from "@/lib/caf-data/queries";
import { createClient } from "@/lib/supabase/server";
import { getSessionAndRole } from "@/lib/auth";

export default async function AdminPage() {
  const { role } = await getSessionAndRole();
  if (role !== "owner_admin") redirect("/");

  const supabase = await createClient();
  const [profiles, igps, suppliers, auditLog] = await Promise.all([
    getProfilesWithRoles(supabase),
    getAllIgpCodes(supabase),
    getSuppliers(supabase),
    getAuditLog(supabase),
  ]);

  const supplierAccess = Object.fromEntries(suppliers.map((s) => [s.userId, s.igpCodes]));

  return (
    <>
      <h1 className="page-title">Admin</h1>
      <p className="page-sub">
        Set each invited user&apos;s role, and which indicators supplier
        accounts can access. New accounts are still invited via the Supabase
        dashboard — this only manages what they can do once they&apos;ve
        signed up.
      </p>
      <AdminPanel profiles={profiles} igps={igps} supplierAccess={supplierAccess} />

      <h2 className="page-title" style={{ fontSize: 16, marginTop: 36 }}>
        Activity log
      </h2>
      <p className="page-sub">
        Every significant action, most recent first — evidence review,
        assessment updates, scope changes, and role/access changes. Written
        automatically; nothing, including this account, can edit or delete
        an entry once it exists.
      </p>
      <table>
        <thead>
          <tr>
            <th>When</th>
            <th>Who</th>
            <th>What happened</th>
          </tr>
        </thead>
        <tbody>
          {auditLog.length === 0 && (
            <tr>
              <td colSpan={3}>No activity logged yet.</td>
            </tr>
          )}
          {auditLog.map((entry) => (
            <tr key={entry.id}>
              <td className="mono" style={{ whiteSpace: "nowrap" }}>
                {entry.createdAt}
              </td>
              <td>{entry.actorEmail ?? "—"}</td>
              <td>{entry.summary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
