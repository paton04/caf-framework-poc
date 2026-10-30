import { TopNav } from "@/components/TopNav";
import { NotificationStrip } from "@/components/NotificationStrip";
import { getSessionAndRole } from "@/lib/auth";
import { getAnnouncement, getNotifications } from "@/lib/caf-data/queries";
import { createClient } from "@/lib/supabase/server";

export default async function AppShellLayout({ children }: { children: React.ReactNode }) {
  const { user, role } = await getSessionAndRole();
  const supabase = user ? await createClient() : null;
  const announcement = supabase ? await getAnnouncement(supabase) : null;
  const notifications = supabase && user && role ? await getNotifications(supabase, user.id, role) : [];

  return (
    <div className="shell">
      <TopNav role={role} email={user?.email ?? null} />
      {announcement && <div className="announcement-banner">{announcement}</div>}
      {notifications.length > 0 && <NotificationStrip notifications={notifications} />}
      <main className="content">{children}</main>
    </div>
  );
}
