export default function AdminPanelPage() {
  const metrics = [
    ["Active users", "4"],
    ["Open jobs", "1"],
    ["Moderation queue", "2"],
    ["Open disputes", "1"]
  ];

  const users = [
    ["Maya Bennett", "Freelancer", "Active", "2 jobs", "1 dispute"],
    ["Priya Shah", "Client", "Active", "2 jobs", "1 dispute"],
    ["Leo Alvarez", "Freelancer", "Suspended", "0 jobs", "0 disputes"]
  ];

  const moderationQueue = [
    ["Migrate legacy API to Node.js", "Flagged", "2 reports", "Review payment terms"],
    ["Design SaaS onboarding flows", "Escalated", "1 report", "Appeal pending"]
  ];

  const disputes = [
    ["DSP-100", "Build an AI customer support widget", "$750", "Open", "Evidence ready"]
  ];

  return (
    <section className="admin-page">
      <header className="admin-header">
        <div>
          <h2>Admin Operations</h2>
          <p>Users, moderation, disputes, controls, and audit activity.</p>
        </div>
        <span className="status-pill">Admin only</span>
      </header>

      <div className="metric-grid">
        {metrics.map(([label, value]) => (
          <article className="metric-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <div className="admin-layout">
        <section className="panel">
          <div className="panel-heading">
            <h3>User Management</h3>
            <span>Search, filter, suspend, reinstate, or ban</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Activity</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {users.map(([name, role, status, activity, risk]) => (
                <tr key={name}>
                  <td data-label="User">{name}</td>
                  <td data-label="Role">{role}</td>
                  <td data-label="Status"><span className={`status-pill ${status.toLowerCase()}`}>{status}</span></td>
                  <td data-label="Activity">{activity}</td>
                  <td data-label="Risk">{risk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h3>Job Moderation</h3>
            <span>Approve, reject, or escalate flagged listings</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Listing</th>
                <th>Status</th>
                <th>Signals</th>
                <th>Next action</th>
              </tr>
            </thead>
            <tbody>
              {moderationQueue.map(([listing, status, signals, action]) => (
                <tr key={listing}>
                  <td data-label="Listing">{listing}</td>
                  <td data-label="Status"><span className={`status-pill ${status.toLowerCase()}`}>{status}</span></td>
                  <td data-label="Signals">{signals}</td>
                  <td data-label="Next action">{action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h3>Dispute Resolution</h3>
            <span>Review evidence, rule, refund, or escalate</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Job</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map(([id, job, amount, status, evidence]) => (
                <tr key={id}>
                  <td data-label="ID">{id}</td>
                  <td data-label="Job">{job}</td>
                  <td data-label="Amount">{amount}</td>
                  <td data-label="Status"><span className="status-pill">{status}</span></td>
                  <td data-label="Evidence">{evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <aside className="panel controls-panel">
          <div className="panel-heading">
            <h3>Platform Controls</h3>
            <span>Server-backed toggles</span>
          </div>
          <dl>
            <div>
              <dt>Registrations</dt>
              <dd>Enabled</dd>
            </div>
            <div>
              <dt>Job posting</dt>
              <dd>Enabled</dd>
            </div>
            <div>
              <dt>Automatic payouts</dt>
              <dd>Review required</dd>
            </div>
            <div>
              <dt>Audit log</dt>
              <dd>Recording admin actions</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}
