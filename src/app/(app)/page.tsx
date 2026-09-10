import { redirect } from "next/navigation";
import { Heatmap } from "@/components/Heatmap";
import { SupplierIgpList } from "@/components/SupplierIgpList";
import { getSections, getSupplierIgps } from "@/lib/caf-data/queries";
import { createClient } from "@/lib/supabase/server";
import { getSessionAndRole } from "@/lib/auth";

export default async function OverviewPage() {
  const { user, role } = await getSessionAndRole();
  if (!user) redirect("/login");

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

  const sections = await getSections(await createClient());

  return (
    <>
      <h1 className="page-title">Assessment overview</h1>
      <p className="page-sub">
        Status across all CAF sections for the current cycle. Click any
        indicator to view or update its evidence.
      </p>
      <Heatmap sections={sections} />
    </>
  );
}
