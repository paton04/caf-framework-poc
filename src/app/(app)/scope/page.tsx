import { redirect } from "next/navigation";
import { getScopeItems } from "@/lib/caf-data/queries";
import { createClient } from "@/lib/supabase/server";
import { getSessionAndRole } from "@/lib/auth";

// Not part of a supplier's restricted view — RLS already blocks their reads
// here too, but redirecting keeps a mistaken direct link from just erroring.
export default async function ScopePage() {
  const { role } = await getSessionAndRole();
  if (role === "supplier") redirect("/");

  const scopeItems = await getScopeItems(await createClient());

  return (
    <>
      <h1 className="page-title">Scope register</h1>
      <p className="page-sub">
        Systems, applications and environments in NIS scope for this cycle.
      </p>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Essential function</th>
            <th>Criticality</th>
            <th>Owner</th>
          </tr>
        </thead>
        <tbody>
          {scopeItems.map((item) => (
            <tr key={item.name}>
              <td>{item.name}</td>
              <td>{item.type}</td>
              <td>{item.essentialFunction}</td>
              <td>{item.criticality}</td>
              <td>{item.owner}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
