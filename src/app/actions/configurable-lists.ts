"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// RLS restricts writes to owner_admin already (see
// 0024_configurable_lists.sql) — that's the real enforcement, not this
// file. Removal is soft (removed_at), never a row delete — there's no
// delete RLS policy at all, so a direct delete attempt would be denied
// at the database regardless of what calls it.

export async function addListValue(listName: string, value: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Enter a value first.");

  const supabase = await createClient();
  const { count } = await supabase
    .from("configurable_lists")
    .select("value", { count: "exact", head: true })
    .eq("list_name", listName);

  const { error } = await supabase
    .from("configurable_lists")
    .insert({ list_name: listName, value: trimmed, sort_order: (count ?? 0) + 1 });

  if (error) {
    if (error.message.includes("duplicate key")) throw new Error("That value already exists on this list.");
    throw new Error(error.message);
  }
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function setListValueRemoved(listName: string, value: string, removed: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("configurable_lists")
    .update({ removed_at: removed ? new Date().toISOString() : null })
    .eq("list_name", listName)
    .eq("value", value);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/");
}
