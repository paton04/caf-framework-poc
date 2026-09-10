import { redirect } from "next/navigation";
import { getEvidenceLibrary } from "@/lib/caf-data/queries";
import { createClient } from "@/lib/supabase/server";
import { getSessionAndRole } from "@/lib/auth";

// Review status / expiry tracking (the columns the old demo data had)
// isn't part of the schema yet — that's Epic 3's evidence-review workflow.
// This just lists what's actually been uploaded, for now.
//
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
      </p>
      <table>
        <thead>
          <tr>
            <th>File</th>
            <th>Linked indicator</th>
            <th>Uploaded</th>
          </tr>
        </thead>
        <tbody>
          {evidenceLibrary.map((row) => (
            <tr key={row.id}>
              <td>{row.file}</td>
              <td className="mono">{row.linkedIgp}</td>
              <td>{row.uploaded}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
