import { redirect } from "next/navigation";
import { AdminPanel } from "@/components/AdminPanel";
import { AnnouncementForm } from "@/components/AnnouncementForm";
import {
  getAllIgpCodes,
  getAnnouncement,
  getAuditLog,
  getProfilesWithRoles,
  getSuppliers,
} from "@/lib/caf-data/queries";
import { getAdminUserStatuses } from "@/lib/caf-data/admin-queries";
import { createClient } from "@/lib/supabase/server";
import { getSessionAndRole } from "@/lib/auth";

export default async function AdminPage() {
  const { user, role } = await getSessionAndRole();
  if (role !== "owner_admin") redirect("/");

  const supabase = await createClient();
  // User statuses needs the service_role key (SUPABASE_SERVICE_ROLE_KEY)
  // — not set up yet on a fresh environment, so this degrades to "no
  // status known" rather than breaking the whole page if it's missing.
  const [profiles, igps, suppliers, auditLog, announcement, userStatuses] = await Promise.all([
    getProfilesWithRoles(supabase),
    getAllIgpCodes(supabase),
    getSuppliers(supabase),
    getAuditLog(supabase),
    getAnnouncement(supabase),
    getAdminUserStatuses().catch(() => null),
  ]);

  const supplierAccess = Object.fromEntries(suppliers.map((s) => [s.userId, s.igpCodes]));

  return (
    <>
      <h1 className="page-title">Admin</h1>
      <p className="page-sub">
        Invite accounts, set each user&apos;s role, disable or delete an
        account, and reset a password or MFA enrolment on someone&apos;s
        behalf. Also sets which indicators supplier accounts can access.
      </p>
      <AdminPanel
        profiles={profiles}
        igps={igps}
        supplierAccess={supplierAccess}
        userStatuses={userStatuses}
        currentUserId={user?.id ?? null}
      />

      <h2 className="page-title" style={{ fontSize: 16, marginTop: 36 }}>
        Announcement
      </h2>
      <p className="page-sub">Shown to everyone signed in, until cleared.</p>
      <AnnouncementForm current={announcement} />

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
