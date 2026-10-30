import { notFound, redirect } from "next/navigation";
import { ScopeItemDetailHeader } from "@/components/ScopeItemDetailHeader";
import { GeneralEvidence } from "@/components/GeneralEvidence";
import { OutcomeMap, UpNext } from "@/components/OutcomeMap";
import { ProgressBar, ProgressLegend, progressTotals } from "@/components/Progress";
import { sectionProgress } from "@/lib/caf-data/outcomes";
import {
  getConfigurableList,
  getInternalUsers,
  getScopeItemAssessment,
} from "@/lib/caf-data/queries";
import { createClient } from "@/lib/supabase/server";
import { getSessionAndRole } from "@/lib/auth";

// One scope item at a glance: how far along it is, what to work on
// next, and a compact map of all its outcomes. The assessment work
// itself happens one outcome at a time on /scope/[id]/outcome/[code].
export default async function ScopeItemAssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { role } = await getSessionAndRole();
  if (role !== "owner_admin" && role !== "contributor") redirect("/");

  const { id } = await params;
  const supabase = await createClient();
  const [assessment, internalUsers, types, essentialFunctions] = await Promise.all([
    getScopeItemAssessment(supabase, id),
    getInternalUsers(supabase),
    getConfigurableList(supabase, "scope_item_type"),
    getConfigurableList(supabase, "essential_function"),
  ]);

  if (!assessment) notFound();

  const { scopeItem, sections, generalEvidence } = assessment;
  const progress = sectionProgress(sections.flatMap((s) => s.principles));
  const { assessed, total, pct } = progressTotals(progress);

  return (
    <div className="stack-lg">
      <ScopeItemDetailHeader
        scopeItem={scopeItem}
        internalUsers={internalUsers}
        types={types}
        essentialFunctions={essentialFunctions}
      />

      <section aria-labelledby="progress-heading" className="card stack-sm">
        <div className="card-head">
          <h2 id="progress-heading" className="section-heading">
            {assessed} of {total} outcomes assessed
          </h2>
          <span className="muted">{pct}% complete</span>
        </div>
        <ProgressBar progress={progress} size="lg" />
        <ProgressLegend progress={progress} />
      </section>

      <div className="two-col">
        <div className="stack-md">
          <UpNext scopeItemId={scopeItem.id} sections={sections} />
          <GeneralEvidence scopeItemId={scopeItem.id} evidence={generalEvidence} />
        </div>
        <OutcomeMap scopeItemId={scopeItem.id} sections={sections} />
      </div>
    </div>
  );
}
