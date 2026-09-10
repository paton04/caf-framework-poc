import { suppliers, statusLabel, type IgpStatus } from "@/lib/caf-data/seed";

const statusColorVar: Record<IgpStatus, string> = {
  achieved: "var(--achieved)",
  partial: "var(--partial)",
  not: "var(--not-achieved)",
  none: "var(--not-started)",
};

export default function SuppliersPage() {
  return (
    <>
      <h1 className="page-title">Suppliers</h1>
      <div className="banner">
        Supplier accounts can only see and submit their own evidence. They
        cannot see internal narrative, other suppliers, or unrelated
        sections.
      </div>
      <table>
        <thead>
          <tr>
            <th>Supplier</th>
            <th>Essential function supported</th>
            <th>Access</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((s) => (
            <tr key={s.name}>
              <td>{s.name}</td>
              <td>{s.essentialFunction}</td>
              <td>
                <span className="tag role-tag-sup">Supplier — own data only</span>
              </td>
              <td>
                <span
                  className="tag"
                  style={{ color: statusColorVar[s.status], borderColor: statusColorVar[s.status] }}
                >
                  {statusLabel[s.status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
