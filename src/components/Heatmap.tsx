"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IgpPanel } from "@/components/IgpPanel";
import { addEvidence, updateAssessment } from "@/app/actions/igp";
import { type Igp, type IgpStatus, type Section, statusClass, statusLabel } from "@/lib/caf-data/types";

interface Selection {
  sectionCode: string;
  igpId: string;
}

// Owner/admin + contributor view. `sections` is the server-fetched source
// of truth — mutations go straight to Supabase via Server Actions, then
// router.refresh() re-fetches rather than the component tracking its own
// copy of the data.
interface InternalUser {
  id: string;
  email: string;
}

export function Heatmap({
  sections,
  internalUsers,
}: {
  sections: Section[];
  internalUsers: InternalUser[];
}) {
  const router = useRouter();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedIgp: Igp | null = selection
    ? sections
        .find((s) => s.code === selection.sectionCode)
        ?.principles.find((p) => p.id === selection.igpId) ?? null
    : null;

  const principles = sections.flatMap((s) => s.principles);
  const counts = {
    achieved: principles.filter((p) => p.status === "achieved").length,
    partial: principles.filter((p) => p.status === "partial").length,
    not: principles.filter((p) => p.status === "not").length,
    none: principles.filter((p) => p.status === "none").length,
  };
  const pendingEvidence = principles
    .flatMap((p) => p.evidence)
    .filter((e) => e.reviewStatus === "pending").length;

  function handleStatusChange(status: IgpStatus) {
    if (!selection) return;
    startTransition(async () => {
      await updateAssessment(selection.igpId, { status });
      router.refresh();
    });
  }

  function handleSaveDetails(narrative: string, owner: string, ownerId: string | null) {
    if (!selection) return;
    startTransition(async () => {
      await updateAssessment(selection.igpId, { narrative, owner, ownerId });
      router.refresh();
    });
  }

  function handleAddEvidence(formData: FormData) {
    if (!selection) return;
    startTransition(async () => {
      await addEvidence(selection.igpId, formData);
      router.refresh();
    });
  }

  return (
    <>
      <div className="progress-strip">
        <div className="stat-tile st-achieved">
          <div className="stat-num">{counts.achieved}</div>
          <div className="stat-label">Achieved</div>
        </div>
        <div className="stat-tile st-partial">
          <div className="stat-num">{counts.partial}</div>
          <div className="stat-label">Partially achieved</div>
        </div>
        <div className="stat-tile st-not">
          <div className="stat-num">{counts.not}</div>
          <div className="stat-label">Not achieved</div>
        </div>
        <div className="stat-tile st-none">
          <div className="stat-num">{counts.none}</div>
          <div className="stat-label">Not started</div>
        </div>
        <div className="stat-tile pending">
          <div className="stat-num">{pendingEvidence}</div>
          <div className="stat-label">Evidence pending review</div>
        </div>
      </div>

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
                  <div className={`status ${statusClass[p.status]}`}>{statusLabel[p.status]}</div>
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
        pending={isPending}
        internalUsers={internalUsers}
        onClose={() => setSelection(null)}
        onStatusChange={handleStatusChange}
        onSaveDetails={handleSaveDetails}
        onAddEvidence={handleAddEvidence}
      />
    </>
  );
}
