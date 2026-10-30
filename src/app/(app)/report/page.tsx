import { redirect } from "next/navigation";
import { PrintButton } from "@/components/PrintButton";
import { getProgressReport } from "@/lib/caf-data/queries";
import { createClient } from "@/lib/supabase/server";
import { getSessionAndRole } from "@/lib/auth";

// Board-facing progress report — Owner/Admin and GRC only (management/
// oversight roles), same reasoning as why /admin is owner_admin-only.
// A live page rather than a static export, deliberately: keeps the
// same "a link into the tool" approach already used elsewhere (e.g.
// why the future Ofgem-assessor role was designed as a scoped role
// rather than a PDF hand-off) — the data stays current and RLS/audit
// stays intact. The CSV download and Print/Save-as-PDF button below
// are there for circulating a point-in-time copy when that's what's
// actually needed, without that being the only way to see this.
export default async function ReportPage() {
  const { role } = await getSessionAndRole();
  if (role !== "owner_admin" && role !== "grc") redirect("/");

  const supabase = await createClient();
  const report = await getProgressReport(supabase);

  return (
    <>
      <div className="page-header-row no-print">
        <div>
          <h1 className="page-title">Progress Report</h1>
          <p className="page-sub">
            Rolled up across {report.totalScopeItems} scope item
            {report.totalScopeItems === 1 ? "" : "s"} (excludes the
            Enterprise-wide default — see that item&apos;s own page for
            organisation-wide policy status). Generated {report.generatedAt}.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a className="btn-secondary" href="/report/download">
            Download CSV
          </a>
          <PrintButton />
        </div>
      </div>

      {/* Print-only heading — the page-header-row above is hidden when
          printing (no-print), so the printed copy still gets a title. */}
      <div className="print-only">
        <h1 className="page-title">Progress Report</h1>
        <p className="page-sub">
          Rolled up across {report.totalScopeItems} scope item
          {report.totalScopeItems === 1 ? "" : "s"}. Generated {report.generatedAt}.
        </p>
      </div>

      {report.sections.map((sec) => (
        <div key={sec.code} style={{ marginBottom: 28 }}>
          <h2 className="page-title" style={{ fontSize: 16 }}>
            Section {sec.code} — {sec.name}
          </h2>
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Outcome</th>
                <th>Achieved</th>
                <th>Partially achieved</th>
                <th>Not achieved</th>
                <th>Not started</th>
                <th>Not applicable</th>
              </tr>
            </thead>
            <tbody>
              {sec.outcomes.map((o) => (
                <tr key={o.code}>
                  <td className="mono">{o.code}</td>
                  <td>{o.name}</td>
                  <td>{o.achieved}</td>
                  <td>{o.partial}</td>
                  <td>{o.not}</td>
                  <td>{o.none}</td>
                  <td>{o.notApplicable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}
