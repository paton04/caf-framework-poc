"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ScopeItemPanel } from "@/components/ScopeItemPanel";
import { deleteScopeItem, updateScopeItem, type ScopeItemInput } from "@/app/actions/scope";
import type { ScopeItem } from "@/lib/caf-data/types";

export function ScopeItemDetailHeader({
  scopeItem,
  internalUsers,
}: {
  scopeItem: ScopeItem;
  internalUsers: { id: string; email: string }[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave(input: ScopeItemInput) {
    setError(null);
    startTransition(async () => {
      try {
        await updateScopeItem(scopeItem.id, input);
        setEditing(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteScopeItem(scopeItem.id);
        router.push("/");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  return (
    <>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">{scopeItem.name}</h1>
          {scopeItem.description && (
            <p className="page-description">{scopeItem.description}</p>
          )}
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setError(null);
            setEditing(true);
          }}
        >
          Edit scope details
        </button>
      </div>

      <div className="meta-row">
        <span className="meta-pill">{scopeItem.type}</span>
        <span className="meta-pill">
          {scopeItem.essentialFunction || "No essential function set"}
        </span>
        <span className="meta-pill">{scopeItem.criticality}</span>
        <span className="meta-pill">
          Owner: {scopeItem.ownerEmail || scopeItem.owner || "Unassigned"}
        </span>
      </div>

      <p className="page-sub">
        Click any indicator below to justify it for this scope item
        specifically, and attach its evidence.
      </p>

      <ScopeItemPanel
        target={editing ? scopeItem : null}
        pending={isPending}
        error={error}
        internalUsers={internalUsers}
        onClose={() => setEditing(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </>
  );
}
