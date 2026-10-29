import { notFound, redirect } from "next/navigation";
import { getSnapshotDetail } from "@/lib/caf-data/queries";
import { createClient } from "@/lib/supabase/server";
import { getSessionAndRole } from "@/lib/auth";
import { reviewStatusLabel, statusClass, statusLabel } from "@/lib/caf-data/types";

export default async function SnapshotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { role } = await getSessionAndRole();
  if (role !== "owner_admin" && role !== "contributor") redirect("/");

  const { id } = await params;
  const snapshot = await getSnapshotDetail(await createClient(), id);
  if (!snapshot) notFound();

  // Snapshots are permanent — a frozen `data` blob never gets rewritten
  // (see 0009_cycle_snapshots.sql), so one written by an earlier version
  // of the app before today's shape existed can still be missing fields
  // it never had a chance to include. Guard against that rather than
  // let the whole read-only history view crash on one old row.
  const scopeItems = snapshot.data.scopeItems ?? [];
  const assessments = snapshot.data.assessments ?? [];
  const incomplete = !snapshot.data.scopeItems || !snapshot.data.assessments;

  return (
    <>
      <h1 className="page-title">{snapshot.label}</h1>
      <p className="page-sub">
        Frozen {snapshot.frozenAt} by {snapshot.frozenByEmail ?? "—"}. Read-only —
        this is exactly how things stood at that moment, regardless of what&apos;s
        changed since.
      </p>
      {incomplete && (
        <div className="banner auth-error" style={{ marginBottom: 20 }}>
          This snapshot&apos;s stored data is incomplete — it was likely
          frozen by an earlier version of the tool before some of what&apos;s
          shown below existed. What can be shown is shown; the rest can&apos;t
          be recovered, since a frozen snapshot is never rewritten.
        </div>
      )}

      <h2 className="page-title" style={{ fontSize: 16 }}>
        Scope register
      </h2>
      <table style={{ marginBottom: 28 }}>
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
          {scopeItems.length === 0 && (
            <tr>
              <td colSpan={5}>No scope items at the time this was frozen.</td>
            </tr>
          )}
          {scopeItems.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.type}</td>
              <td>{item.essentialFunction}</td>
              <td>{item.criticality}</td>
              <td>{item.owner || "Unassigned"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {assessments.map(({ scopeItem, sections, generalEvidence }) => (
        <div key={scopeItem.id} style={{ marginBottom: 32 }}>
          <h2 className="page-title" style={{ fontSize: 16 }}>
            {scopeItem.name}
          </h2>
          {generalEvidence.length > 0 && (
            <p className="page-sub" style={{ margin: "0 0 12px 0" }}>
              General evidence:{" "}
              {generalEvidence
                .map((f) => `${f.name} — ${f.description ?? "—"} (${reviewStatusLabel[f.reviewStatus]})`)
                .join("; ")}
            </p>
          )}
          {sections.map((sec) => (
            <div key={sec.code} style={{ marginBottom: 16 }}>
              <p className="page-sub" style={{ margin: "0 0 6px 0" }}>
                Section {sec.code} — {sec.name}
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Narrative</th>
                    <th>Owner</th>
                    <th>Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {sec.principles.map((p) => (
                    <tr key={p.id}>
                      <td className="mono">{p.id}</td>
                      <td>{p.name}</td>
                      <td>
                        <span className={`status ${statusClass[p.status]}`}>{statusLabel[p.status]}</span>
                      </td>
                      <td>{p.narrative || "—"}</td>
                      <td>{p.owner || "Unassigned"}</td>
                      <td>
                        {p.evidence.length === 0
                          ? "—"
                          : p.evidence
                              .map((f) => `${f.name} (${reviewStatusLabel[f.reviewStatus]})`)
                              .join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
