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

interface InternalUser {
  id: string;
  email: string;
}

// One scope item's own assessment. `sections` is the server-fetched
// source of truth — mutations go straight to Supabase via Server
// Actions, then router.refresh() re-fetches rather than the component
// tracking its own copy of the data.
export function Heatmap({
  scopeItemId,
  sections,
  internalUsers,
  commentableUsers,
}: {
  scopeItemId: string;
  sections: Section[];
  internalUsers: InternalUser[];
  commentableUsers: InternalUser[];
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

  // Group a section's outcomes into columns by principle — "B2.a" and
  // "B2.b" share a column, "B3.a" starts the next one — so you can see
  // at a glance where one principle's outcomes end and the next one's
  // begin, rather than everything flowing together in reading order.
  // sec.principles already arrives sorted by sort_order, so grouping by
  // first-seen order (a plain Map) keeps the right left-to-right order.
  function groupByPrinciple(sectionPrinciples: Igp[]) {
    const groups = new Map<string, Igp[]>();
    for (const p of sectionPrinciples) {
      const principle = p.id.split(".")[0];
      const list = groups.get(principle) ?? [];
      list.push(p);
      groups.set(principle, list);
    }
    return [...groups.entries()];
  }
  const counts = {
    achieved: principles.filter((p) => p.status === "achieved").length,
    partial: principles.filter((p) => p.status === "partial").length,
    not: principles.filter((p) => p.status === "not").length,
    none: principles.filter((p) => p.status === "none").length,
    not_applicable: principles.filter((p) => p.status === "not_applicable").length,
  };
  const pendingEvidence = principles
    .flatMap((p) => p.evidence)
    .filter((e) => e.reviewStatus === "pending").length;

  function handleStatusChange(status: IgpStatus) {
    if (!selection) return;
    startTransition(async () => {
      await updateAssessment(scopeItemId, selection.igpId, { status });
      router.refresh();
    });
  }

  function handleSaveDetails(narrative: string, owner: string, ownerId: string | null) {
    if (!selection) return;
    startTransition(async () => {
      await updateAssessment(scopeItemId, selection.igpId, { narrative, owner, ownerId });
      router.refresh();
    });
  }

  function handleAddEvidence(formData: FormData) {
    if (!selection) return;
    startTransition(async () => {
      await addEvidence(selection.igpId, formData, scopeItemId);
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
        <div className="stat-tile st-none">
          <div className="stat-num">{counts.not_applicable}</div>
          <div className="stat-label">Not applicable</div>
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
              {groupByPrinciple(sec.principles).map(([principle, items]) => (
                <div className="principle-column" key={principle}>
                  <div className="principle-column-head mono">{principle}</div>
                  {items.map((p) => (
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
          Not started / not applicable
        </span>
      </div>

      <IgpPanel
        igp={selectedIgp}
        scopeItemId={scopeItemId}
        open={selectedIgp !== null}
        pending={isPending}
        internalUsers={internalUsers}
        commentableUsers={commentableUsers}
        onClose={() => setSelection(null)}
        onStatusChange={handleStatusChange}
        onSaveDetails={handleSaveDetails}
        onAddEvidence={handleAddEvidence}
      />
    </>
  );
}
