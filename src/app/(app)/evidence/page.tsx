import { redirect } from "next/navigation";
import { EvidenceLibrary } from "@/components/EvidenceLibrary";
import { getEvidenceLibrary } from "@/lib/caf-data/queries";
import { createClient } from "@/lib/supabase/server";
import { getSessionAndRole } from "@/lib/auth";

// Internal roles only — allow-listed so an unassigned account (role ===
// null) is denied too, not silently treated as internal.
export default async function EvidencePage() {
  const { role } = await getSessionAndRole();
  if (role !== "owner_admin" && role !== "contributor") redirect("/");

  const evidenceLibrary = await getEvidenceLibrary(await createClient());

  return (
    <>
      <h1 className="page-title">Evidence library</h1>
      <p className="page-sub">
        All evidence submitted against indicators this cycle, in one place.
        Click a row to review it.
      </p>
      {role !== "owner_admin" && (
        <div className="banner">
          You can view evidence and its review status here, but only an
          Owner/Admin can approve or reject it.
        </div>
      )}
      <EvidenceLibrary rows={evidenceLibrary} canReview={role === "owner_admin"} />
    </>
  );
}
