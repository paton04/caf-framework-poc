"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateIgpRequiredLevels } from "@/app/actions/igp-levels";
import {
  requiredLevelLabel,
  requiredLevelOrder,
  type IgpRequiredLevels,
  type RequiredLevel,
} from "@/lib/caf-data/types";

// What level each outcome must reach to count as meeting Basic Profile /
// Enhanced Profile — set by the regulator (Ofgem/DESNZ for DGE today),
// not something an assessor picks per assessment. Currently a uniform
// placeholder (migration 0029), not real published values — DESNZ
// treats the actual target-attainment table as sensitive, shared
// directly with regulated entities rather than published, so this has
// to be editable in-app rather than baked into a migration. Also
// doubles as the seam for a different sector's own target levels, if
// this is ever used outside DGE.
export function RequiredLevelsEditor({
  outcomes,
  sections,
}: {
  outcomes: IgpRequiredLevels[];
  sections: { code: string; name: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedCode, setSavedCode] = useState<string | null>(null);

  function handleChange(outcome: IgpRequiredLevels, field: "bp" | "ep", value: RequiredLevel) {
    setError(null);
    setSavedCode(null);
    const bp = field === "bp" ? value : (outcome.bpRequiredLevel ?? "achieved");
    const ep = field === "ep" ? value : (outcome.epRequiredLevel ?? "achieved");
    startTransition(async () => {
      try {
        await updateIgpRequiredLevels(outcome.code, bp, ep);
        setSavedCode(outcome.code);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="stack-sm">
      {error && <div className="banner auth-error">{error}</div>}
      {sections.map((sec) => {
        const rows = outcomes.filter((o) => o.sectionCode === sec.code);
        if (rows.length === 0) return null;
        return (
          <div key={sec.code} style={{ marginBottom: 20 }}>
            <h3 className="page-title" style={{ fontSize: 14, marginBottom: 6 }}>
              Section {sec.code} — {sec.name}
            </h3>
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Outcome</th>
                  <th>Required for Basic Profile</th>
                  <th>Required for Enhanced Profile</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.code}>
                    <td className="mono">{o.code}</td>
                    <td>{o.name}</td>
                    <td>
                      <select
                        aria-label={`${o.code} required level for Basic Profile`}
                        value={o.bpRequiredLevel ?? "achieved"}
                        disabled={isPending}
                        onChange={(e) => handleChange(o, "bp", e.target.value as RequiredLevel)}
                      >
                        {requiredLevelOrder.map((lvl) => (
                          <option key={lvl} value={lvl}>
                            {requiredLevelLabel[lvl]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        aria-label={`${o.code} required level for Enhanced Profile`}
                        value={o.epRequiredLevel ?? "achieved"}
                        disabled={isPending}
                        onChange={(e) => handleChange(o, "ep", e.target.value as RequiredLevel)}
                      >
                        {requiredLevelOrder.map((lvl) => (
                          <option key={lvl} value={lvl}>
                            {requiredLevelLabel[lvl]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
      {savedCode && !isPending && <p className="fmeta">Saved {savedCode}.</p>}
    </div>
  );
}
