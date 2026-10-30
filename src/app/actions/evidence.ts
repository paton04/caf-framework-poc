"use server";

import { createClient } from "@/lib/supabase/server";

// Evidence lives in a private Storage bucket (never public, see
// 0001_init.sql) — RLS on storage.objects already scopes who can read
// which file (internal roles vs. a supplier's own IGP folder), and
// createSignedUrl still goes through that same check for the calling
// user, same as every other read in this app going through RLS. Short
// expiry (60s) is plenty to open the file once; this is meant to be
// used immediately on click, not kept or shared as a link.
export async function getEvidenceUrl(storagePath: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("evidence").createSignedUrl(storagePath, 60);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
