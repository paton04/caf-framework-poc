"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EvidenceReviewPanel } from "@/components/EvidenceReviewPanel";
import { approveEvidence, rejectEvidence } from "@/app/actions/evidence-review";
import { reviewStatusClass, reviewStatusLabel, type EvidenceLibraryRow } from "@/lib/caf-data/types";

export function EvidenceLibrary({
  rows,
  canReview,
}: {
  rows: EvidenceLibraryRow[];
  canReview: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<EvidenceLibraryRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function open(row: EvidenceLibraryRow) {
    setError(null);
    setSelected(row);
  }

  function handleApprove(expiryDate: string | null, note: string) {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      try {
        await approveEvidence(selected.id, expiryDate, note);
        setSelected(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  function handleReject(note: string) {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      try {
        await rejectEvidence(selected.id, note);
        setSelected(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>File</th>
            <th>Linked indicator</th>
            <th>Uploaded</th>
            <th>Status</th>
            <th>Expiry</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={5}>No evidence uploaded yet.</td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.id} style={{ cursor: "pointer" }} onClick={() => open(row)}>
              <td>{row.file}</td>
              <td className="mono">{row.linkedIgp}</td>
              <td>{row.uploaded}</td>
              <td>
                <span className={`status ${reviewStatusClass[row.reviewStatus]}`}>
                  {reviewStatusLabel[row.reviewStatus]}
                </span>
              </td>
              <td>{row.expiryDate ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <EvidenceReviewPanel
        row={selected}
        canReview={canReview}
        pending={isPending}
        error={error}
        onClose={() => setSelected(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  );
}
