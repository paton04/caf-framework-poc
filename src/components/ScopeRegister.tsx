"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ScopeItemPanel } from "@/components/ScopeItemPanel";
import {
  createScopeItem,
  deleteScopeItem,
  updateScopeItem,
  type ScopeItemInput,
} from "@/app/actions/scope";
import type { ScopeItem } from "@/lib/caf-data/types";

type Target = ScopeItem | "new" | null;

export function ScopeRegister({ items }: { items: ScopeItem[] }) {
  const router = useRouter();
  const [target, setTarget] = useState<Target>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function open(next: Target) {
    setError(null);
    setTarget(next);
  }

  function handleSave(input: ScopeItemInput) {
    setError(null);
    startTransition(async () => {
      try {
        if (target && target !== "new") {
          await updateScopeItem(target.id, input);
        } else {
          await createScopeItem(input);
        }
        setTarget(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  function handleDelete() {
    if (!target || target === "new") return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteScopeItem(target.id);
        setTarget(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  return (
    <>
      <button type="button" className="btn-primary" style={{ marginBottom: 16 }} onClick={() => open("new")}>
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
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={5}>No scope items yet.</td>
            </tr>
          )}
          {items.map((item) => (
            <tr key={item.id} style={{ cursor: "pointer" }} onClick={() => open(item)}>
              <td>{item.name}</td>
              <td>{item.type}</td>
              <td>{item.essentialFunction}</td>
              <td>{item.criticality}</td>
              <td>{item.owner}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ScopeItemPanel
        target={target}
        pending={isPending}
        error={error}
        onClose={() => open(null)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </>
  );
}
