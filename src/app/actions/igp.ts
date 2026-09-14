"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { IgpStatus } from "@/lib/caf-data/types";

// RLS is the real enforcement here (owner_admin/contributor only, or a
// supplier scoped to their own IGPs for evidence) — these actions just run
// as the calling user via the server client, so a disallowed write fails
// at the database rather than needing to be re-checked here.

// Assessments aren't pre-seeded per scope item (there'd be scope items x
// 16 rows to create up front for no reason), so this upserts rather than
// assuming the row already exists.
export async function updateAssessment(
  scopeItemId: string,
  igpCode: string,
  patch: Partial<{ status: IgpStatus; narrative: string; owner: string; ownerId: string | null }>
) {
  const { ownerId, ...rest } = patch;
  const supabase = await createClient();
  const { error } = await supabase.from("igp_assessments").upsert(
    {
      scope_item_id: scopeItemId,
      igp_code: igpCode,
      ...rest,
      ...(ownerId !== undefined ? { owner_id: ownerId } : {}),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "scope_item_id,igp_code" }
  );

  if (error) throw new Error(error.message);
  revalidatePath(`/scope/${scopeItemId}`);
  revalidatePath("/my-items");
}

// scopeItemId is null for supplier uploads — suppliers aren't part of the
// scope-item restructure (deferred, see session notes), they still just
// attach evidence to an IGP directly.
export async function addEvidence(
  igpCode: string,
  formData: FormData,
  scopeItemId: string | null = null
) {
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
    scope_item_id: scopeItemId,
    file_name: file.name,
    storage_path: storagePath,
  });
  if (insertError) throw new Error(insertError.message);

  revalidatePath("/evidence");
  if (scopeItemId) revalidatePath(`/scope/${scopeItemId}`);
}
