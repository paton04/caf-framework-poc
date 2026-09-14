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
      <h1 className="page-title">{scopeItem.name}</h1>
      <p className="page-sub">
        {scopeItem.type} — {scopeItem.essentialFunction || "no essential function set"} —{" "}
        {scopeItem.criticality}. Click any indicator to justify it for this
        scope item specifically, and attach its evidence.{" "}
        <button
          type="button"
          className="link-btn"
          style={{ padding: 0, textDecoration: "underline" }}
          onClick={() => {
            setError(null);
            setEditing(true);
          }}
        >
          Edit details
        </button>
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
