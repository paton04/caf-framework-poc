"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ScopeCriticality, ScopeItemType } from "@/lib/caf-data/types";

// RLS restricts scope_items writes to owner_admin/contributor already —
// these actions just run as the calling user via the server client.

export interface ScopeItemInput {
  name: string;
  type: ScopeItemType;
  description: string;
  essentialFunction: string;
  criticality: ScopeCriticality;
  owner: string;
  ownerId: string | null;
}

function friendlyError(message: string): string {
  // Postgres unique_violation on scope_items.name reads as a raw constraint
  // name in the message — surface something a non-technical user can act on.
  if (message.includes("scope_items_name_key")) {
    return "A scope item with that name already exists.";
  }
  return message;
}

// Returns the new row's id so the caller can navigate straight into its
// assessment page — creating a scope item is the entry point now, not a
// standalone action on a register.
export async function createScopeItem(input: ScopeItemInput): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scope_items")
    .insert({
      name: input.name,
      type: input.type,
      description: input.description,
      essential_function: input.essentialFunction,
      criticality: input.criticality,
      owner: input.owner,
      owner_id: input.ownerId,
    })
    .select("id")
    .single();

  if (error) throw new Error(friendlyError(error.message));
  revalidatePath("/");
  revalidatePath("/my-items");
  return data.id;
}

export async function updateScopeItem(id: string, input: ScopeItemInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("scope_items")
    .update({
      name: input.name,
      type: input.type,
      description: input.description,
      essential_function: input.essentialFunction,
      criticality: input.criticality,
      owner: input.owner,
      owner_id: input.ownerId,
    })
    .eq("id", id);

  if (error) throw new Error(friendlyError(error.message));
  revalidatePath("/");
  revalidatePath(`/scope/${id}`);
  revalidatePath("/my-items");
}

export async function deleteScopeItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("scope_items").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/my-items");
}
