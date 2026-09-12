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

  return (
    <>
      <h1 className="page-title">{snapshot.label}</h1>
      <p className="page-sub">
        Frozen {snapshot.frozenAt} by {snapshot.frozenByEmail ?? "—"}. Read-only —
        this is exactly how things stood at that moment, regardless of what&apos;s
        changed since.
      </p>

      {snapshot.data.sections.map((sec) => (
        <div key={sec.code} style={{ marginBottom: 28 }}>
          <h2 className="page-title" style={{ fontSize: 16 }}>
            Section {sec.code} — {sec.name}
          </h2>
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

      <h2 className="page-title" style={{ fontSize: 16 }}>
        Scope register
      </h2>
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
          {snapshot.data.scopeItems.length === 0 && (
            <tr>
              <td colSpan={5}>No scope items at the time this was frozen.</td>
            </tr>
          )}
          {snapshot.data.scopeItems.map((item) => (
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
    </>
  );
}
