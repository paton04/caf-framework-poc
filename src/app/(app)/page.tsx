"use client";

import { useState } from "react";
import { IgpPanel } from "@/components/IgpPanel";
import {
  type EvidenceFile,
  type Igp,
  type IgpStatus,
  sections as seedSections,
  statusClass,
  statusLabel,
} from "@/lib/caf-data/seed";

interface Selection {
  sectionCode: string;
  igpId: string;
}

export default function OverviewPage() {
  const [sections, setSections] = useState(seedSections);
  const [selection, setSelection] = useState<Selection | null>(null);

  const selectedIgp: Igp | null = selection
    ? sections
        .find((s) => s.code === selection.sectionCode)
        ?.principles.find((p) => p.id === selection.igpId) ?? null
    : null;

  function updateSelectedIgp(patch: Partial<Igp>) {
    if (!selection) return;
    setSections((prev) =>
      prev.map((sec) =>
        sec.code !== selection.sectionCode
          ? sec
          : {
              ...sec,
              principles: sec.principles.map((p) =>
                p.id !== selection.igpId ? p : { ...p, ...patch }
              ),
            }
      )
    );
  }

  return (
    <>
      <h1 className="page-title">Assessment overview</h1>
      <p className="page-sub">
        Status across all CAF sections for the current cycle. Click any
        indicator to view or update its evidence.
      </p>

      <div className="heatmap-wrap">
        {sections.map((sec) => (
          <div className="heatmap-row" key={sec.code}>
            <div className="section-label">
              <div className="code">SECTION {sec.code}</div>
              <div className="name">{sec.name}</div>
            </div>
            <div className="principle-grid">
              {sec.principles.map((p) => (
                <button
                  key={p.id}
                  className="cell"
                  onClick={() => setSelection({ sectionCode: sec.code, igpId: p.id })}
                >
                  <div className="pid">{p.id}</div>
                  <div className="pname">{p.name}</div>
                  <div className={`status ${statusClass[p.status]}`}>
                    {statusLabel[p.status]}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="legend">
        <span>
          <span className="dot" style={{ background: "var(--achieved)" }} />
          Achieved
        </span>
        <span>
          <span className="dot" style={{ background: "var(--partial)" }} />
          Partially achieved
        </span>
        <span>
          <span className="dot" style={{ background: "var(--not-achieved)" }} />
          Not achieved
        </span>
        <span>
          <span className="dot" style={{ background: "var(--not-started)" }} />
          Not started
        </span>
      </div>

      <IgpPanel
        igp={selectedIgp}
        open={selectedIgp !== null}
        onClose={() => setSelection(null)}
        onStatusChange={(status: IgpStatus) => updateSelectedIgp({ status })}
        onNarrativeChange={(narrative: string) => updateSelectedIgp({ narrative })}
        onOwnerChange={(owner: string) => updateSelectedIgp({ owner })}
        onAddEvidence={(file: EvidenceFile) =>
          updateSelectedIgp({
            evidence: [...(selectedIgp?.evidence ?? []), file],
          })
        }
      />
    </>
  );
}
