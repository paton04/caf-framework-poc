"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ScopeItemPanel } from "@/components/ScopeItemPanel";
import { deleteScopeItem, updateScopeItem, type ScopeItemInput } from "@/app/actions/scope";
import type { ConfigurableListItem, ScopeItem } from "@/lib/caf-data/types";

export function ScopeItemDetailHeader({
  scopeItem,
  internalUsers,
  types,
  essentialFunctions,
}: {
  scopeItem: ScopeItem;
  internalUsers: { id: string; email: string }[];
  types: ConfigurableListItem[];
  essentialFunctions: ConfigurableListItem[];
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
          <h1 className="page-title">
            {scopeItem.name}
            {scopeItem.isEnterprise && <span className="enterprise-badge">org-wide default</span>}
          </h1>
          {scopeItem.description && (
            <p className="page-description">{scopeItem.description}</p>
          )}
        </div>
        {scopeItem.isEnterprise ? (
          <span className="field-hint" style={{ margin: 0 }}>
            Fixed, protected record — can&apos;t be edited or deleted.
          </span>
        ) : (
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
        )}
      </div>

      <div className="meta-row">
        <span className="meta-pill">
          {scopeItem.type}
          {scopeItem.typeRemoved && " (removed)"}
        </span>
        <span className="meta-pill">
          {scopeItem.essentialFunction || "No essential function set"}
          {scopeItem.essentialFunctionRemoved && " (removed)"}
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
        types={types}
        essentialFunctions={essentialFunctions}
        onClose={() => setEditing(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </>
  );
}
