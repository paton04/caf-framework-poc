import { redirect } from "next/navigation";
import { PrintButton } from "@/components/PrintButton";
import { getProgressReport } from "@/lib/caf-data/queries";
import { createClient } from "@/lib/supabase/server";
import { getSessionAndRole } from "@/lib/auth";
import { profileMetStatusClass, profileMetStatusLabel, type ProgressReportOutcome } from "@/lib/caf-data/types";

// What's actually assessed per outcome, in brief — shown under each
// Met/Not met pill so the verdict isn't a black box.
function breakdown(o: ProgressReportOutcome): string {
  const parts = [
    o.achieved && `${o.achieved} achieved`,
    o.partial && `${o.partial} partially achieved`,
    o.not && `${o.not} not achieved`,
    o.none && `${o.none} not started`,
    o.notApplicable && `${o.notApplicable} N/A`,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "No scope items";
}

function StatusCell({ status, detail }: { status: ProgressReportOutcome["bpStatus"]; detail: string }) {
  return (
    <td>
      <span className={`status ${profileMetStatusClass[status]}`}>{profileMetStatusLabel[status]}</span>
      <div className="fmeta">{detail}</div>
    </td>
  );
}

// Board-facing progress report — Owner/Admin and GRC only (management/
// oversight roles), same reasoning as why /admin is owner_admin-only.
// A live page rather than a static export, deliberately: keeps the
// same "a link into the tool" approach already used elsewhere (e.g.
// why the future Ofgem-assessor role was designed as a scoped role
// rather than a PDF hand-off) — the data stays current and RLS/audit
// stays intact. The Excel download and Print/Save-as-PDF button below
// are there for circulating a point-in-time copy when that's what's
// actually needed, without that being the only way to see this.
//
// Shape (rebuilt 2026-10-31): Met/Not met against the Basic/Enhanced
// Profile required level per outcome, not raw status counts — matches
// both SGN's own board sheet (BP Status: Met / EP Status: Met) and the
// UK government's own GovAssure CAF board-reporting template ("Summary
// of Contributing Outcomes and Target CAF Profile Achievement"). See
// docs/v2-rearchitecture-design.md and the 2026-10-31 project memory
// entry for the research behind this. Rolled up across every scope item
// (not a per-item view) — the real question this answers is "is the
// organisation tracking to what Ofgem requires", not how one system is
// doing; that's what /scope/[id] is for.
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
            Download Excel
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

      <div className="meta-row">
        <span className="meta-pill">
          Basic Profile: {report.bpMetCount} of {report.bpTargetCount} outcomes met
        </span>
        <span className="meta-pill">
          Enhanced Profile: {report.epMetCount} of {report.epTargetCount} outcomes met
        </span>
      </div>

      <div className="banner">
        Required levels are currently an indicative placeholder, not
        confirmed Ofgem/DESNZ figures — real per-outcome targets aren&apos;t
        publicly published and haven&apos;t yet been confirmed with Ofgem
        directly. A &quot;Not met&quot; here may reflect that placeholder
        rather than a real compliance gap. Adjust required levels under
        Admin once confirmed.
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
                <th>Basic Profile</th>
                <th>Enhanced Profile</th>
              </tr>
            </thead>
            <tbody>
              {sec.outcomes.map((o) => {
                const detail = breakdown(o);
                return (
                  <tr key={o.code}>
                    <td className="mono">{o.code}</td>
                    <td>{o.name}</td>
                    <StatusCell status={o.bpStatus} detail={detail} />
                    <StatusCell status={o.epStatus} detail={detail} />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}
