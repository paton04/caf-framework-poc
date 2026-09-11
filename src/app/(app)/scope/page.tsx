import { redirect } from "next/navigation";
import { ScopeRegister } from "@/components/ScopeRegister";
import { getScopeItems } from "@/lib/caf-data/queries";
import { createClient } from "@/lib/supabase/server";
import { getSessionAndRole } from "@/lib/auth";

// Internal roles only — allow-listed so an unassigned account (role ===
// null) is denied too, not silently treated as internal. RLS already
// blocks the actual reads either way; this just keeps a mistaken direct
// link from rendering an empty, confusing page instead of redirecting.
export default async function ScopePage() {
  const { role } = await getSessionAndRole();
  if (role !== "owner_admin" && role !== "contributor") redirect("/");

  const scopeItems = await getScopeItems(await createClient());

  return (
    <>
      <h1 className="page-title">Scope register</h1>
      <p className="page-sub">
        Systems, applications and environments in NIS scope for this cycle.
        Click a row to edit it.
      </p>
      <ScopeRegister items={scopeItems} />
    </>
  );
}
