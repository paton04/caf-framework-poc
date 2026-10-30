import { notFound, redirect } from "next/navigation";
import { OutcomeFocus } from "@/components/OutcomeFocus";
import { getCommentableUsers, getInternalUsers, getScopeItemAssessment } from "@/lib/caf-data/queries";
import { createClient } from "@/lib/supabase/server";
import { getSessionAndRole } from "@/lib/auth";

// One outcome of one scope item, on its own page — the focused
// replacement for the heatmap's slide-over panel.
export default async function OutcomeFocusPage({
  params,
}: {
  params: Promise<{ id: string; code: string }>;
}) {
  const { role } = await getSessionAndRole();
  if (role !== "owner_admin" && role !== "contributor") redirect("/");

  const { id, code: rawCode } = await params;
  const code = decodeURIComponent(rawCode);
  const supabase = await createClient();
  const [assessment, internalUsers, commentableUsers] = await Promise.all([
    getScopeItemAssessment(supabase, id),
    getInternalUsers(supabase),
    getCommentableUsers(supabase),
  ]);
  if (!assessment) notFound();

  const { scopeItem, sections } = assessment;
  const section = sections.find((s) => s.principles.some((p) => p.id === code));
  if (!section) notFound();

  const all = sections.flatMap((s) => s.principles);
  const index = all.findIndex((p) => p.id === code);
  const outcome = all[index];
  const toRef = (i: number) => (all[i] ? { id: all[i].id, name: all[i].name } : null);

  return (
    <OutcomeFocus
      // Remount per outcome so the narrative/owner drafts never carry
      // over when moving to the next one.
      key={outcome.id}
      scopeItemId={scopeItem.id}
      scopeItemName={scopeItem.isEnterprise ? "Organisation-wide defaults" : scopeItem.name}
      sectionName={section.name}
      sectionOutcomes={section.principles.map((p) => ({ id: p.id, status: p.status }))}
      outcome={outcome}
      prev={toRef(index - 1)}
      next={toRef(index + 1)}
      internalUsers={internalUsers}
      commentableUsers={commentableUsers}
    />
  );
}
