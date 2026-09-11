"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// A database trigger (see 0004_evidence_review.sql) is the real
// enforcement that only Owner/Admin can review — it blocks the update and
// raises an exception for anyone else, regardless of what this sends.
// reviewed_by/reviewed_at are stamped by that same trigger from auth.uid(),
// never accepted as input here.

function friendlyError(message: string): string {
  if (message.includes("Only Owner/Admin can review evidence")) {
    return "Only an Owner/Admin can review evidence.";
  }
  return message;
}

export async function approveEvidence(id: string, expiryDate: string | null, note: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("evidence_files")
    .update({
      review_status: "approved",
      review_note: note.trim() || null,
      expiry_date: expiryDate || null,
    })
    .eq("id", id);

  if (error) throw new Error(friendlyError(error.message));
  revalidatePath("/evidence");
  revalidatePath("/");
}

export async function rejectEvidence(id: string, note: string) {
  if (!note.trim()) throw new Error("Add a note explaining what's wrong with the evidence.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("evidence_files")
    .update({ review_status: "rejected", review_note: note.trim() })
    .eq("id", id);

  if (error) throw new Error(friendlyError(error.message));
  revalidatePath("/evidence");
  revalidatePath("/");
}
