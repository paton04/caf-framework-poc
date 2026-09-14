import { redirect } from "next/navigation";
import Link from "next/link";
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
        not just assigned by name. Link either one to your account from
        its own page — an indicator&apos;s side panel, or a scope
        item&apos;s &quot;Edit details&quot;.
      </p>

      <h2 className="page-title" style={{ fontSize: 16 }}>
        Assigned indicators
      </h2>
      <table>
        <thead>
          <tr>
            <th>Scope item</th>
            <th>Code</th>
            <th>Name</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {igps.length === 0 && (
            <tr>
              <td colSpan={4}>Nothing linked to you yet.</td>
            </tr>
          )}
          {igps.map((igp) => (
            <tr key={`${igp.scopeItemId}-${igp.code}`}>
              <td className="row-link-cell">
                <Link href={`/scope/${igp.scopeItemId}`}>{igp.scopeItemName}</Link>
              </td>
              <td className="row-link-cell">
                <Link href={`/scope/${igp.scopeItemId}`} className="mono">
                  {igp.code}
                </Link>
              </td>
              <td className="row-link-cell">
                <Link href={`/scope/${igp.scopeItemId}`}>{igp.name}</Link>
              </td>
              <td className="row-link-cell">
                <Link href={`/scope/${igp.scopeItemId}`}>{statusLabel[igp.status as IgpStatus]}</Link>
              </td>
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
              <td className="row-link-cell">
                <Link href={`/scope/${item.id}`}>{item.name}</Link>
              </td>
              <td className="row-link-cell">
                <Link href={`/scope/${item.id}`}>{item.type}</Link>
              </td>
              <td className="row-link-cell">
                <Link href={`/scope/${item.id}`}>{item.criticality}</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
