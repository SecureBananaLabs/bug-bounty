const metrics = [
  ["Total users", "3"],
  ["Active jobs", "9"],
  ["Open disputes", "1"],
  ["Flagged listings", "2"],
  ["Revenue", "$128,900"]
];

const users = [
  ["Maya Chen", "client", "active", "87", "3", "1"],
  ["Rafael Ortiz", "freelancer", "active", "94", "5", "0"],
  ["Iris Taylor", "freelancer", "suspended", "42", "1", "3"]
];

const flaggedJobs = [
  ["Urgent escrow migration", "High-risk payment language", "flagged"],
  ["Landing page clone", "Potential IP infringement", "under_review"]
];

const disputes = [
  ["disp_1", "job_flagged_1", "$1,200", "open", "milestone-chat.pdf, delivery.zip"]
];

const auditRows = [
  ["system", "admin_panel_seeded", "platform", "freelanceflow"]
];

export default function AdminPanelPage() {
  return (
    <section className="admin-shell" aria-labelledby="admin-title">
      <div className="admin-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h2 id="admin-title">Operations Panel</h2>
        </div>
        <button type="button" className="primary-button">
          Refresh
        </button>
      </div>

      <div className="metric-grid" aria-label="Platform metrics">
        {metrics.map(([label, value]) => (
          <div className="metric-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="admin-grid">
        <section className="admin-panel" aria-labelledby="trust-title">
          <h3 id="trust-title">Trust Distribution</h3>
          <div className="bars" aria-label="Trust score distribution">
            <span style={{ height: "76%" }}>High</span>
            <span style={{ height: "34%" }}>Medium</span>
            <span style={{ height: "42%" }}>Low</span>
          </div>
        </section>

        <section className="admin-panel" aria-labelledby="controls-title">
          <h3 id="controls-title">Platform Controls</h3>
          <label className="switch-row">
            <span>New registrations</span>
            <input type="checkbox" defaultChecked aria-label="Enable new registrations" />
          </label>
          <label className="switch-row">
            <span>New job postings</span>
            <input type="checkbox" defaultChecked aria-label="Enable new job postings" />
          </label>
        </section>
      </div>

      <section className="admin-panel" aria-labelledby="users-title">
        <div className="section-head">
          <h3 id="users-title">User Management</h3>
          <div className="filters" aria-label="User filters">
            <input aria-label="Search users" placeholder="Search" />
            <select aria-label="Filter by role" defaultValue="">
              <option value="">All roles</option>
              <option value="client">Client</option>
              <option value="freelancer">Freelancer</option>
            </select>
            <select aria-label="Filter by status" defaultValue="">
              <option value="">All status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Trust</th>
              <th>Jobs</th>
              <th>Disputes</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(([name, role, status, trust, jobs, disputesCount]) => (
              <tr key={name}>
                <td>{name}</td>
                <td>{role}</td>
                <td>{status}</td>
                <td>{trust}</td>
                <td>{jobs}</td>
                <td>{disputesCount}</td>
                <td>
                  <button type="button">Suspend</button>
                  <button type="button">Reinstate</button>
                  <button type="button">Ban</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="admin-panel" aria-labelledby="moderation-title">
        <h3 id="moderation-title">Job Moderation</h3>
        <table>
          <thead>
            <tr>
              <th>Listing</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Decision</th>
            </tr>
          </thead>
          <tbody>
            {flaggedJobs.map(([title, reason, status]) => (
              <tr key={title}>
                <td>{title}</td>
                <td>{reason}</td>
                <td>{status}</td>
                <td>
                  <button type="button">Approve</button>
                  <button type="button">Reject</button>
                  <button type="button">Escalate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="admin-panel" aria-labelledby="disputes-title">
        <h3 id="disputes-title">Dispute Resolution</h3>
        <table>
          <thead>
            <tr>
              <th>Dispute</th>
              <th>Job</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Evidence</th>
              <th>Ruling</th>
            </tr>
          </thead>
          <tbody>
            {disputes.map(([id, job, amount, status, evidence]) => (
              <tr key={id}>
                <td>{id}</td>
                <td>{job}</td>
                <td>{amount}</td>
                <td>{status}</td>
                <td>{evidence}</td>
                <td>
                  <button type="button">Client</button>
                  <button type="button">Freelancer</button>
                  <button type="button">Escalate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="admin-panel" aria-labelledby="audit-title">
        <h3 id="audit-title">Audit Log</h3>
        <table>
          <thead>
            <tr>
              <th>Admin</th>
              <th>Action</th>
              <th>Target</th>
              <th>ID</th>
            </tr>
          </thead>
          <tbody>
            {auditRows.map(([admin, action, target, id]) => (
              <tr key={`${admin}-${action}`}>
                <td>{admin}</td>
                <td>{action}</td>
                <td>{target}</td>
                <td>{id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}
