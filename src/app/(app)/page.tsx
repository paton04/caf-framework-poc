import { redirect } from "next/navigation";
import { Heatmap } from "@/components/Heatmap";
import { SupplierIgpList } from "@/components/SupplierIgpList";
import { getInternalUsers, getSections, getSupplierIgps } from "@/lib/caf-data/queries";
import { createClient } from "@/lib/supabase/server";
import { getSessionAndRole } from "@/lib/auth";

export default async function OverviewPage() {
  const { user, role } = await getSessionAndRole();
  if (!user) redirect("/login");

  if (role === null) {
    return (
      <div className="banner">
        Your account doesn&apos;t have a role assigned yet. Contact your
        Owner/Admin — they can set this from the admin page.
      </div>
    );
  }

  if (role === "supplier") {
    const igps = await getSupplierIgps(await createClient(), user.id);
    return (
      <>
        <h1 className="page-title">Your assigned indicators</h1>
        <p className="page-sub">
          Submit evidence against the indicators you&apos;ve been given
          access to. Internal narrative and status aren&apos;t visible to
          supplier accounts.
        </p>
        <SupplierIgpList igps={igps} />
      </>
    );
  }

  const supabase = await createClient();
  const [sections, internalUsers] = await Promise.all([
    getSections(supabase),
    getInternalUsers(supabase),
  ]);

  return (
    <>
      <h1 className="page-title">Assessment overview</h1>
      <p className="page-sub">
        Status across all CAF sections for the current cycle. Click any
        indicator to view or update its evidence.
      </p>
      <Heatmap sections={sections} internalUsers={internalUsers} />
    </>
  );
}
