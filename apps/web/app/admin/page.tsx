const users = [
  { id: "usr_client_1", name: "Maya Chen", role: "client", status: "active", joined: "Jan 12", trust: 92 },
  { id: "usr_freelancer_1", name: "Ravi Patel", role: "freelancer", status: "active", joined: "Feb 18", trust: 78 },
  { id: "usr_client_2", name: "Nora Smith", role: "client", status: "suspended", joined: "Mar 4", trust: 44 }
];

const flaggedJobs = [
  { id: "job_103", title: "Crypto wallet recovery assistant", status: "flagged", reports: 3 },
  { id: "job_104", title: "Landing page redesign", status: "under_review", reports: 1 }
];

const disputes = [
  { id: "dsp_301", parties: "Maya Chen / Ravi Patel", status: "open", amount: "$1,200" },
  { id: "dsp_302", parties: "Nora Smith / Ravi Patel", status: "under_review", amount: "$350" }
];

export default function AdminPanelPage() {
  return (
    <section className="admin-shell" aria-label="Admin operations panel">
      <header className="admin-header">
        <div>
          <h2>Admin Operations</h2>
          <p>Role-protected controls for users, listings, disputes, platform settings, and audit history.</p>
        </div>
        <button className="button" type="button" aria-label="Refresh dashboard data">Refresh</button>
      </header>

      <div className="metric-grid" aria-label="Trust and platform metrics">
        <Metric label="Total users" value="3" />
        <Metric label="Active jobs" value="2" />
        <Metric label="Open disputes" value="2" />
        <Metric label="Flagged listings" value="2" />
        <Metric label="Revenue" value="$128.9k" />
      </div>

      <section className="panel">
        <div className="section-heading">
          <h3>User Management</h3>
          <div className="filter-row" aria-label="User filters">
            <input aria-label="Search users" placeholder="Search users" />
            <select aria-label="Filter by role" defaultValue="">
              <option value="">All roles</option>
              <option value="client">Client</option>
              <option value="freelancer">Freelancer</option>
            </select>
            <select aria-label="Filter by status" defaultValue="">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </div>
        </div>
        <table>
          <thead>
            <tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th>Trust</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}<span>{user.id}</span></td>
                <td>{user.role}</td>
                <td><Badge value={user.status} /></td>
                <td>{user.joined}</td>
                <td>{user.trust}</td>
                <td className="actions">
                  <button type="button">Suspend</button>
                  <button type="button">Reinstate</button>
                  <button type="button">Ban</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="two-column">
        <section className="panel">
          <h3>Listing Moderation</h3>
          {flaggedJobs.map(job => (
            <article className="queue-item" key={job.id}>
              <div><strong>{job.title}</strong><span>{job.id} · {job.reports} reports</span></div>
              <Badge value={job.status} />
              <div className="actions">
                <button type="button">Approve</button>
                <button type="button">Reject</button>
                <button type="button">Escalate</button>
              </div>
            </article>
          ))}
        </section>

        <section className="panel">
          <h3>Dispute Resolution</h3>
          {disputes.map(dispute => (
            <article className="queue-item" key={dispute.id}>
              <div><strong>{dispute.parties}</strong><span>{dispute.id} · {dispute.amount}</span></div>
              <Badge value={dispute.status} />
              <div className="actions">
                <button type="button">Client</button>
                <button type="button">Freelancer</button>
                <button type="button">Refund</button>
              </div>
            </article>
          ))}
        </section>
      </div>

      <div className="two-column">
        <section className="panel">
          <h3>Platform Controls</h3>
          <label className="toggle"><input type="checkbox" defaultChecked /> New registrations</label>
          <label className="toggle"><input type="checkbox" defaultChecked /> New job postings</label>
          <p>Each API toggle requires an admin token and writes an audit entry.</p>
        </section>

        <section className="panel">
          <h3>Audit Log</h3>
          <div className="filter-row">
            <input aria-label="Filter by admin" placeholder="Admin ID" />
            <input aria-label="Filter by action" placeholder="Action type" />
          </div>
          <ul className="audit-list">
            <li><strong>platform.settings_update</strong><span>Admin changed platform controls</span></li>
            <li><strong>job.reject</strong><span>Rejected listing notification sent</span></li>
          </ul>
        </section>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Badge({ value }: { value: string }) {
  return <span className={`badge ${value.replace("_", "-")}`}>{value.replace("_", " ")}</span>;
}
