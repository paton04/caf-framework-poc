import { notFound, redirect } from "next/navigation";
import { Heatmap } from "@/components/Heatmap";
import { ScopeItemDetailHeader } from "@/components/ScopeItemDetailHeader";
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
      <ScopeItemDetailHeader scopeItem={scopeItem} internalUsers={internalUsers} />
      <Heatmap scopeItemId={scopeItem.id} sections={sections} internalUsers={internalUsers} />
    </>
  );
}
