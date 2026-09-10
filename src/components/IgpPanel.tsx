"use client";

import { useRef, useState } from "react";
import { type Igp, type IgpStatus, statusLabel, statusOrder } from "@/lib/caf-data/types";

interface IgpPanelProps {
  igp: Igp | null;
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onStatusChange: (status: IgpStatus) => void;
  onSaveDetails: (narrative: string, owner: string) => void;
  onAddEvidence: (formData: FormData) => void;
}

// Status changes persist immediately (one click, one write). Narrative and
// owner are edited locally and only persisted on "Save changes", so typing
// doesn't fire a write per keystroke.
export function IgpPanel({
  igp,
  open,
  pending,
  onClose,
  onStatusChange,
  onSaveDetails,
  onAddEvidence,
}: IgpPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [narrative, setNarrative] = useState(igp?.narrative ?? "");
  const [owner, setOwner] = useState(igp?.owner ?? "");

  // Reset the local draft when a different IGP is opened. Adjusting state
  // during render (rather than in an effect) is the pattern React itself
  // recommends for this — it avoids an extra render round-trip, and the
  // panel keeps sliding shut smoothly on close since the DOM node persists
  // (a key-based remount would skip that transition instead).
  const [trackedId, setTrackedId] = useState(igp?.id ?? null);
  if (igp?.id !== trackedId) {
    setTrackedId(igp?.id ?? null);
    setNarrative(igp?.narrative ?? "");
    setOwner(igp?.owner ?? "");
  }

  function handleFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    onAddEvidence(formData);
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
                      disabled={pending}
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
                  value={narrative}
                  placeholder="No narrative yet — add a summary of how this indicator is met."
                  onChange={(e) => setNarrative(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Owner</label>
                <input
                  className="narrative-box"
                  style={{ minHeight: "auto" }}
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Linked evidence</label>
                {igp.evidence.map((file) => (
                  <div className="evidence-item" key={file.id}>
                    <span className="fname">{file.name}</span>
                    <span className="fmeta">{file.date}</span>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-evidence"
                  disabled={pending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  + Attach evidence
                </button>
                <input ref={fileInputRef} type="file" hidden onChange={handleFilePicked} />
              </div>
            </div>
            <div className="overlay-foot">
              <button
                className="btn-primary"
                disabled={pending}
                onClick={() => onSaveDetails(narrative, owner)}
              >
                {pending ? "Saving…" : "Save changes"}
              </button>
              <span className="save-hint">Saved to Supabase</span>
            </div>
          </>
        )}
      </div>
    </>
  );
}
