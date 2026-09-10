"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/caf-data/types";

// RLS restricts user_roles/supplier_igp_access writes to owner_admin
// already — that's the real enforcement, not this file.

export async function setUserRole(userId: string, role: UserRole) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role }, { onConflict: "user_id" });

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function setSupplierAccess(userId: string, igpCodes: string[]) {
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("supplier_igp_access")
    .delete()
    .eq("user_id", userId);
  if (deleteError) throw new Error(deleteError.message);

  if (igpCodes.length > 0) {
    const { error: insertError } = await supabase
      .from("supplier_igp_access")
      .insert(igpCodes.map((igp_code) => ({ user_id: userId, igp_code })));
    if (insertError) throw new Error(insertError.message);
  }

  revalidatePath("/admin");
  revalidatePath("/suppliers");
}
