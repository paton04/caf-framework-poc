import Link from "next/link";
import { outcomeHref, pickUpNext, answeredCount, sectionProgress } from "@/lib/caf-data/outcomes";
import { progressTotals } from "@/components/Progress";
import { statusLabel, type Igp, type Section } from "@/lib/caf-data/types";

// The scope item page's two working panels: "Up next" (where to pick up)
// and the compact map of every outcome — small coloured tiles grouped by
// section, each one opening that outcome's focus page.

const TILE_CLASS: Record<Igp["status"], string> = {
  achieved: "tile-achieved",
  partial: "tile-partial",
  not: "tile-not",
  none: "tile-none",
  not_applicable: "tile-na",
};

const TAG_CLASS: Record<Igp["status"], string> = {
  achieved: "st-achieved",
  partial: "st-partial",
  not: "st-not",
  none: "st-none",
  not_applicable: "st-none",
};

function progressNote(o: Igp) {
  if (o.statements.length === 0) return statusLabel[o.status];
  return `${answeredCount(o)} of ${o.statements.length} sub-checks answered`;
}

export function UpNext({ scopeItemId, sections }: { scopeItemId: string; sections: Section[] }) {
  const { current, rest } = pickUpNext(sections);
  return (
    <section aria-labelledby="next-heading" className="card stack-md up-next">
      <h2 id="next-heading" className="section-heading">
        Up next
      </h2>
      {current ? (
        <Link href={outcomeHref(scopeItemId, current.id)} className="continue-card">
          <span className="continue-eyebrow">
            {current.status === "none" ? "Start here" : "Continue where you left off"}
          </span>
          <span className="continue-title">
            {current.id} {current.name}
          </span>
          <span className="continue-note">{progressNote(current)} →</span>
        </Link>
      ) : (
        <p className="muted">Every outcome is assessed.</p>
      )}
      {rest.length > 0 && (
        <div>
          {rest.map((o) => (
            <Link key={o.id} href={outcomeHref(scopeItemId, o.id)} className="next-row">
              <span className="mono next-code">{o.id}</span>
              <span className="next-name">{o.name}</span>
              <span className={`tag-pill ${TAG_CLASS[o.status]}`}>{statusLabel[o.status]}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function OutcomeMap({ scopeItemId, sections }: { scopeItemId: string; sections: Section[] }) {
  return (
    <section aria-labelledby="map-heading" className="card stack-md outcome-map">
      <div className="card-head">
        <h2 id="map-heading" className="section-heading">
          All outcomes
        </h2>
        <span className="muted">Select any outcome to open it</span>
      </div>
      {sections.map((sec) => {
        const { assessed, total } = progressTotals(sectionProgress(sec.principles));
        return (
          <div key={sec.code} className="map-section">
            <div className="map-section-head">
              <span>
                <span className="mono muted">{sec.code}</span> {sec.name}
              </span>
              <span className="muted">
                {assessed} of {total}
              </span>
            </div>
            <div className="map-tiles">
              {sec.principles.map((o) => (
                <Link
                  key={o.id}
                  href={outcomeHref(scopeItemId, o.id)}
                  className={`map-tile ${TILE_CLASS[o.status]}`}
                  title={`${o.id} ${o.name} — ${statusLabel[o.status]}`}
                  aria-label={`${o.id} ${o.name} — ${statusLabel[o.status]}`}
                >
                  {o.id}
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
