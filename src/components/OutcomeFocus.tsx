"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EvidenceLink } from "@/components/EvidenceLink";
import { StatementChecklist } from "@/components/StatementChecklist";
import { addEvidence, updateAssessment } from "@/app/actions/igp";
import { outcomeHref } from "@/lib/caf-data/outcomes";
import {
  type Igp,
  type IgpStatus,
  reviewStatusClass,
  reviewStatusLabel,
  statusLabel,
  statusOrder,
} from "@/lib/caf-data/types";

interface OutcomeRef {
  id: string;
  name: string;
}

interface InternalUser {
  id: string;
  email: string;
}

const PILL_CLASS: Record<IgpStatus, string> = {
  achieved: "st-achieved",
  partial: "st-partial",
  not: "st-not",
  none: "st-none",
  not_applicable: "st-none",
};

const DOT_CLASS: Record<IgpStatus, string> = {
  achieved: "seg-achieved",
  partial: "seg-partial",
  not: "seg-not",
  none: "seg-none",
  not_applicable: "seg-na",
};

// One outcome, full page: its sub-checks answered one click at a time,
// with guidance, owner, narrative and outcome-level evidence kept to the
// side until needed, and previous/next to walk the framework in order.
// Replaces the old heatmap slide-over panel (IgpPanel). Sub-check and
// status changes save immediately; narrative and owner save on "Save".
export function OutcomeFocus({
  scopeItemId,
  scopeItemName,
  sectionName,
  sectionOutcomes,
  outcome,
  prev,
  next,
  internalUsers,
  commentableUsers,
}: {
  scopeItemId: string;
  scopeItemName: string;
  sectionName: string;
  sectionOutcomes: { id: string; status: IgpStatus }[];
  outcome: Igp;
  prev: OutcomeRef | null;
  next: OutcomeRef | null;
  internalUsers: InternalUser[];
  commentableUsers: InternalUser[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [narrative, setNarrative] = useState(outcome.narrative);
  const [owner, setOwner] = useState(outcome.owner === "Unassigned" ? "" : outcome.owner);
  const [ownerId, setOwnerId] = useState<string | null>(outcome.ownerId);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const position = sectionOutcomes.findIndex((o) => o.id === outcome.id) + 1;
  const hasStatements = outcome.statements.length > 0;
  const answered = outcome.statements.filter((s) => s.status !== "not_reviewed").length;
  const detailsDirty =
    narrative !== outcome.narrative ||
    owner !== (outcome.owner === "Unassigned" ? "" : outcome.owner) ||
    ownerId !== outcome.ownerId;

  function handleStatusChange(status: IgpStatus) {
    startTransition(async () => {
      await updateAssessment(scopeItemId, outcome.id, { status });
      router.refresh();
    });
  }

  function handleSaveDetails() {
    startTransition(async () => {
      await updateAssessment(scopeItemId, outcome.id, { narrative, owner, ownerId });
      setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      router.refresh();
    });
  }

  function handleFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    startTransition(async () => {
      await addEvidence(outcome.id, formData, scopeItemId);
      router.refresh();
    });
    e.target.value = "";
  }

  return (
    <div className="focus">
      <div className="focus-bar">
        <Link href={`/scope/${scopeItemId}`} className="back-link">
          ← {scopeItemName}
        </Link>
        <div className="focus-position">
          <span className="muted">
            Section {outcome.id.charAt(0)} · outcome {position} of {sectionOutcomes.length}
          </span>
          <div className="focus-dots" aria-hidden="true">
            {sectionOutcomes.map((o) => (
              <Link
                key={o.id}
                href={outcomeHref(scopeItemId, o.id)}
                tabIndex={-1}
                title={`${o.id} — ${statusLabel[o.status]}`}
                className={`focus-dot ${DOT_CLASS[o.status]} ${o.id === outcome.id ? "current" : ""}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="focus-layout">
        <div className="focus-main stack-lg">
          <div className="stack-xs">
            <span className="mono muted">
              {outcome.id} · {sectionName}
            </span>
            <h1 className="page-title focus-title">{outcome.name}</h1>
            <div className="focus-status">
              <span className={`tag-pill ${PILL_CLASS[outcome.status]}`} aria-live="polite">
                {statusLabel[outcome.status]}
              </span>
              {hasStatements && (
                <span className="muted">
                  {answered} of {outcome.statements.length} sub-checks answered · status updates as you answer
                </span>
              )}
            </div>
          </div>

          {outcome.guidance && (
            <details className="card guidance-details">
              <summary>What good looks like</summary>
              <p>{outcome.guidance}</p>
              {outcome.guidanceNote && <p className="guidance-note">{outcome.guidanceNote}</p>}
            </details>
          )}

          {hasStatements ? (
            <StatementChecklist
              scopeItemId={scopeItemId}
              igpCode={outcome.id}
              statements={outcome.statements}
              commentableUsers={commentableUsers}
            />
          ) : (
            <section aria-labelledby="status-heading" className="card stack-sm">
              <h2 id="status-heading" className="section-heading">
                Status
              </h2>
              <p className="muted" style={{ margin: 0 }}>
                This outcome has no sub-checks yet, so set its status directly.
              </p>
              <div className="answer-group" role="group" aria-labelledby="status-heading">
                {statusOrder.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={outcome.status === s}
                    className={`answer-btn ${outcome.status === s ? `sel-${s}` : ""}`}
                    disabled={isPending}
                    onClick={() => handleStatusChange(s)}
                  >
                    {statusLabel[s]}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="focus-aside" aria-label="Outcome details">
          <div className="card stack-md">
            <div className="field">
              <label htmlFor="owner">Owner</label>
              <input id="owner" value={owner} placeholder="Unassigned" onChange={(e) => setOwner(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="owner-account">Linked account</label>
              <select id="owner-account" value={ownerId ?? ""} onChange={(e) => setOwnerId(e.target.value || null)}>
                <option value="">— not linked —</option>
                {internalUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="narrative">Narrative</label>
              <textarea
                id="narrative"
                className="narrative-box"
                rows={4}
                value={narrative}
                placeholder="How this outcome is met for this scope item."
                onChange={(e) => setNarrative(e.target.value)}
              />
            </div>
            <div className="aside-save">
              <button
                type="button"
                className="btn-primary"
                disabled={isPending || !detailsDirty}
                onClick={handleSaveDetails}
              >
                {isPending ? "Saving…" : "Save details"}
              </button>
              {savedAt && !detailsDirty && <span className="muted">Saved {savedAt}</span>}
            </div>
          </div>

          <div className="card stack-sm">
            <h2 className="section-heading">Outcome evidence</h2>
            {outcome.evidence.length === 0 && <p className="fmeta">None yet.</p>}
            {outcome.evidence.map((file) => (
              <div className="evidence-item" key={file.id}>
                <EvidenceLink storagePath={file.storagePath}>{file.name}</EvidenceLink>
                <span className={`status ${reviewStatusClass[file.reviewStatus]}`} style={{ marginTop: 0 }}>
                  {reviewStatusLabel[file.reviewStatus]}
                </span>
              </div>
            ))}
            <button
              type="button"
              className="add-evidence"
              disabled={isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              + Attach evidence
            </button>
            <input ref={fileInputRef} type="file" hidden onChange={handleFilePicked} />
          </div>
          {hasStatements && <p className="muted aside-note">Sub-check answers save as you click them.</p>}
        </aside>
      </div>

      <nav className="focus-footer" aria-label="Outcome navigation">
        <div className="focus-footer-inner">
          {prev ? (
            <Link href={outcomeHref(scopeItemId, prev.id)} className="footer-prev">
              ← {prev.id} {prev.name}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={outcomeHref(scopeItemId, next.id)} className="btn-primary footer-next">
              Next: {next.id} {next.name} →
            </Link>
          ) : (
            <Link href={`/scope/${scopeItemId}`} className="btn-primary footer-next">
              Back to overview
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
