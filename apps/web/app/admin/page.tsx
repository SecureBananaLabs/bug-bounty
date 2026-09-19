import { redirect } from "next/navigation";

function requireAdminRoute() {
  const role = process.env.NEXT_PUBLIC_ADMIN_ROLE ?? "admin";
  if (role !== "admin") {
    redirect("/forbidden");
  }
}

const metrics = [
  ["Total users", "5"],
  ["Active jobs", "10"],
  ["Open disputes", "2"],
  ["Flagged listings", "2"],
  ["Revenue", "$128.9k"]
];

const users = [
  ["Maya Chen", "client", "active", "88", "3 jobs"],
  ["Sam Rivera", "freelancer", "suspended", "61", "2 disputes"],
  ["Rhea Patel", "freelancer", "active", "92", "4 jobs"]
];

const listings = [
  ["Scrape competitor pricing daily", "Automated data collection risk", "flagged"],
  ["AI outreach system for 40k contacts", "Bulk outreach compliance review", "flagged"]
];

const disputes = [
  ["dsp_1", "Maya Chen vs Sam Rivera", "$900", "open"],
  ["dsp_2", "Oliver Grant vs Sam Rivera", "$450", "under_review"]
];

const audit = [
  ["user.suspended", "usr_freelancer_2", "User marked suspended"],
  ["listing.rejected", "flg_2", "Notification sent to posting user"],
  ["control.jobPostings", "jobPostings", "New job postings disabled"]
];

export default function AdminPanelPage() {
  requireAdminRoute();

  return (
    <section className="admin-shell" aria-labelledby="admin-title">
      <div className="admin-topline">
        <div>
          <p className="eyebrow">Admin operations</p>
          <h2 id="admin-title">Trust, moderation, and platform controls</h2>
        </div>
        <button className="admin-button" type="button" aria-label="Refresh admin dashboard data">
          Refresh
        </button>
      </div>

      <div className="metric-grid" aria-label="Platform metrics">
        {metrics.map(([label, value]) => (
          <div className="metric-tile" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="admin-layout">
        <section className="admin-section" aria-labelledby="users-title">
          <div className="section-heading">
            <h3 id="users-title">User management</h3>
            <div className="filter-row" aria-label="User filters">
              <select aria-label="Filter users by role" defaultValue="all">
                <option value="all">All roles</option>
                <option value="client">Clients</option>
                <option value="freelancer">Freelancers</option>
              </select>
              <select aria-label="Filter users by status" defaultValue="all">
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </select>
            </div>
          </div>
          <table aria-label="Registered users">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Trust</th>
                <th>Context</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(([name, role, status, trust, context]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{role}</td>
                  <td><span className={`status ${status}`}>{status}</span></td>
                  <td>{trust}</td>
                  <td>{context}</td>
                  <td>
                    <button className="icon-button" type="button" aria-label={`Open profile for ${name}`}>Open</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination" aria-label="User table pagination">
            <button type="button">Prev</button>
            <span>Page 1 of 2</span>
            <button type="button">Next</button>
          </div>
        </section>

        <aside className="admin-section compact" aria-labelledby="controls-title">
          <h3 id="controls-title">Platform controls</h3>
          <label className="toggle-row">
            <input type="checkbox" defaultChecked aria-label="Enable new user registrations" />
            <span>New user registrations</span>
          </label>
          <label className="toggle-row">
            <input type="checkbox" defaultChecked aria-label="Enable new job postings" />
            <span>New job postings</span>
          </label>
          <p className="quiet">Every change requires confirmation server-side and writes an audit event.</p>
        </aside>
      </div>

      <div className="admin-layout">
        <section className="admin-section" aria-labelledby="moderation-title">
          <h3 id="moderation-title">Listing moderation queue</h3>
          <div className="queue-list">
            {listings.map(([title, reason, status]) => (
              <article className="queue-item" key={title}>
                <div>
                  <strong>{title}</strong>
                  <p>{reason}</p>
                </div>
                <span className={`status ${status}`}>{status}</span>
                <div className="action-row">
                  <button type="button">Approve</button>
                  <button type="button">Reject</button>
                  <button type="button">Escalate</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-section" aria-labelledby="trust-title">
          <h3 id="trust-title">Trust score distribution</h3>
          <div className="bar-chart" aria-label="Trust score distribution chart">
            {[
              ["0-49", 0],
              ["50-69", 1],
              ["70-89", 2],
              ["90-100", 2]
            ].map(([range, count]) => (
              <div className="bar-row" key={range}>
                <span>{range}</span>
                <div><i style={{ width: `${Number(count) * 35 + 8}%` }} /></div>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="admin-section" aria-labelledby="disputes-title">
        <h3 id="disputes-title">Dispute resolution</h3>
        <table aria-label="Open disputes">
          <thead>
            <tr>
              <th>ID</th>
              <th>Parties</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Ruling</th>
            </tr>
          </thead>
          <tbody>
            {disputes.map(([id, parties, amount, status]) => (
              <tr key={id}>
                <td>{id}</td>
                <td>{parties}</td>
                <td>{amount}</td>
                <td><span className={`status ${status}`}>{status}</span></td>
                <td>
                  <div className="action-row">
                    <button type="button">Client</button>
                    <button type="button">Freelancer</button>
                    <button type="button">Refund</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="admin-section" aria-labelledby="audit-title">
        <div className="section-heading">
          <h3 id="audit-title">Audit log</h3>
          <div className="filter-row" aria-label="Audit log filters">
            <input aria-label="Filter audit log by admin ID" placeholder="Admin ID" />
            <input aria-label="Filter audit log by action type" placeholder="Action type" />
          </div>
        </div>
        <table aria-label="Admin audit log">
          <thead>
            <tr>
              <th>Action</th>
              <th>Target</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {audit.map(([action, target, message]) => (
              <tr key={`${action}-${target}`}>
                <td>{action}</td>
                <td>{target}</td>
                <td>{message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}
