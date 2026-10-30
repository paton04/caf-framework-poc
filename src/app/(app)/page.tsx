import Link from "next/link";
import { redirect } from "next/navigation";
import { ProgressBar, ProgressLegend, progressTotals, sumProgress } from "@/components/Progress";
import { ScopeItemList } from "@/components/ScopeItemList";
import { SupplierIgpList } from "@/components/SupplierIgpList";
import {
  getConfigurableList,
  getInternalUsers,
  getScopeItemProgress,
  getScopeItems,
  getSupplierIgps,
} from "@/lib/caf-data/queries";
import { createClient } from "@/lib/supabase/server";
import { getSessionAndRole } from "@/lib/auth";

// Entry point per the scope-item-first restructure: pick a scope item —
// or add a new one — then everything else (its own details, its CAF
// assessment) happens on its own /scope/[id] page from there. This is
// the only place scope items are listed; the standalone Scope Register
// page is gone, it was pure duplication of this list. There's no real
// "overview" until you click into an item, so this isn't called that
// anymore — matches the "Scope Items" nav label. Above the list sits the
// one-glance summary: overall progress across every scope item (the
// Enterprise-wide defaults item excluded — it isn't a system in scope)
// and the few things most worth attention next.
export default async function ScopeItemsPage() {
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
  const [scopeItems, internalUsers, types, essentialFunctions] = await Promise.all([
    getScopeItems(supabase),
    getInternalUsers(supabase),
    getConfigurableList(supabase, "scope_item_type"),
    getConfigurableList(supabase, "essential_function"),
  ]);
  const progress = await getScopeItemProgress(
    supabase,
    scopeItems.map((s) => s.id)
  );

  const progressById = Object.fromEntries(progress);
  const regular = scopeItems.filter((s) => !s.isEnterprise);
  const overall = sumProgress(regular.map((s) => progressById[s.id]).filter(Boolean));
  const totals = progressTotals(overall);

  const notAchieved = regular
    .filter((s) => (progressById[s.id]?.not ?? 0) > 0)
    .sort((a, b) => progressById[b.id].not - progressById[a.id].not)
    .slice(0, 2);
  const notStarted = regular.filter((s) => progressById[s.id] && progressTotals(progressById[s.id]).assessed === 0);

  const summary = (
    <section aria-labelledby="overall-heading" className="card stack-md">
      <div className="card-head">
        <h2 id="overall-heading" className="section-heading">
          Overall progress
        </h2>
        <span className="muted">
          {totals.assessed} of {totals.total} outcomes assessed
        </span>
      </div>
      <div className="overall-row">
        <div className="overall-pct">{totals.pct}%</div>
        <ProgressBar progress={overall} size="lg" />
      </div>
      <ProgressLegend progress={overall} />
      {(notAchieved.length > 0 || notStarted.length > 0) && (
        <div className="attention-grid">
          {notAchieved.map((s) => (
            <Link key={s.id} href={`/scope/${s.id}`} className="attention-card attention-not">
              <strong>
                {progressById[s.id].not} outcome{progressById[s.id].not === 1 ? "" : "s"} not achieved
              </strong>
              <span>{s.name}</span>
            </Link>
          ))}
          {notStarted.length > 0 && (
            <div className="attention-card attention-none">
              <strong>
                {notStarted.length} item{notStarted.length === 1 ? "" : "s"} not started
              </strong>
              <span>{notStarted.map((s) => s.name).join(", ")}</span>
            </div>
          )}
        </div>
      )}
    </section>
  );

  return (
    <ScopeItemList
      items={scopeItems}
      internalUsers={internalUsers}
      progress={progressById}
      types={types}
      essentialFunctions={essentialFunctions}
      summary={summary}
    />
  );
}
