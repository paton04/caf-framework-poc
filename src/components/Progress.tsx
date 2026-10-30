import type { ScopeItemProgress } from "@/lib/caf-data/types";

// One stacked bar + an optional legend for "how far along is this" —
// shared by the overall summary, each scope item row and a scope item's
// own page, so progress reads the same everywhere. "Assessed" means any
// status other than Not started (Not applicable counts as done).

const SEGMENTS: { key: keyof ScopeItemProgress; label: string; className: string }[] = [
  { key: "achieved", label: "Achieved", className: "seg-achieved" },
  { key: "partial", label: "Partially achieved", className: "seg-partial" },
  { key: "not", label: "Not achieved", className: "seg-not" },
  { key: "notApplicable", label: "Not applicable", className: "seg-na" },
];

export function progressTotals(p: ScopeItemProgress) {
  const total = p.achieved + p.partial + p.not + p.notApplicable + p.none;
  const assessed = total - p.none;
  const pct = total === 0 ? 0 : Math.round((assessed / total) * 100);
  return { total, assessed, pct };
}

export function sumProgress(list: ScopeItemProgress[]): ScopeItemProgress {
  return list.reduce(
    (acc, p) => ({
      achieved: acc.achieved + p.achieved,
      partial: acc.partial + p.partial,
      not: acc.not + p.not,
      none: acc.none + p.none,
      notApplicable: acc.notApplicable + p.notApplicable,
    }),
    { achieved: 0, partial: 0, not: 0, none: 0, notApplicable: 0 }
  );
}

export function ProgressBar({ progress, size = "md" }: { progress: ScopeItemProgress; size?: "sm" | "md" | "lg" }) {
  const { total, assessed } = progressTotals(progress);
  const label = `${assessed} of ${total} outcomes assessed: ${SEGMENTS.map(
    (s) => `${progress[s.key]} ${s.label.toLowerCase()}`
  ).join(", ")}`;

  return (
    <div className={`progress-bar progress-bar-${size}`} role="img" aria-label={label}>
      {total > 0 &&
        SEGMENTS.map((s) =>
          progress[s.key] > 0 ? (
            <div key={s.key} className={s.className} style={{ width: `${(progress[s.key] / total) * 100}%` }} />
          ) : null
        )}
    </div>
  );
}

export function ProgressLegend({ progress }: { progress: ScopeItemProgress }) {
  return (
    <div className="progress-legend">
      {SEGMENTS.map((s) => (
        <span key={s.key}>
          <span className={`swatch ${s.className}`} aria-hidden="true" />
          {s.label} <strong>{progress[s.key]}</strong>
        </span>
      ))}
      <span>
        <span className="swatch seg-none" aria-hidden="true" />
        Not started <strong>{progress.none}</strong>
      </span>
    </div>
  );
}
