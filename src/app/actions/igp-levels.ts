"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { RequiredLevel } from "@/lib/caf-data/types";

// RLS restricts this to owner_admin already (0030) — that's the real
// enforcement, not this file.
export async function updateIgpRequiredLevels(
  code: string,
  bpRequiredLevel: RequiredLevel,
  epRequiredLevel: RequiredLevel
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("caf_igps")
    .update({ bp_required_level: bpRequiredLevel, ep_required_level: epRequiredLevel })
    .eq("code", code);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/report");
}
