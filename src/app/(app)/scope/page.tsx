import { redirect } from "next/navigation";
import { getScopeItems } from "@/lib/caf-data/queries";
import { createClient } from "@/lib/supabase/server";
import { getSessionAndRole } from "@/lib/auth";

// Internal roles only — allow-listed rather than blocking just "supplier",
// so an account with no role assigned yet (role === null) is denied too,
// not silently treated as internal. RLS already blocks the actual reads
// either way; this just keeps a mistaken direct link from rendering an
// empty, confusing page instead of redirecting.
export default async function ScopePage() {
  const { role } = await getSessionAndRole();
  if (role !== "owner_admin" && role !== "contributor") redirect("/");

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
