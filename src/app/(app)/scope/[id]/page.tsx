import { notFound, redirect } from "next/navigation";
import { Heatmap } from "@/components/Heatmap";
import { ScopeItemDetailHeader } from "@/components/ScopeItemDetailHeader";
import { GeneralEvidence } from "@/components/GeneralEvidence";
import {
  getCommentableUsers,
  getConfigurableList,
  getInternalUsers,
  getScopeItemAssessment,
} from "@/lib/caf-data/queries";
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
  const [assessment, internalUsers, commentableUsers, types, essentialFunctions] = await Promise.all([
    getScopeItemAssessment(supabase, id),
    getInternalUsers(supabase),
    getCommentableUsers(supabase),
    getConfigurableList(supabase, "scope_item_type"),
    getConfigurableList(supabase, "essential_function"),
  ]);

  if (!assessment) notFound();

  const { scopeItem, sections, generalEvidence } = assessment;

  return (
    <>
      <ScopeItemDetailHeader
        scopeItem={scopeItem}
        internalUsers={internalUsers}
        types={types}
        essentialFunctions={essentialFunctions}
      />
      <GeneralEvidence scopeItemId={scopeItem.id} evidence={generalEvidence} />
      <Heatmap
        scopeItemId={scopeItem.id}
        sections={sections}
        internalUsers={internalUsers}
        commentableUsers={commentableUsers}
      />
    </>
  );
}
