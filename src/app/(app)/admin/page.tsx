import { redirect } from "next/navigation";
import { AdminPanel } from "@/components/AdminPanel";
import { getAllIgpCodes, getProfilesWithRoles, getSuppliers } from "@/lib/caf-data/queries";
import { createClient } from "@/lib/supabase/server";
import { getSessionAndRole } from "@/lib/auth";

export default async function AdminPage() {
  const { role } = await getSessionAndRole();
  if (role !== "owner_admin") redirect("/");

  const supabase = await createClient();
  const [profiles, igps, suppliers] = await Promise.all([
    getProfilesWithRoles(supabase),
    getAllIgpCodes(supabase),
    getSuppliers(supabase),
  ]);

  const supplierAccess = Object.fromEntries(suppliers.map((s) => [s.userId, s.igpCodes]));

  return (
    <>
      <h1 className="page-title">Admin</h1>
      <p className="page-sub">
        Set each invited user&apos;s role, and which indicators supplier
        accounts can access. New accounts are still invited via the Supabase
        dashboard — this only manages what they can do once they&apos;ve
        signed up.
      </p>
      <AdminPanel profiles={profiles} igps={igps} supplierAccess={supplierAccess} />
    </>
  );
}
