import { notFound, redirect } from "next/navigation";
import { Heatmap } from "@/components/Heatmap";
import { getInternalUsers, getScopeItemAssessment } from "@/lib/caf-data/queries";
import { createClient } from "@/lib/supabase/server";
import { getSessionAndRole } from "@/lib/auth";

export default async function ScopeItemAssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { role } = await getSessionAndRole();
  if (role !== "owner_admin" && role !== "contributor") redirect("/");

  const { id } = await params;
  const supabase = await createClient();
  const [assessment, internalUsers] = await Promise.all([
    getScopeItemAssessment(supabase, id),
    getInternalUsers(supabase),
  ]);

  if (!assessment) notFound();

  const { scopeItem, sections } = assessment;

  return (
    <>
      <h1 className="page-title">{scopeItem.name}</h1>
      <p className="page-sub">
        {scopeItem.type} — {scopeItem.essentialFunction || "no essential function set"} —{" "}
        {scopeItem.criticality}. Click any indicator to justify it for this
        scope item specifically, and attach its evidence.
      </p>
      <Heatmap scopeItemId={scopeItem.id} sections={sections} internalUsers={internalUsers} />
    </>
  );
}
