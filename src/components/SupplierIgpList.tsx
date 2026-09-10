"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { addEvidence } from "@/app/actions/igp";
import type { Igp } from "@/lib/caf-data/types";

// Supplier's own view: only the IGPs they're linked to, guidance to work
// against, and their own evidence — no status, narrative or owner fields.
// Those live in igp_assessments, which RLS keeps off-limits to suppliers
// entirely (not just hidden here).
export function SupplierIgpList({ igps }: { igps: Igp[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleFilePicked(igpId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    startTransition(async () => {
      await addEvidence(igpId, formData);
      router.refresh();
    });
    e.target.value = "";
  }

  if (igps.length === 0) {
    return (
      <div className="banner">
        No indicators have been assigned to your account yet. Contact your
        Owner/Admin if you were expecting access.
      </div>
    );
  }

  return (
    <div className="supplier-igp-list">
      {igps.map((igp) => (
        <div className="supplier-igp-card" key={igp.id}>
          <div className="pid mono">{igp.id}</div>
          <h3>{igp.name}</h3>
          <div className="guidance-box">
            {igp.guidance}
            {igp.guidanceNote && <p className="guidance-note">{igp.guidanceNote}</p>}
          </div>
          <div className="field">
            <label>Your evidence</label>
            {igp.evidence.map((file) => (
              <div className="evidence-item" key={file.id}>
                <span className="fname">{file.name}</span>
                <span className="fmeta">{file.date}</span>
              </div>
            ))}
            <label className="add-evidence" style={{ display: "block", cursor: "pointer" }}>
              {isPending ? "Uploading…" : "+ Attach evidence"}
              <input
                type="file"
                hidden
                disabled={isPending}
                onChange={(e) => handleFilePicked(igp.id, e)}
              />
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}
