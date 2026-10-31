import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { getSessionAndRole } from "@/lib/auth";
import { getProgressReport, getProgressReportDetailRows } from "@/lib/caf-data/queries";
import { profileMetStatusLabel, statusLabel } from "@/lib/caf-data/types";

// Same role gate as the report page itself (owner_admin/grc) — this
// route doesn't go through that page's own redirect, so it needs its
// own check rather than relying on it.
//
// A real two-sheet Excel workbook rather than a CSV with two stacked
// blocks — Fiona asked for Summary and Detail as separate tabs, which
// a plain CSV can't express (one file, one sheet).
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

  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.columns = [
    { header: "Section", key: "section", width: 10 },
    { header: "Code", key: "code", width: 10 },
    { header: "Outcome", key: "outcome", width: 44 },
    { header: "BP Status", key: "bp", width: 14 },
    { header: "EP Status", key: "ep", width: 14 },
    { header: "Achieved", key: "achieved", width: 10 },
    { header: "Partially achieved", key: "partial", width: 16 },
    { header: "Not achieved", key: "not", width: 12 },
    { header: "Not started", key: "none", width: 12 },
    { header: "Not applicable", key: "notApplicable", width: 14 },
  ];
  summarySheet.getRow(1).font = { bold: true };
  for (const sec of report.sections) {
    for (const o of sec.outcomes) {
      summarySheet.addRow({
        section: sec.code,
        code: o.code,
        outcome: o.name,
        bp: profileMetStatusLabel[o.bpStatus],
        ep: profileMetStatusLabel[o.epStatus],
        achieved: o.achieved,
        partial: o.partial,
        not: o.not,
        none: o.none,
        notApplicable: o.notApplicable,
      });
    }
  }

  const detailSheet = workbook.addWorksheet("Detail");
  detailSheet.columns = [
    { header: "Scope item", key: "scopeItem", width: 28 },
    { header: "Section", key: "section", width: 10 },
    { header: "Code", key: "code", width: 10 },
    { header: "Outcome", key: "outcome", width: 44 },
    { header: "Status", key: "status", width: 18 },
  ];
  detailSheet.getRow(1).font = { bold: true };
  for (const d of detailRows) {
    detailSheet.addRow({
      scopeItem: d.scopeItemName,
      section: d.sectionCode,
      code: d.outcomeCode,
      outcome: d.outcomeName,
      status: statusLabel[d.status],
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="caf-progress-report-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
