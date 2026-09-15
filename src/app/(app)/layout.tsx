import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { signOut } from "@/app/actions/auth";
import { getSessionAndRole } from "@/lib/auth";
import { getAnnouncement, getNotifications } from "@/lib/caf-data/queries";
import { createClient } from "@/lib/supabase/server";

const ROLE_LABEL: Record<string, string> = {
  owner_admin: "Owner/Admin",
  contributor: "Contributor",
  supplier: "Supplier",
  grc: "GRC",
};

export default async function AppShellLayout({ children }: { children: React.ReactNode }) {
  const { user, role } = await getSessionAndRole();
  const supabase = user ? await createClient() : null;
  const announcement = supabase ? await getAnnouncement(supabase) : null;
  const notifications = supabase && user && role ? await getNotifications(supabase, user.id, role) : [];

  return (
    <div className="shell">
      <Sidebar role={role} />
      <div className="main">
        <div className="topbar">
          <div className="org">
            <strong>Assurance Register</strong> — CAF Self-Assessment (Trial)
          </div>
          <div className="topbar-right">
            <div className="role-pill">
              {user?.email ?? "SIGNED IN"} — {role ? ROLE_LABEL[role] : "No role assigned"}
            </div>
            <form action={signOut}>
              <button className="link-btn" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </div>
        {announcement && <div className="announcement-banner">{announcement}</div>}
        {notifications.length > 0 && (
          <div className="notification-strip">
            {notifications.map((n) => (
              <Link key={n.id} href={n.href} className="notification-item">
                {n.message}
              </Link>
            ))}
          </div>
        )}
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
