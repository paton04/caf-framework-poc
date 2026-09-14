import { redirect } from "next/navigation";
import { ScopeItemList } from "@/components/ScopeItemList";
import { SupplierIgpList } from "@/components/SupplierIgpList";
import { getInternalUsers, getScopeItems, getSupplierIgps } from "@/lib/caf-data/queries";
import { createClient } from "@/lib/supabase/server";
import { getSessionAndRole } from "@/lib/auth";

// Entry point per the scope-item-first restructure: pick a scope item —
// or add a new one — then everything else (its own details, its CAF
// assessment) happens on its own /scope/[id] page from there. This is
// the only place scope items are listed; the standalone Scope Register
// page is gone, it was pure duplication of this list.
export default async function OverviewPage() {
  const { user, role } = await getSessionAndRole();
  if (!user) redirect("/login");

  if (role === null) {
    return (
      <div className="banner">
        Your account doesn&apos;t have a role assigned yet. Contact your
        Owner/Admin — they can set this from the admin page.
      </div>
    );
  }

  if (role === "grc") redirect("/evidence");

  if (role === "supplier") {
    const igps = await getSupplierIgps(await createClient(), user.id);
    return (
      <>
        <h1 className="page-title">Your assigned indicators</h1>
        <p className="page-sub">
          Submit evidence against the indicators you&apos;ve been given
          access to. Internal narrative and status aren&apos;t visible to
          supplier accounts.
        </p>
        <SupplierIgpList igps={igps} />
      </>
    );
  }

  const supabase = await createClient();
  const [scopeItems, internalUsers] = await Promise.all([
    getScopeItems(supabase),
    getInternalUsers(supabase),
  ]);

  return (
    <>
      <h1 className="page-title">Scope items</h1>
      <p className="page-sub">
        Pick a scope item to work through its CAF assessment — every
        indicator, justified and evidenced for that item specifically.
      </p>
      <ScopeItemList items={scopeItems} internalUsers={internalUsers} />
    </>
  );
}
