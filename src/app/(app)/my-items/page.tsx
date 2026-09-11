import { redirect } from "next/navigation";
import { getMyItems } from "@/lib/caf-data/queries";
import { createClient } from "@/lib/supabase/server";
import { getSessionAndRole } from "@/lib/auth";
import { statusLabel, type IgpStatus } from "@/lib/caf-data/types";

// Internal roles only — allow-listed so an unassigned account (role ===
// null) is denied too, not silently treated as internal.
export default async function MyItemsPage() {
  const { user, role } = await getSessionAndRole();
  if (!user || (role !== "owner_admin" && role !== "contributor")) redirect("/");

  const { igps, scopeItems } = await getMyItems(await createClient(), user.id);

  return (
    <>
      <h1 className="page-title">My items</h1>
      <p className="page-sub">
        Indicators and scope items linked to your account specifically —
        not just assigned by name. Link an item to your account from its
        own edit panel on Overview or the Scope Register.
      </p>

      <h2 className="page-title" style={{ fontSize: 16 }}>
        Assigned indicators
      </h2>
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {igps.length === 0 && (
            <tr>
              <td colSpan={3}>Nothing linked to you yet.</td>
            </tr>
          )}
          {igps.map((igp) => (
            <tr key={igp.code}>
              <td className="mono">{igp.code}</td>
              <td>{igp.name}</td>
              <td>{statusLabel[igp.status as IgpStatus]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="page-title" style={{ fontSize: 16, marginTop: 32 }}>
        Assigned scope items
      </h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Criticality</th>
          </tr>
        </thead>
        <tbody>
          {scopeItems.length === 0 && (
            <tr>
              <td colSpan={3}>Nothing linked to you yet.</td>
            </tr>
          )}
          {scopeItems.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.type}</td>
              <td>{item.criticality}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
