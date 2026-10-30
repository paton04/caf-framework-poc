"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addGeneralEvidence } from "@/app/actions/igp";
import { EvidenceLink } from "@/components/EvidenceLink";
import { reviewStatusClass, reviewStatusLabel, type EvidenceFile } from "@/lib/caf-data/types";

// Evidence about this scope item as a whole (a network diagram, an asset
// register extract) rather than proof of one specific CAF indicator —
// tucked into a collapsed one-line summary on the scope item page, since
// it's occasional admin rather than the main assessment work.
export function GeneralEvidence({
  scopeItemId,
  evidence,
}: {
  scopeItemId: string;
  evidence: EvidenceFile[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a file.");
      return;
    }
    if (!description.trim()) {
      setError("Add a description explaining what this evidence is.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("description", description);

    startTransition(async () => {
      try {
        await addGeneralEvidence(scopeItemId, formData);
        setAdding(false);
        setDescription("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  const approved = evidence.filter((e) => e.reviewStatus === "approved").length;
  const pendingReview = evidence.filter((e) => e.reviewStatus === "pending").length;
  const rejected = evidence.filter((e) => e.reviewStatus === "rejected").length;
  const breakdown = [
    approved && `${approved} approved`,
    pendingReview && `${pendingReview} pending`,
    rejected && `${rejected} rejected`,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <details className="card general-evidence">
      <summary>
        <span>
          <strong>General evidence</strong> · {evidence.length} file{evidence.length === 1 ? "" : "s"}
          {breakdown && ` (${breakdown})`}
        </span>
        <span className="summary-action">Manage</span>
      </summary>
      <p className="field-hint">
        Evidence about this scope item as a whole — a network diagram, an
        asset record — rather than proof of one specific CAF indicator.
      </p>

      {evidence.length === 0 && !adding && <p className="fmeta">None yet.</p>}

      {evidence.map((file) => (
        <div className="evidence-item" key={file.id}>
          <div>
            <EvidenceLink storagePath={file.storagePath}>{file.name}</EvidenceLink>
            {file.description && <div className="fmeta">{file.description}</div>}
          </div>
          <span className={`status ${reviewStatusClass[file.reviewStatus]}`} style={{ marginTop: 0 }}>
            {reviewStatusLabel[file.reviewStatus]}
          </span>
          <span className="fmeta">{file.date}</span>
        </div>
      ))}

      {adding ? (
        <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
          {error && <div className="banner auth-error">{error}</div>}
          <div className="field">
            <label>Description</label>
            <p className="field-hint">
              Required — explain what this is, since it isn&apos;t tied to
              one specific indicator.
            </p>
            <textarea
              className="narrative-box"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="field">
            <label>File</label>
            <input ref={fileInputRef} type="file" />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" className="btn-primary" disabled={isPending}>
              {isPending ? "Uploading…" : "Upload"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={isPending}
              onClick={() => {
                setAdding(false);
                setError(null);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="add-evidence" onClick={() => setAdding(true)}>
          + Add general evidence
        </button>
      )}
    </details>
  );
}
