const metrics = [
  ["Total users", "5"],
  ["Active jobs", "5"],
  ["Open disputes", "2"],
  ["Flagged listings", "2"],
  ["Revenue", "$128.9k"]
];

const users = [
  ["Maya Chen", "freelancer", "active", "94", "1"],
  ["Orion Labs", "client", "active", "71", "2"],
  ["Nora Security", "freelancer", "under_review", "48", "0"],
  ["Cedar Ventures", "client", "suspended", "38", "1"]
];

const moderation = [
  ["Protected portal scraping", "credential-safety rule", "flagged"],
  ["AI onboarding flow copy review", "duplicate listing report", "under_review"]
];

const disputes = [
  ["dsp_001", "Legacy API migration", "$1,800", "open"],
  ["dsp_002", "Protected portal scraping", "$640", "under_review"]
];

const audit = [
  ["admin.user.status_changed", "usr_002", "Reason captured"],
  ["admin.listing.reject", "job_flag_001", "Poster notified"],
  ["admin.control.updated", "newJobPostings", "Confirmation required"]
];

export default function AdminPanelPage() {
  return (
    <section className="admin-shell" aria-labelledby="admin-title">
      <div className="admin-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h2 id="admin-title">Admin Control Center</h2>
        </div>
        <div className="admin-auth">Server admin guard active</div>
      </div>

      <div className="metric-grid" aria-label="Platform metrics">
        {metrics.map(([label, value]) => (
          <article className="metric-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <div className="admin-grid">
        <section className="admin-panel" aria-labelledby="users-title">
          <div className="panel-head">
            <h3 id="users-title">Users</h3>
            <button type="button" aria-label="Refresh users">Refresh</button>
          </div>
          <div className="filter-row" aria-label="User filters">
            <span>Role: all</span>
            <span>Status: all</span>
            <span>Page size: 10</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Trust</th>
                <th>Jobs</th>
              </tr>
            </thead>
            <tbody>
              {users.map(([name, role, status, trust, jobs]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{role}</td>
                  <td><span className={`status status-${status}`}>{status}</span></td>
                  <td>{trust}</td>
                  <td>{jobs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="admin-panel" aria-labelledby="moderation-title">
          <div className="panel-head">
            <h3 id="moderation-title">Moderation Queue</h3>
            <button type="button" aria-label="Escalate selected listing">Escalate</button>
          </div>
          {moderation.map(([title, reason, status]) => (
            <article className="queue-item" key={title}>
              <div>
                <strong>{title}</strong>
                <span>{reason}</span>
              </div>
              <div className="action-row">
                <span className={`status status-${status}`}>{status}</span>
                <button type="button" aria-label={`Approve ${title}`}>Approve</button>
                <button type="button" aria-label={`Reject ${title}`}>Reject</button>
              </div>
            </article>
          ))}
        </section>

        <section className="admin-panel" aria-labelledby="disputes-title">
          <div className="panel-head">
            <h3 id="disputes-title">Disputes</h3>
            <button type="button" aria-label="Refresh disputes">Refresh</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Job</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map(([id, job, amount, status]) => (
                <tr key={id}>
                  <td>{id}</td>
                  <td>{job}</td>
                  <td>{amount}</td>
                  <td><span className={`status status-${status}`}>{status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="action-row">
            <button type="button" aria-label="Rule for client">Client ruling</button>
            <button type="button" aria-label="Rule for freelancer">Freelancer ruling</button>
            <button type="button" aria-label="Trigger refund">Refund</button>
          </div>
        </section>

        <section className="admin-panel" aria-labelledby="controls-title">
          <div className="panel-head">
            <h3 id="controls-title">Platform Controls</h3>
            <span className="status status-active">confirmation required</span>
          </div>
          <label className="toggle-row">
            <input type="checkbox" defaultChecked aria-label="Enable new user registrations" />
            <span>New user registrations</span>
          </label>
          <label className="toggle-row">
            <input type="checkbox" defaultChecked aria-label="Enable new job postings" />
            <span>New job postings</span>
          </label>
          <div className="trust-bars" aria-label="Trust score distribution">
            <span style={{ width: "40%" }}>0-49</span>
            <span style={{ width: "20%" }}>50-74</span>
            <span style={{ width: "60%" }}>75-100</span>
          </div>
        </section>

        <section className="admin-panel wide-panel" aria-labelledby="audit-title">
          <div className="panel-head">
            <h3 id="audit-title">Audit Log</h3>
            <div className="filter-row">
              <span>Admin: all</span>
              <span>Action: all</span>
              <span>Date: current period</span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Target</th>
                <th>Metadata</th>
              </tr>
            </thead>
            <tbody>
              {audit.map(([action, target, metadata]) => (
                <tr key={`${action}-${target}`}>
                  <td>{action}</td>
                  <td>{target}</td>
                  <td>{metadata}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </section>
  );
}
