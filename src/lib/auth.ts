import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserRole } from "@/lib/caf-data/queries";
import type { UserRole } from "@/lib/caf-data/types";

// Convenience wrapper for Server Components/Actions that need both the
// signed-in user and their app role in one call. proxy.ts already
// guarantees a user exists for every route this can be called from.
export async function getSessionAndRole(): Promise<{ user: User | null; role: UserRole | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, role: null };

  const role = await getCurrentUserRole(supabase, user.id);
  return { user, role };
}
