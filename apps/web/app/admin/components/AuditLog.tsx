import type { AuditLogEntry } from "../../../lib/adminTypes";

type Props = {
  entries: AuditLogEntry[];
};

export function AuditLog({ entries }: Props) {
  return (
    <section className="admin-section" id="admin-audit-log" aria-labelledby="admin-audit-log-title">
      <div className="admin-section-heading">
        <div>
          <p className="admin-eyebrow">Audit log</p>
          <h2 id="admin-audit-log-title">Recent actions</h2>
        </div>
      </div>
      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Time</th>
              <th scope="col">Admin</th>
              <th scope="col">Action</th>
              <th scope="col">Target</th>
              <th scope="col">Detail</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{new Date(entry.createdAt).toLocaleString("en-US")}</td>
                <td>{entry.adminId}</td>
                <td>{entry.actionType}</td>
                <td>
                  {entry.targetType}:{entry.targetId}
                </td>
                <td>{entry.detail}</td>
              </tr>
            ))}
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="admin-empty-state">
                  No audit entries.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
