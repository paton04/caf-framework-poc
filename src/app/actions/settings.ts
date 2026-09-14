"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// RLS restricts app_settings updates to owner_admin already. updated_by/
// updated_at are stamped by a trigger, not trusted from here.
export async function updateAnnouncement(text: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("app_settings")
    .update({ announcement: text.trim() || null })
    .eq("id", "singleton");

  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
