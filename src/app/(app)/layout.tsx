import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";

// TODO(Epic 7): replace the role pill below with the signed-in user's real
// org/role once RBAC is wired up. Auth itself is real as of Epic 1.
export default async function AppShellLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div className="org">
            <strong>Assurance Register</strong> — CAF Self-Assessment (Trial)
          </div>
          <div className="topbar-right">
            <div className="role-pill">{user?.email ?? "SIGNED IN"}</div>
            <form action={signOut}>
              <button className="link-btn" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </div>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
