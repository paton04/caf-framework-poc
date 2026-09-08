import { Sidebar } from "@/components/Sidebar";

// TODO(Epic 7): replace the hardcoded org name and role pill below with the
// signed-in user's real org/role once auth + RBAC are wired up.
export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div className="org">
            <strong>SGN</strong> — CAF Self-Assessment (Trial)
          </div>
          <div className="role-pill">ROLE: SGN CONTRIBUTOR</div>
        </div>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
