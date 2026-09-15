"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ScopeItemPanel } from "@/components/ScopeItemPanel";
import { createScopeItem, type ScopeItemInput } from "@/app/actions/scope";
import type { ScopeItem, ScopeItemProgress } from "@/lib/caf-data/types";

// Small non-zero-only counts, reusing the same status colours as the
// heatmap's own progress strip — e.g. "5 Achieved  2 Partial  9 Not started".
function ProgressSummary({ progress }: { progress: ScopeItemProgress | undefined }) {
  if (!progress) return null;
  const parts: { count: number; label: string; className: string }[] = [
    { count: progress.achieved, label: "Achieved", className: "st-achieved" },
    { count: progress.partial, label: "Partial", className: "st-partial" },
    { count: progress.not, label: "Not achieved", className: "st-not" },
    { count: progress.none, label: "Not started", className: "st-none" },
    { count: progress.notApplicable, label: "N/A", className: "st-none" },
  ].filter((p) => p.count > 0);

  if (parts.length === 0) return null;

  return (
    <div className="progress-mini">
      {parts.map((p) => (
        <span key={p.label} className={`status ${p.className}`}>
          {p.count} {p.label}
        </span>
      ))}
    </div>
  );
}

// The entry point: select a scope item to work on, or add a new one.
// Editing an item's own details and everything else about it (its CAF
// assessment) both happen on its own /scope/[id] page from here on —
// this list doesn't do either itself.
export function ScopeItemList({
  items,
  internalUsers,
  progress,
}: {
  items: ScopeItem[];
  internalUsers: { id: string; email: string }[];
  progress: Record<string, ScopeItemProgress>;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave(input: ScopeItemInput) {
    setError(null);
    startTransition(async () => {
      try {
        const id = await createScopeItem(input);
        setAdding(false);
        router.push(`/scope/${id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        className="btn-primary"
        style={{ marginBottom: 16 }}
        onClick={() => {
          setError(null);
          setAdding(true);
        }}
      >
        + Add scope item
      </button>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Essential function</th>
            <th>Criticality</th>
            <th>Owner</th>
            <th>Progress</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={6}>No scope items yet — add one above.</td>
            </tr>
          )}
          {items.map((item) => (
            <tr key={item.id}>
              <td className="row-link-cell">
                <Link href={`/scope/${item.id}`}>
                  <div>{item.name}</div>
                  {item.description && (
                    <div style={{ marginTop: 2, fontSize: 12, color: "var(--ink-soft)" }}>
                      {item.description}
                    </div>
                  )}
                </Link>
              </td>
              <td className="row-link-cell">
                <Link href={`/scope/${item.id}`}>{item.type}</Link>
              </td>
              <td className="row-link-cell">
                <Link href={`/scope/${item.id}`}>{item.essentialFunction}</Link>
              </td>
              <td className="row-link-cell">
                <Link href={`/scope/${item.id}`}>{item.criticality}</Link>
              </td>
              <td className="row-link-cell">
                <Link href={`/scope/${item.id}`}>
                  {item.ownerEmail || item.owner || (
                    <span style={{ color: "var(--ink-soft)" }}>Unassigned</span>
                  )}
                </Link>
              </td>
              <td className="row-link-cell">
                <Link href={`/scope/${item.id}`}>
                  <ProgressSummary progress={progress[item.id]} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ScopeItemPanel
        target={adding ? "new" : null}
        pending={isPending}
        error={error}
        internalUsers={internalUsers}
        onClose={() => setAdding(false)}
        onSave={handleSave}
        onDelete={() => {}}
      />
    </>
  );
}
