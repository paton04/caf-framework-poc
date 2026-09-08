import { evidenceLibrary } from "@/lib/caf-data/seed";

export default function EvidencePage() {
  return (
    <>
      <h1 className="page-title">Evidence library</h1>
      <p className="page-sub">
        All evidence submitted against indicators this cycle, in one place.
      </p>
      <table>
        <thead>
          <tr>
            <th>File</th>
            <th>Linked indicator</th>
            <th>Uploaded</th>
            <th>Status</th>
            <th>Expiry</th>
          </tr>
        </thead>
        <tbody>
          {evidenceLibrary.map((row) => (
            <tr key={row.file}>
              <td>{row.file}</td>
              <td className="mono">{row.linkedIgp}</td>
              <td>{row.uploaded}</td>
              <td>
                <span className="tag">{row.status}</span>
              </td>
              <td>{row.expiry}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
