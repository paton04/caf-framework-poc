"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ScopeItemPanel } from "@/components/ScopeItemPanel";
import { ProgressBar, progressTotals } from "@/components/Progress";
import { createScopeItem, type ScopeItemInput } from "@/app/actions/scope";
import type { ConfigurableListItem, ScopeItem, ScopeItemProgress } from "@/lib/caf-data/types";

function Chevron() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3l5 5-5 5" />
    </svg>
  );
}

function ScopeItemRow({ item, progress }: { item: ScopeItem; progress: ScopeItemProgress | undefined }) {
  const totals = progress ? progressTotals(progress) : null;
  const owner = item.ownerEmail || item.owner || "Unassigned";
  return (
    <Link href={`/scope/${item.id}`} className="scope-row">
      <div className="scope-row-main">
        <div className="scope-row-name">{item.name}</div>
        <div className="scope-row-meta">
          {item.type} · {item.essentialFunction || "No essential function"} · {item.criticality} · Owner {owner}
        </div>
      </div>
      <div className="scope-row-progress">
        {progress && <ProgressBar progress={progress} size="sm" />}
        <span className="scope-row-count">
          {!totals || totals.assessed === 0 ? "Not started" : `${totals.assessed} of ${totals.total}`}
        </span>
        <Chevron />
      </div>
    </Link>
  );
}

// The entry point: the overall summary (passed in from the server page),
// then one row per scope item — select one to work on, or add a new one.
// The Enterprise-wide item sits apart at the bottom, since it holds the
// organisation's default answers rather than being a system in scope.
export function ScopeItemList({
  items,
  internalUsers,
  progress,
  types,
  essentialFunctions,
  summary,
}: {
  items: ScopeItem[];
  internalUsers: { id: string; email: string }[];
  progress: Record<string, ScopeItemProgress>;
  types: ConfigurableListItem[];
  essentialFunctions: ConfigurableListItem[];
  summary: React.ReactNode;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const regular = items.filter((i) => !i.isEnterprise);
  const enterprise = items.find((i) => i.isEnterprise);
  const enterpriseTotals = enterprise && progress[enterprise.id] ? progressTotals(progress[enterprise.id]) : null;

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
    <div className="stack-lg">
      <div className="page-head">
        <div>
          <h1 className="page-title">Scope items</h1>
          <p className="page-lede">
            {regular.length} item{regular.length === 1 ? "" : "s"} in scope · every one assessed against the full
            CAF
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setError(null);
            setAdding(true);
          }}
        >
          + Add scope item
        </button>
      </div>

      {summary}

      <section aria-labelledby="items-heading" className="stack-sm">
        <h2 id="items-heading" className="section-heading">
          Your scope items
        </h2>
        {regular.length === 0 && <div className="card empty-note">No scope items yet — add one above.</div>}
        {regular.map((item) => (
          <ScopeItemRow key={item.id} item={item} progress={progress[item.id]} />
        ))}

        {enterprise && (
          <Link href={`/scope/${enterprise.id}`} className="scope-row scope-row-enterprise">
            <div className="scope-row-main">
              <div className="scope-row-name">Organisation-wide defaults</div>
              <div className="scope-row-meta">
                Answers set here apply to every scope item unless that item gives its own
              </div>
            </div>
            <div className="scope-row-progress">
              <span className="scope-row-count">
                {enterpriseTotals ? `${enterpriseTotals.assessed} of ${enterpriseTotals.total} set` : ""}
              </span>
              <Chevron />
            </div>
          </Link>
        )}
      </section>

      <ScopeItemPanel
        target={adding ? "new" : null}
        pending={isPending}
        error={error}
        internalUsers={internalUsers}
        types={types}
        essentialFunctions={essentialFunctions}
        onClose={() => setAdding(false)}
        onSave={handleSave}
        onDelete={() => {}}
      />
    </div>
  );
}
