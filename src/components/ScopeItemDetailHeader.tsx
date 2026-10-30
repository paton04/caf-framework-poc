"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
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

  const owner = scopeItem.ownerEmail || scopeItem.owner || "Unassigned";

  return (
    <>
      <div className="stack-xs">
        <Link href="/" className="back-link">
          ← Scope items
        </Link>
        <div className="page-head">
          <div>
            <h1 className="page-title">
              {scopeItem.isEnterprise ? "Organisation-wide defaults" : scopeItem.name}
            </h1>
            <p className="page-lede">
              {scopeItem.isEnterprise
                ? "Answers set here apply to every scope item unless that item gives its own."
                : `${scopeItem.type}${scopeItem.typeRemoved ? " (removed)" : ""} · ${
                    scopeItem.essentialFunction || "No essential function"
                  }${scopeItem.essentialFunctionRemoved ? " (removed)" : ""} · ${scopeItem.criticality} · Owner ${owner}`}
            </p>
          </div>
          {!scopeItem.isEnterprise && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setError(null);
                setEditing(true);
              }}
            >
              Edit details
            </button>
          )}
        </div>
      </div>

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
