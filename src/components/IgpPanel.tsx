"use client";

import { useRef } from "react";
import {
  type EvidenceFile,
  type Igp,
  type IgpStatus,
  statusLabel,
  statusOrder,
} from "@/lib/caf-data/seed";

interface IgpPanelProps {
  igp: Igp | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (status: IgpStatus) => void;
  onNarrativeChange: (narrative: string) => void;
  onOwnerChange: (owner: string) => void;
  onAddEvidence: (file: EvidenceFile) => void;
}

// Status changes, narrative/owner edits and "attached" evidence here update
// local component state only — nothing is persisted yet. That lands once
// Supabase is wired up; this is about proving the interaction feels right.
export function IgpPanel({
  igp,
  open,
  onClose,
  onStatusChange,
  onNarrativeChange,
  onOwnerChange,
  onAddEvidence,
}: IgpPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onAddEvidence({
      name: file.name,
      date: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    });
    e.target.value = "";
  }

  return (
    <>
      {open && <div className="overlay-backdrop" onClick={onClose} />}
      <div className={`overlay ${open ? "open" : ""}`}>
        {igp && (
          <>
            <div className="overlay-head">
              <button className="overlay-close" onClick={onClose} aria-label="Close">
                ✕
              </button>
              <div className="pid mono">{igp.id}</div>
              <h3>{igp.name}</h3>
            </div>
            <div className="overlay-body">
              <div className="field">
                <label>What good looks like</label>
                <div className="guidance-box">
                  {igp.guidance}
                  {igp.guidanceNote && <p className="guidance-note">{igp.guidanceNote}</p>}
                </div>
              </div>
              <div className="field">
                <label>Status</label>
                <div className="status-select">
                  {statusOrder.map((s) => (
                    <button
                      key={s}
                      className={`status-opt ${igp.status === s ? `sel-${s}` : ""}`}
                      onClick={() => onStatusChange(s)}
                    >
                      {statusLabel[s]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Narrative</label>
                <textarea
                  className="narrative-box"
                  rows={4}
                  value={igp.narrative}
                  placeholder="No narrative yet — add a summary of how this indicator is met."
                  onChange={(e) => onNarrativeChange(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Owner</label>
                <input
                  className="narrative-box"
                  style={{ minHeight: "auto" }}
                  value={igp.owner}
                  onChange={(e) => onOwnerChange(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Linked evidence</label>
                {igp.evidence.map((file, i) => (
                  <div className="evidence-item" key={`${file.name}-${i}`}>
                    <span className="fname">{file.name}</span>
                    <span className="fmeta">{file.date}</span>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-evidence"
                  onClick={() => fileInputRef.current?.click()}
                >
                  + Attach evidence
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  onChange={handleFilePicked}
                />
              </div>
            </div>
            <div className="overlay-foot">
              <button className="btn-primary" onClick={onClose}>
                Save changes
              </button>
              <span className="save-hint">Saved to this session — not yet persisted</span>
            </div>
          </>
        )}
      </div>
    </>
  );
}
