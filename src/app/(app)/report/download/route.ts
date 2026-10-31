import { createClient } from "@/lib/supabase/server";
import { getSessionAndRole } from "@/lib/auth";
import { getProgressReport, getProgressReportDetailRows } from "@/lib/caf-data/queries";
import { profileMetStatusLabel, statusLabel } from "@/lib/caf-data/types";

// Same role gate as the report page itself (owner_admin/grc) — this
// route doesn't go through that page's own redirect, so it needs its
// own check rather than relying on it.
function csvField(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export async function GET() {
  const { role } = await getSessionAndRole();
  if (role !== "owner_admin" && role !== "grc") {
    return new Response("Forbidden", { status: 403 });
  }

  const supabase = await createClient();
  const [report, detailRows] = await Promise.all([
    getProgressReport(supabase),
    getProgressReportDetailRows(supabase),
  ]);

  const rows: string[][] = [
    ["Summary — rolled up across all scope items"],
    [
      "Section",
      "Code",
      "Outcome",
      "Basic Profile status",
      "Enhanced Profile status",
      "Achieved",
      "Partially achieved",
      "Not achieved",
      "Not started",
      "Not applicable",
    ],
  ];
  for (const sec of report.sections) {
    for (const o of sec.outcomes) {
      rows.push([
        sec.code,
        o.code,
        o.name,
        profileMetStatusLabel[o.bpStatus],
        profileMetStatusLabel[o.epStatus],
        String(o.achieved),
        String(o.partial),
        String(o.not),
        String(o.none),
        String(o.notApplicable),
      ]);
    }
  }

  rows.push([], ["Detail — status by individual scope item"], ["Section", "Code", "Outcome", "Scope item", "Status"]);
  for (const d of detailRows) {
    rows.push([d.sectionCode, d.outcomeCode, d.outcomeName, d.scopeItemName, statusLabel[d.status]]);
  }

  const csv = rows.map((r) => r.map(csvField).join(",")).join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="caf-progress-report-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
