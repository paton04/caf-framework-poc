"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAllScopeItemAssessments, getScopeItems } from "@/lib/caf-data/queries";

// RLS restricts inserting into cycle_snapshots to owner_admin already —
// that's the real enforcement. frozen_by is stamped by a trigger, not
// trusted from here, same pattern as evidence's uploaded_by/reviewed_by.
export async function freezeCycle(label: string) {
  if (!label.trim()) throw new Error("Give this cycle a name before freezing it.");

  const supabase = await createClient();
  const [assessments, scopeItems] = await Promise.all([
    getAllScopeItemAssessments(supabase),
    getScopeItems(supabase),
  ]);

  const { error } = await supabase.from("cycle_snapshots").insert({
    label: label.trim(),
    data: { assessments, scopeItems },
  });

  if (error) throw new Error(error.message);
  revalidatePath("/history");
}
