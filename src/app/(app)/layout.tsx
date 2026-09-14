import { Sidebar } from "@/components/Sidebar";
import { signOut } from "@/app/actions/auth";
import { getSessionAndRole } from "@/lib/auth";
import { getAnnouncement } from "@/lib/caf-data/queries";
import { createClient } from "@/lib/supabase/server";

const ROLE_LABEL: Record<string, string> = {
  owner_admin: "Owner/Admin",
  contributor: "Contributor",
  supplier: "Supplier",
};

export default async function AppShellLayout({ children }: { children: React.ReactNode }) {
  const { user, role } = await getSessionAndRole();
  const announcement = user ? await getAnnouncement(await createClient()) : null;

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
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
