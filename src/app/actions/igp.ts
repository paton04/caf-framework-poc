"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { IgpStatus } from "@/lib/caf-data/types";

// RLS is the real enforcement here (owner_admin/contributor only, or a
// supplier scoped to their own IGPs for evidence) — these actions just run
// as the calling user via the server client, so a disallowed write fails
// at the database rather than needing to be re-checked here.

export async function updateAssessment(
  igpCode: string,
  patch: Partial<{ status: IgpStatus; narrative: string; owner: string; ownerId: string | null }>
) {
  const { ownerId, ...rest } = patch;
  const supabase = await createClient();
  const { error } = await supabase
    .from("igp_assessments")
    .update({
      ...rest,
      ...(ownerId !== undefined ? { owner_id: ownerId } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("igp_code", igpCode);

  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/my-items");
}

export async function addEvidence(igpCode: string, formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No file selected.");
  }

  const supabase = await createClient();
  const storagePath = `${igpCode}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("evidence")
    .upload(storagePath, file);
  if (uploadError) throw new Error(uploadError.message);

  const { error: insertError } = await supabase.from("evidence_files").insert({
    igp_code: igpCode,
    file_name: file.name,
    storage_path: storagePath,
  });
  if (insertError) throw new Error(insertError.message);

  revalidatePath("/");
  revalidatePath("/evidence");
}
