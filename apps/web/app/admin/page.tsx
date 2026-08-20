const metrics = [
  ["Total users", "5", "+2 today"],
  ["Active jobs", "42", "4 flagged"],
  ["Open disputes", "2", "1 high value"],
  ["Revenue period", "$128.9K", "manual refresh ready"],
];

const users = [
  ["Maya Chen", "Freelancer", "Active", "96", "3 jobs", "0 disputes"],
  ["Owen Grant", "Client", "Active", "88", "5 jobs", "1 dispute"],
  ["Priya Shah", "Freelancer", "Suspended", "42", "1 job", "2 disputes"],
  ["Lina Park", "Client", "Flagged", "51", "4 jobs", "2 disputes"],
];

const moderation = [
  ["AI marketplace scraper", "Potential ToS violation", "High", "Flagged"],
  ["Mobile app payment review", "Budget mismatch", "Medium", "Under review"],
  ["Data annotation sprint", "User report", "Low", "Flagged"],
];

const disputes = [
  ["DSP-9001", "Admin dashboard review", "$450", "Open", "4 files"],
  ["DSP-9002", "API integration", "$820", "Under review", "7 files"],
  ["DSP-9003", "Landing page QA", "$260", "Resolved", "3 files"],
];

const auditLog = [
  ["10:18", "account_status", "usr_1003", "Suspended after duplicate evidence"],
  ["10:08", "listing_review", "job_flagged_2", "Escalated for senior review"],
  ["09:40", "platform_toggle", "jobPosting", "Temporarily disabled during review"],
];

function statusClass(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("active") || normalized.includes("resolved") || normalized.includes("low")) return "badge badge-good";
  if (normalized.includes("review") || normalized.includes("medium") || normalized.includes("open")) return "badge badge-warn";
  return "badge badge-risk";
}

export default function AdminPanelPage() {
  return (
    <section className="admin-shell" aria-labelledby="admin-title">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h2 id="admin-title">Admin control center</h2>
        </div>
        <div className="admin-actions" aria-label="Admin actions">
          <button type="button" className="ghost-button">Refresh</button>
          <button type="button" className="primary-button">Export audit</button>
        </div>
      </header>

      <div className="kpi-ribbon" aria-label="Platform metrics">
        {metrics.map(([label, value, note]) => (
          <div className="kpi-tile" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{note}</small>
          </div>
        ))}
      </div>

      <form className="filter-bar" aria-label="Admin filters">
        <label>
          Search
          <input type="search" placeholder="User, job, dispute, audit id" />
        </label>
        <label>
          Role
          <select defaultValue="all">
            <option value="all">All roles</option>
            <option value="client">Clients</option>
            <option value="freelancer">Freelancers</option>
          </select>
        </label>
        <label>
          Status
          <select defaultValue="open">
            <option value="open">Open work</option>
            <option value="flagged">Flagged</option>
            <option value="resolved">Resolved</option>
          </select>
        </label>
      </form>

      <div className="admin-grid">
        <section className="admin-panel wide" aria-labelledby="users-heading">
          <div className="panel-heading">
            <h3 id="users-heading">User management</h3>
            <button type="button" className="ghost-button">View all</button>
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
              {users.map(([name, role, status, trust, jobs, disputeCount]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{role}</td>
                  <td><span className={statusClass(status)}>{status}</span></td>
                  <td className="numeric">{trust}</td>
                  <td>{jobs}</td>
                  <td>{disputeCount}</td>
                  <td><button type="button" className="table-action">Review</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="admin-panel" aria-labelledby="moderation-heading">
          <div className="panel-heading">
            <h3 id="moderation-heading">Job moderation</h3>
            <button type="button" className="ghost-button">Queue</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Listing</th>
                <th>Reason</th>
                <th>Risk</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {moderation.map(([listing, reason, risk, status]) => (
                <tr key={listing}>
                  <td>{listing}</td>
                  <td>{reason}</td>
                  <td><span className={statusClass(risk)}>{risk}</span></td>
                  <td>{status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="admin-panel" aria-labelledby="disputes-heading">
          <div className="panel-heading">
            <h3 id="disputes-heading">Dispute resolution</h3>
            <button type="button" className="ghost-button">Escalate</button>
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
                  <td className="numeric">{id}</td>
                  <td>{job}</td>
                  <td className="numeric">{amount}</td>
                  <td><span className={statusClass(status)}>{status}</span></td>
                  <td>{evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="admin-panel controls" aria-labelledby="controls-heading">
          <h3 id="controls-heading">Platform controls</h3>
          <label className="toggle-row">
            <span>New registrations</span>
            <input type="checkbox" defaultChecked aria-label="Enable new registrations" />
          </label>
          <label className="toggle-row">
            <span>New job postings</span>
            <input type="checkbox" defaultChecked aria-label="Enable new job postings" />
          </label>
          <button type="button" className="primary-button">Apply with audit entry</button>
        </section>

        <section className="admin-panel audit" aria-labelledby="audit-heading">
          <div className="panel-heading">
            <h3 id="audit-heading">Audit log</h3>
            <button type="button" className="ghost-button">Filter</button>
          </div>
          <ul>
            {auditLog.map(([time, action, target, detail]) => (
              <li key={`${time}-${target}`}>
                <span className="numeric">{time}</span>
                <strong>{action}</strong>
                <em>{target}</em>
                <p>{detail}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}
