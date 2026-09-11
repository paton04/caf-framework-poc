"use client";

import { useState } from "react";
import {
  reviewStatusClass,
  reviewStatusLabel,
  type EvidenceLibraryRow,
} from "@/lib/caf-data/types";

interface EvidenceReviewPanelProps {
  row: EvidenceLibraryRow | null;
  canReview: boolean;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onApprove: (expiryDate: string | null, note: string) => void;
  onReject: (note: string) => void;
}

// canReview gates the action buttons here, but the real enforcement is a
// database trigger (0004_evidence_review.sql) — a Contributor hitting
// these actions some other way still gets rejected at the DB level.
export function EvidenceReviewPanel({
  row,
  canReview,
  pending,
  error,
  onClose,
  onApprove,
  onReject,
}: EvidenceReviewPanelProps) {
  const open = row !== null;

  const [expiryDate, setExpiryDate] = useState("");
  const [note, setNote] = useState("");

  const trackedId = row?.id ?? null;
  const [lastId, setLastId] = useState<string | null>(trackedId);
  if (trackedId !== lastId) {
    setLastId(trackedId);
    setExpiryDate("");
    setNote("");
  }

  return (
    <>
      {open && <div className="overlay-backdrop" onClick={onClose} />}
      <div className={`overlay ${open ? "open" : ""}`}>
        {row && (
          <>
            <div className="overlay-head">
              <button className="overlay-close" onClick={onClose} aria-label="Close">
                ✕
              </button>
              <div className="pid mono">{row.linkedIgp}</div>
              <h3>{row.file}</h3>
            </div>
            <div className="overlay-body">
              {error && <div className="banner auth-error">{error}</div>}

              <div className="field">
                <label>Status</label>
                <span className={`status ${reviewStatusClass[row.reviewStatus]}`}>
                  {reviewStatusLabel[row.reviewStatus]}
                </span>
              </div>

              {row.uploadedByEmail && (
                <div className="field">
                  <label>Uploaded by</label>
                  <div className="fmeta">
                    {row.uploadedByEmail} — {row.uploaded}
                  </div>
                </div>
              )}

              {row.reviewNote && (
                <div className="field">
                  <label>Review note</label>
                  <div className="guidance-box">{row.reviewNote}</div>
                </div>
              )}

              {row.reviewedByEmail && (
                <div className="field">
                  <label>Reviewed by</label>
                  <div className="fmeta">
                    {row.reviewedByEmail} — {row.reviewedAt}
                  </div>
                </div>
              )}

              {row.expiryDate && (
                <div className="field">
                  <label>Expires</label>
                  <div className="fmeta">{row.expiryDate}</div>
                </div>
              )}

              {canReview && (
                <>
                  <div className="field">
                    <label>Expiry date</label>
                    <p className="field-hint">
                      Optional — set this on approval if the evidence has a
                      known validity period (e.g. an annual policy review).
                    </p>
                    <input
                      type="date"
                      className="narrative-box"
                      style={{ minHeight: "auto" }}
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Note</label>
                    <p className="field-hint">
                      Optional when approving, required when rejecting —
                      explain what&apos;s missing so it can be fixed.
                    </p>
                    <textarea
                      className="narrative-box"
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
            {canReview && (
              <div className="overlay-foot">
                <button
                  className="btn-primary"
                  disabled={pending}
                  onClick={() => onApprove(expiryDate || null, note)}
                >
                  {pending ? "Saving…" : "Approve"}
                </button>
                <button
                  type="button"
                  className="link-btn"
                  disabled={pending}
                  onClick={() => onReject(note)}
                >
                  Reject
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
