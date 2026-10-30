// Helpers for walking one scope item's outcomes in framework order —
// shared by the scope item page (outcome map, "Up next") and the
// one-outcome focus page (previous/next, position in section).

import type { Igp, ScopeItemProgress, Section } from "@/lib/caf-data/types";

export function outcomeHref(scopeItemId: string, code: string) {
  return `/scope/${scopeItemId}/outcome/${encodeURIComponent(code)}`;
}

export function sectionProgress(outcomes: Igp[]): ScopeItemProgress {
  return {
    achieved: outcomes.filter((o) => o.status === "achieved").length,
    partial: outcomes.filter((o) => o.status === "partial").length,
    not: outcomes.filter((o) => o.status === "not").length,
    none: outcomes.filter((o) => o.status === "none").length,
    notApplicable: outcomes.filter((o) => o.status === "not_applicable").length,
  };
}

export function answeredCount(outcome: Igp) {
  return outcome.statements.filter((s) => s.status !== "not_reviewed").length;
}

// What to work on next: an outcome whose sub-checks are part-answered
// (you were in the middle of it), then anything Not achieved, then
// Partially achieved, then the first couple not yet started.
export function pickUpNext(sections: Section[], limit = 4) {
  const all = sections.flatMap((s) => s.principles);
  const inProgress = all.filter((o) => {
    const answered = answeredCount(o);
    return o.status !== "achieved" && answered > 0 && answered < o.statements.length;
  });
  const ordered = [
    ...inProgress,
    ...all.filter((o) => o.status === "not"),
    ...all.filter((o) => o.status === "partial"),
    ...all.filter((o) => o.status === "none").slice(0, 2),
  ];
  const unique = ordered.filter((o, i) => ordered.findIndex((x) => x.id === o.id) === i);
  return { current: unique[0] ?? null, rest: unique.slice(1, limit + 1) };
}
