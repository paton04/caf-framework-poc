import { redirect } from "next/navigation";
import { getSuppliers } from "@/lib/caf-data/queries";
import { createClient } from "@/lib/supabase/server";
import { getSessionAndRole } from "@/lib/auth";

export default async function SuppliersPage() {
  const { role } = await getSessionAndRole();
  if (role === "supplier") redirect("/");

  const suppliers = await getSuppliers(await createClient());

  return (
    <>
      <h1 className="page-title">Suppliers</h1>
      <div className="banner">
        Supplier accounts can only see and submit evidence for the
        indicators they&apos;re explicitly linked to below. They cannot see
        internal narrative, other suppliers, or unrelated sections. Manage
        who has the supplier role, and which indicators they&apos;re linked
        to, from the <a href="/admin">admin page</a>.
      </div>
      <table>
        <thead>
          <tr>
            <th>Supplier</th>
            <th>Linked indicators</th>
            <th>Access</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.length === 0 && (
            <tr>
              <td colSpan={3}>No supplier accounts yet.</td>
            </tr>
          )}
          {suppliers.map((s) => (
            <tr key={s.userId}>
              <td>{s.email}</td>
              <td className="mono">{s.igpCodes.length > 0 ? s.igpCodes.join(", ") : "—"}</td>
              <td>
                <span className="tag role-tag-sup">Supplier — own data only</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
