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
  currentUserEmail: string | null;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onApprove: (expiryDate: string | null, note: string) => void;
  onReject: (note: string) => void;
}

// canReview and the self-upload check both just gate the UI here — the
// real enforcement for both is a database trigger (0004_evidence_review.sql,
// extended by 0011 for the self-upload rule and 0012 to move review from
// Owner/Admin to GRC), so a non-GRC role or an uploader reviewing their
// own evidence some other way still gets rejected at the DB level
// regardless of what this component shows.
export function EvidenceReviewPanel({
  row,
  canReview,
  currentUserEmail,
  pending,
  error,
  onClose,
  onApprove,
  onReject,
}: EvidenceReviewPanelProps) {
  const open = row !== null;
  const isOwnUpload =
    !!row && !!currentUserEmail && row.uploadedByEmail === currentUserEmail;
  const canAct = canReview && !isOwnUpload;

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

              {row.scopeItemName && (
                <div className="field">
                  <label>Scope item</label>
                  <div className="fmeta">{row.scopeItemName}</div>
                </div>
              )}

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

              {canReview && isOwnUpload && (
                <div className="banner">
                  You uploaded this — ask another GRC reviewer to review it.
                  Reviewing your own evidence isn&apos;t allowed.
                </div>
              )}

              {canAct && (
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
            {canAct && (
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
