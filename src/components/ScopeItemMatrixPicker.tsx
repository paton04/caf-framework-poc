"use client";

import { useRouter } from "next/navigation";

// Plain navigation, not a mutation — no server action needed, just
// push the chosen scope item onto the query string.
export function ScopeItemMatrixPicker({
  scopeItems,
  selectedId,
}: {
  scopeItems: { id: string; name: string }[];
  selectedId: string;
}) {
  const router = useRouter();

  return (
    <select
      aria-label="Scope item"
      value={selectedId}
      onChange={(e) => router.push(`/report/matrix?scopeItemId=${e.target.value}`)}
    >
      {scopeItems.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name}
        </option>
      ))}
    </select>
  );
}
