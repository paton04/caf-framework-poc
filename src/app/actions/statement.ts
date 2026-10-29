"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { StatementStatus } from "@/lib/caf-data/types";

// RLS is the real enforcement here (owner_admin/contributor only for
// writes, grc read-only) — same pattern as igp.ts. These actions just
// run as the calling user via the server client.

// igp_statement_assessments can't use a plain upsert from the client —
// see 0018_statement_assessment_upsert.sql for why (the two partial
// unique indexes a nullable scope_item_id needs aren't expressible
// through PostgREST's onConflict). This RPC does it correctly in SQL.
async function ensureAssessmentRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  statementId: string,
  scopeItemId: string,
  enterpriseWide: boolean,
  status: StatementStatus,
  note: string
): Promise<string> {
  // The function returns a single public.igp_statement_assessments row
  // (not SETOF), so `data` is that row object directly — no .select()/
  // .single() needed the way a table query would.
  const { data, error } = await supabase.rpc("upsert_statement_assessment", {
    p_statement_id: statementId,
    p_scope_item_id: enterpriseWide ? null : scopeItemId,
    p_status: status,
    p_note: note,
  });
  if (error) throw new Error(error.message);
  return (data as { id: string }).id;
}

export async function updateStatementAssessment(
  scopeItemId: string,
  statementId: string,
  enterpriseWide: boolean,
  status: StatementStatus,
  note: string
) {
  const supabase = await createClient();
  await ensureAssessmentRow(supabase, statementId, scopeItemId, enterpriseWide, status, note);
  revalidatePath(`/scope/${scopeItemId}`);
}

// currentStatus/currentNote are the *effective* values the panel already
// has in hand — re-writing them is a harmless no-op that just guarantees
// an assessment row exists to attach evidence to, without clobbering
// whatever status/note is already set (which a blind default-value
// upsert would do).
export async function addStatementEvidence(
  scopeItemId: string,
  statementId: string,
  enterpriseWide: boolean,
  currentStatus: StatementStatus,
  currentNote: string,
  igpCode: string,
  formData: FormData
) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No file selected.");
  }

  const supabase = await createClient();
  const assessmentId = await ensureAssessmentRow(
    supabase,
    statementId,
    scopeItemId,
    enterpriseWide,
    currentStatus,
    currentNote
  );

  const storagePath = `${igpCode}/statements/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("evidence").upload(storagePath, file);
  if (uploadError) throw new Error(uploadError.message);

  const { error: insertError } = await supabase.from("evidence_files").insert({
    igp_code: igpCode,
    scope_item_id: scopeItemId,
    statement_assessment_id: assessmentId,
    file_name: file.name,
    storage_path: storagePath,
  });
  if (insertError) throw new Error(insertError.message);

  revalidatePath("/evidence");
  revalidatePath(`/scope/${scopeItemId}`);
}

export async function postStatementComment(
  scopeItemId: string,
  statementId: string,
  enterpriseWide: boolean,
  currentStatus: StatementStatus,
  currentNote: string,
  body: string,
  mentionedUserIds: string[]
) {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Write something before posting.");

  const supabase = await createClient();
  const assessmentId = await ensureAssessmentRow(
    supabase,
    statementId,
    scopeItemId,
    enterpriseWide,
    currentStatus,
    currentNote
  );

  const { data: comment, error: commentError } = await supabase
    .from("statement_comments")
    .insert({ statement_assessment_id: assessmentId, body: trimmed })
    .select("id")
    .single();
  if (commentError) throw new Error(commentError.message);

  if (mentionedUserIds.length > 0) {
    const { error: mentionError } = await supabase
      .from("statement_comment_mentions")
      .insert(mentionedUserIds.map((userId) => ({ comment_id: comment.id, mentioned_user_id: userId })));
    if (mentionError) throw new Error(mentionError.message);
  }

  revalidatePath(`/scope/${scopeItemId}`);
}
