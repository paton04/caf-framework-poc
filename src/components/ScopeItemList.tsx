"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ScopeItemPanel } from "@/components/ScopeItemPanel";
import { createScopeItem, type ScopeItemInput } from "@/app/actions/scope";
import type { ScopeItem } from "@/lib/caf-data/types";

// The entry point: select a scope item to work on, or add a new one.
// Editing an item's own details and everything else about it (its CAF
// assessment) both happen on its own /scope/[id] page from here on —
// this list doesn't do either itself.
export function ScopeItemList({
  items,
  internalUsers,
}: {
  items: ScopeItem[];
  internalUsers: { id: string; email: string }[];
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
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={4}>No scope items yet — add one above.</td>
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
