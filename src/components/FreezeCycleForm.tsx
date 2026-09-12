"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { freezeCycle } from "@/app/actions/snapshot";

// Owner/Admin only (gated by the page rendering this at all — RLS is the
// real enforcement). Freezing never touches live data; it just copies
// the current state into a new permanent snapshot, so there's nothing to
// confirm here the way a delete would need.
export function FreezeCycleForm() {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await freezeCycle(label);
        setLabel("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="field" style={{ maxWidth: 420 }}>
      <label>Freeze the current state as a new snapshot</label>
      <p className="field-hint">
        Copies everything as it stands right now — statuses, narratives,
        evidence, scope register — into a permanent read-only record. Live
        data keeps going completely unaffected.
      </p>
      {error && <div className="banner auth-error">{error}</div>}
      <div style={{ display: "flex", gap: 10 }}>
        <input
          className="narrative-box"
          style={{ minHeight: "auto", flex: 1 }}
          placeholder="e.g. 2026/27"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <button className="btn-primary" disabled={isPending || !label.trim()}>
          {isPending ? "Freezing…" : "Freeze"}
        </button>
      </div>
    </form>
  );
}
