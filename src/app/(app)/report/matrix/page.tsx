import { redirect } from "next/navigation";
import { PrintButton } from "@/components/PrintButton";
import { ScopeItemMatrixPicker } from "@/components/ScopeItemMatrixPicker";
import { getOutcomeStatementMatrix, getScopeItems } from "@/lib/caf-data/queries";
import {
  profileMetStatusClass,
  profileMetStatusLabel,
  requiredLevelClass,
  requiredLevelLabel,
  statementStatusClass,
  statementStatusLabel,
  type OutcomeMatrixOutcome,
} from "@/lib/caf-data/types";
import { createClient } from "@/lib/supabase/server";
import { getSessionAndRole } from "@/lib/auth";

function Cell({ outcome, row }: { outcome: OutcomeMatrixOutcome; row: number }) {
  const cell = outcome.cells[row];
  if (!cell) return <td className="matrix-blank" />;
  return (
    <td>
      <span className={`status ${statementStatusClass[cell.status]}`}>{statementStatusLabel[cell.status]}</span>
      {cell.isEnterpriseWide && <span className="fmeta">org default</span>}
    </td>
  );
}

// Same shape as Simon's own tracking sheet — outcomes across the top,
// numbered sub-checks down the side, BP/EP baseline per outcome, one
// section per (printed) page. A different thing from /report: this is
// one scope item's own real answers (with the usual enterprise-wide
// fallback), not a cross-scope rollup — see getOutcomeStatementMatrix.
export default async function OutcomeMatrixPage({
  searchParams,
}: {
  searchParams: Promise<{ scopeItemId?: string }>;
}) {
  const { role } = await getSessionAndRole();
  if (role !== "owner_admin" && role !== "grc") redirect("/");

  const supabase = await createClient();
  const scopeItems = await getScopeItems(supabase);
  if (scopeItems.length === 0) {
    return <p className="page-sub">No scope items yet.</p>;
  }

  const { scopeItemId: requestedId } = await searchParams;
  const selected = scopeItems.find((s) => s.id === requestedId) ?? scopeItems[0];
  const sections = await getOutcomeStatementMatrix(supabase, selected.id);

  return (
    <>
      <div className="page-header-row no-print">
        <div>
          <h1 className="page-title">Outcome Matrix</h1>
          <p className="page-sub">
            One scope item&apos;s own sub-check answers, laid out the way SGN&apos;s own tracking sheet does —
            outcomes across the top, numbered sub-checks down the side.{" "}
            <a href="/report" style={{ color: "var(--accent)" }}>
              Back to the cross-scope Report
            </a>
            .
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <ScopeItemMatrixPicker
            scopeItems={scopeItems.map((s) => ({ id: s.id, name: s.isEnterprise ? "Enterprise-wide" : s.name }))}
            selectedId={selected.id}
          />
          <PrintButton />
        </div>
      </div>

      <div className="print-only">
        <h1 className="page-title">Outcome Matrix — {selected.isEnterprise ? "Enterprise-wide" : selected.name}</h1>
      </div>

      {sections.map((sec) => (
        <section key={sec.code} className="matrix-section">
          <div className="card-head">
            <h2 className="page-title" style={{ fontSize: 16 }}>
              Section {sec.code} — {sec.name}
            </h2>
            <div className="meta-row" style={{ margin: 0 }}>
              <span className="meta-pill">
                BP Status:{" "}
                <span className={`status ${profileMetStatusClass[sec.bpSectionStatus]}`}>
                  {profileMetStatusLabel[sec.bpSectionStatus]}
                </span>
              </span>
              <span className="meta-pill">
                EP Status:{" "}
                <span className={`status ${profileMetStatusClass[sec.epSectionStatus]}`}>
                  {profileMetStatusLabel[sec.epSectionStatus]}
                </span>
              </span>
            </div>
          </div>

          <div className="matrix-scroll">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th className="matrix-row-label">Outcome</th>
                  {sec.outcomes.map((o) => (
                    <th key={o.code} className="mono" title={o.name}>
                      {o.code}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th className="matrix-row-label">BP baseline</th>
                  {sec.outcomes.map((o) => (
                    <th key={o.code} className={o.bpRequiredLevel ? requiredLevelClass[o.bpRequiredLevel] : ""}>
                      {o.bpRequiredLevel ? requiredLevelLabel[o.bpRequiredLevel] : "—"}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th className="matrix-row-label">EP baseline</th>
                  {sec.outcomes.map((o) => (
                    <th key={o.code} className={o.epRequiredLevel ? requiredLevelClass[o.epRequiredLevel] : ""}>
                      {o.epRequiredLevel ? requiredLevelLabel[o.epRequiredLevel] : "—"}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th className="matrix-row-label">Sub-check</th>
                  {sec.outcomes.map((o) => (
                    <th key={o.code} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: sec.maxRow }, (_, i) => i + 1).map((row) => (
                  <tr key={row}>
                    <td className="matrix-row-label mono">{row}</td>
                    {sec.outcomes.map((o) => (
                      <Cell key={o.code} outcome={o} row={row} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </>
  );
}
