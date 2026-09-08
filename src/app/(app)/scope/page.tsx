import { scopeItems } from "@/lib/caf-data/seed";

// View-only for now. Add/edit lands once this is backed by Supabase
// (Epic 2), so it persists rather than resetting on refresh.
export default function ScopePage() {
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
