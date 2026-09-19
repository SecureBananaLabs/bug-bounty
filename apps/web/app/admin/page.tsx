const metrics = [
  ["Total users", "3"],
  ["Active jobs", "1"],
  ["Open disputes", "1"],
  ["Flagged listings", "1"],
  ["Revenue", "$1,250"]
];

const users = [
  ["Maya Chen", "client", "active", "92"],
  ["Noah Patel", "freelancer", "active", "84"],
  ["Ari Gomez", "freelancer", "suspended", "41"]
];

const disputes = [
  ["disp_1", "Build escrow landing page", "open", "$1,250"]
];

export default function AdminPanelPage() {
  return (
    <section className="admin-shell" aria-label="Admin panel">
      <div className="admin-header">
        <div>
          <h2>Admin Panel</h2>
          <p>Users, moderation, disputes, controls, and audit history.</p>
        </div>
        <button type="button" className="admin-button">
          Refresh
        </button>
      </div>

      <div className="admin-metrics" aria-label="Trust and platform metrics">
        {metrics.map(([label, value]) => (
          <div className="admin-tile" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="admin-grid">
        <section className="admin-panel" aria-labelledby="users-heading">
          <div className="admin-panel-header">
            <h3 id="users-heading">User Management</h3>
            <input aria-label="Search users" placeholder="Search users" />
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Trust</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(([name, role, status, trust]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{role}</td>
                  <td>{status}</td>
                  <td>{trust}</td>
                  <td>
                    <button type="button" className="admin-link-button">
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="admin-panel" aria-labelledby="moderation-heading">
          <div className="admin-panel-header">
            <h3 id="moderation-heading">Job Moderation</h3>
            <span className="admin-badge">1 flagged</span>
          </div>
          <div className="admin-list-row">
            <div>
              <strong>Suspicious lead scraping bot</strong>
              <p>Automated moderation flagged prohibited scraping language.</p>
            </div>
            <div className="admin-actions">
              <button type="button" className="admin-link-button">
                Approve
              </button>
              <button type="button" className="admin-link-button danger">
                Reject
              </button>
            </div>
          </div>
        </section>

        <section className="admin-panel" aria-labelledby="disputes-heading">
          <div className="admin-panel-header">
            <h3 id="disputes-heading">Dispute Resolution</h3>
            <span className="admin-badge">Open</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Job</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map(([id, job, status, amount]) => (
                <tr key={id}>
                  <td>{id}</td>
                  <td>{job}</td>
                  <td>{status}</td>
                  <td>{amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="admin-panel" aria-labelledby="controls-heading">
          <div className="admin-panel-header">
            <h3 id="controls-heading">Platform Controls</h3>
          </div>
          <label className="admin-toggle">
            <input type="checkbox" defaultChecked />
            <span>New user registrations</span>
          </label>
          <label className="admin-toggle">
            <input type="checkbox" defaultChecked />
            <span>New job postings</span>
          </label>
        </section>
      </div>

      <section className="admin-panel" aria-labelledby="audit-heading">
        <div className="admin-panel-header">
          <h3 id="audit-heading">Audit Log</h3>
          <input aria-label="Filter audit log" placeholder="Filter by action" />
        </div>
        <p className="admin-empty">Admin actions appear here after moderation, rulings, or control changes.</p>
      </section>
    </section>
  );
}
