"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addListValue, setListValueRemoved } from "@/app/actions/configurable-lists";
import type { ConfigurableListItem } from "@/lib/caf-data/types";

// A generic admin-managed reference list (configurable_lists) — used
// for scope item Types and Essential Functions today, built reusable
// since Fiona wants to configure more of the product this way over
// time. Removing is reversible (sets removed_at, never deletes the
// row) — existing scope items keep whatever value they already had,
// and show it marked "(removed)" wherever it's displayed; this editor
// lets you restore a value just as easily as you removed it.
export function ConfigurableListEditor({
  listName,
  label,
  hint,
  items,
}: {
  listName: string;
  label: string;
  hint?: string;
  items: ConfigurableListItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await addListValue(listName, newValue);
        setNewValue("");
        setAdding(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  function handleToggle(value: string, removed: boolean) {
    setError(null);
    startTransition(async () => {
      try {
        await setListValueRemoved(listName, value, removed);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="field" style={{ maxWidth: 480 }}>
      <label>{label}</label>
      {hint && <p className="field-hint">{hint}</p>}
      {error && <div className="banner auth-error">{error}</div>}

      <div className="statement-list">
        {items.length === 0 && (
          <div className="statement-row">
            <div className="statement-row-head" style={{ cursor: "default" }}>
              <span className="fmeta">Nothing here yet.</span>
            </div>
          </div>
        )}
        {items.map((item) => (
          <div className="statement-row" key={item.value}>
            <div className="statement-row-head" style={{ cursor: "default" }}>
              <span className="statement-text" style={item.removed ? { color: "var(--ink-soft)" } : undefined}>
                {item.value}
                {item.removed && " (removed)"}
              </span>
              <button
                type="button"
                className="btn-secondary"
                disabled={isPending}
                onClick={() => handleToggle(item.value, !item.removed)}
              >
                {item.removed ? "Restore" : "Remove"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {adding ? (
        <form onSubmit={handleAdd} style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <input
            className="narrative-box"
            style={{ minHeight: "auto", flex: 1 }}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn-primary" disabled={isPending}>
            Add
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
        </form>
      ) : (
        <button type="button" className="add-evidence" onClick={() => setAdding(true)}>
          + Add value
        </button>
      )}
    </div>
  );
}
