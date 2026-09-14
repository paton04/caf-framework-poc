import { redirect } from "next/navigation";
import Link from "next/link";
import { SupplierIgpList } from "@/components/SupplierIgpList";
import { getScopeItems, getSupplierIgps } from "@/lib/caf-data/queries";
import { createClient } from "@/lib/supabase/server";
import { getSessionAndRole } from "@/lib/auth";

// Entry point per the scope-item-first restructure: pick a scope item,
// then work through its own full CAF assessment. Replaces the old
// org-wide heatmap — a single indicator no longer has one status once
// it's scope-item-specific, so there's no single "overview" state to show.
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

  const scopeItems = await getScopeItems(await createClient());

  return (
    <>
      <h1 className="page-title">Scope items</h1>
      <p className="page-sub">
        Pick a scope item to work through its CAF assessment — every
        indicator, justified and evidenced for that item specifically.
        Manage scope item details on the{" "}
        <Link href="/scope">Scope Register</Link>.
      </p>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Essential function</th>
            <th>Criticality</th>
          </tr>
        </thead>
        <tbody>
          {scopeItems.length === 0 && (
            <tr>
              <td colSpan={4}>
                No scope items yet — add one on the{" "}
                <Link href="/scope">Scope Register</Link>.
              </td>
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
                <Link href={`/scope/${item.id}`}>{item.essentialFunction}</Link>
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
