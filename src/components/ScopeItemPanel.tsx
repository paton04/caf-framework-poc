"use client";

import { useState } from "react";
import {
  scopeCriticalities,
  scopeItemTypes,
  type ScopeItem,
} from "@/lib/caf-data/types";
import type { ScopeItemInput } from "@/app/actions/scope";

// "new" means the panel is open in create mode with a blank draft;
// null means fully closed; an actual item means editing it.
type Target = ScopeItem | "new" | null;

interface ScopeItemPanelProps {
  target: Target;
  pending: boolean;
  error: string | null;
  internalUsers: { id: string; email: string }[];
  onClose: () => void;
  onSave: (input: ScopeItemInput) => void;
  onDelete: () => void;
}

const BLANK: ScopeItemInput = {
  name: "",
  type: "Environment",
  description: "",
  essentialFunction: "",
  criticality: "Tier 3",
  owner: "",
  ownerId: null,
};

function toInput(item: ScopeItem): ScopeItemInput {
  return {
    name: item.name,
    type: item.type,
    description: item.description,
    essentialFunction: item.essentialFunction,
    criticality: item.criticality,
    owner: item.owner,
    ownerId: item.ownerId,
  };
}

export function ScopeItemPanel({
  target,
  pending,
  error,
  internalUsers,
  onClose,
  onSave,
  onDelete,
}: ScopeItemPanelProps) {
  const open = target !== null;
  const isEditing = target !== null && target !== "new";

  const [draft, setDraft] = useState<ScopeItemInput>(
    target && target !== "new" ? toInput(target) : BLANK
  );

  // Reset the draft whenever a different target is opened — "new" and null
  // are both stable string/null values here, unlike optional-chaining an
  // id straight off a possibly-null object (see IgpPanel's history with
  // that exact undefined-vs-null bug).
  const targetKey = target === "new" ? "new" : (target?.id ?? null);
  const [trackedKey, setTrackedKey] = useState<string | null>(targetKey);
  if (targetKey !== trackedKey) {
    setTrackedKey(targetKey);
    setDraft(target && target !== "new" ? toInput(target) : BLANK);
  }

  function update<K extends keyof ScopeItemInput>(key: K, value: ScopeItemInput[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleDelete() {
    if (window.confirm("Remove this scope item? This can't be undone.")) {
      onDelete();
    }
  }

  return (
    <>
      {open && <div className="overlay-backdrop" onClick={onClose} />}
      <div className={`overlay ${open ? "open" : ""}`}>
        {open && (
          <>
            <div className="overlay-head">
              <button className="overlay-close" onClick={onClose} aria-label="Close">
                ✕
              </button>
              <div className="pid mono">{isEditing ? "EDIT SCOPE ITEM" : "NEW SCOPE ITEM"}</div>
              <h3>{isEditing ? (target as ScopeItem).name : "Add scope item"}</h3>
            </div>
            <div className="overlay-body">
              {error && <div className="banner auth-error">{error}</div>}

              <div className="field">
                <label>Name</label>
                <input
                  className="narrative-box"
                  style={{ minHeight: "auto" }}
                  value={draft.name}
                  onChange={(e) => update("name", e.target.value)}
                />
              </div>

              <div className="field">
                <label>Type</label>
                <div className="status-select">
                  {scopeItemTypes.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`status-opt ${draft.type === t ? "sel-neutral" : ""}`}
                      onClick={() => update("type", t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>Description</label>
                <textarea
                  className="narrative-box"
                  rows={3}
                  value={draft.description}
                  onChange={(e) => update("description", e.target.value)}
                />
              </div>

              <div className="field">
                <label>Essential function</label>
                <p className="field-hint">
                  The business-critical activity this depends on (e.g. gas
                  flow control, access control). This is the justification
                  for why it&apos;s in NIS scope at all.
                </p>
                <input
                  className="narrative-box"
                  style={{ minHeight: "auto" }}
                  value={draft.essentialFunction}
                  onChange={(e) => update("essentialFunction", e.target.value)}
                />
              </div>

              <div className="field">
                <label>Criticality</label>
                <p className="field-hint">
                  How much this specific item matters to that essential
                  function. Tier 1 = most critical. Used to justify
                  proportionate controls — e.g. why a Tier 3 system might
                  not need 24/7 monitoring.
                </p>
                <div className="status-select">
                  {scopeCriticalities.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`status-opt ${draft.criticality === c ? "sel-neutral" : ""}`}
                      onClick={() => update("criticality", c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>Owner</label>
                <input
                  className="narrative-box"
                  style={{ minHeight: "auto" }}
                  value={draft.owner}
                  onChange={(e) => update("owner", e.target.value)}
                />
              </div>

              <div className="field">
                <label>Link to a registered account</label>
                <p className="field-hint">
                  Optional. Linking routes this item to that person&apos;s
                  &quot;My items&quot; view — a free-text owner above still
                  works without one.
                </p>
                <select
                  value={draft.ownerId ?? ""}
                  onChange={(e) => update("ownerId", e.target.value || null)}
                >
                  <option value="">— not linked —</option>
                  {internalUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="overlay-foot">
              <button
                className="btn-primary"
                disabled={pending || !draft.name.trim()}
                onClick={() => onSave(draft)}
              >
                {pending ? "Saving…" : isEditing ? "Save changes" : "Add item"}
              </button>
              {isEditing && (
                <button type="button" className="link-btn" disabled={pending} onClick={handleDelete}>
                  Delete
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
