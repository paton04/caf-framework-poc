import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Full admin access via the service_role key — bypasses RLS entirely,
// on every table, for every row. Only src/app/actions/user-admin.ts
// (the actual invite/ban/delete/reset-password/reset-MFA operations)
// and src/lib/caf-data/admin-queries.ts (read-only ban/MFA status for
// the admin page) should import this — nothing else needs it. Because
// RLS provides no safety net here, every caller that *writes* with it
// re-checks the calling user is owner_admin itself first.
//
// Needs SUPABASE_SERVICE_ROLE_KEY set — server-only env var, NEVER
// NEXT_PUBLIC_-prefixed, NEVER sent to the browser. Get it from the
// Supabase dashboard: Project Settings -> API -> service_role secret.
// Set it in .env.local locally and in Vercel's project env vars
// (production scope) for the deployed app — not in this repo.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Admin user management (invite/disable/delete/reset password/reset MFA) needs it — add it to .env.local (and Vercel's env vars for production), from Supabase: Project Settings -> API -> service_role secret key."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
