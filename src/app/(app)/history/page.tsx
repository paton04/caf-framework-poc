import { redirect } from "next/navigation";
import Link from "next/link";
import { FreezeCycleForm } from "@/components/FreezeCycleForm";
import { getSnapshots } from "@/lib/caf-data/queries";
import { createClient } from "@/lib/supabase/server";
import { getSessionAndRole } from "@/lib/auth";

// Internal roles only — allow-listed so an unassigned account (role ===
// null) is denied too, not silently treated as internal.
export default async function HistoryPage() {
  const { role } = await getSessionAndRole();
  if (role !== "owner_admin" && role !== "contributor") redirect("/");

  const snapshots = await getSnapshots(await createClient());

  return (
    <>
      <h1 className="page-title">History</h1>
      <p className="page-sub">
        Permanent, read-only snapshots of the whole assessment at a point
        in time — for keeping an exact record of what was submitted for a
        given cycle. Freezing never changes the live data.
      </p>

      {role === "owner_admin" && <FreezeCycleForm />}

      <table style={{ marginTop: 24 }}>
        <thead>
          <tr>
            <th>Cycle</th>
            <th>Frozen</th>
            <th>Frozen by</th>
          </tr>
        </thead>
        <tbody>
          {snapshots.length === 0 && (
            <tr>
              <td colSpan={3}>No snapshots yet.</td>
            </tr>
          )}
          {snapshots.map((s) => (
            <tr key={s.id}>
              <td>
                <Link href={`/history/${s.id}`}>{s.label}</Link>
              </td>
              <td>{s.frozenAt}</td>
              <td>{s.frozenByEmail ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
