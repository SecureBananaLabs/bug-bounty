const metrics = [
  ["Total users", "4"],
  ["Active jobs", "9"],
  ["Open disputes", "2"],
  ["Flagged listings", "2"],
  ["Revenue", "$128,900"]
];

const users = [
  ["usr_101", "Maya Chen", "Freelancer", "Active", "3 jobs", "0 disputes"],
  ["usr_102", "Jordan Lee", "Client", "Active", "5 jobs", "1 dispute"],
  ["usr_103", "Noor Patel", "Freelancer", "Suspended", "1 job", "2 disputes"]
];

const flaggedListings = [
  ["flag_201", "Scrape private marketplace data", "Automated rule", "Pending"],
  ["flag_202", "Build secure checkout audit", "User report", "Escalated"]
];

const disputes = [
  ["dsp_301", "job_155", "Open", "$900", "milestone chat, delivery zip"],
  ["dsp_302", "job_166", "Under review", "$2,500", "invoice, test report"]
];

const auditRows = [
  ["audit_001", "seed-admin", "panel_seeded", "system"],
  ["audit_002", "admin-demo", "user_suspended", "usr_103"],
  ["audit_003", "admin-demo", "listing_escalated", "flag_202"]
];

function Toolbar() {
  return (
    <div className="admin-toolbar" aria-label="Admin filters and refresh controls">
      <label>
        Search
        <input aria-label="Search users and jobs" placeholder="user, job, dispute" />
      </label>
      <label>
        Role
        <select aria-label="Filter by role" defaultValue="all">
          <option value="all">All roles</option>
          <option value="client">Clients</option>
          <option value="freelancer">Freelancers</option>
        </select>
      </label>
      <label>
        Status
        <select aria-label="Filter by status" defaultValue="all">
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
      </label>
      <button aria-label="Refresh admin dashboard data">Refresh</button>
    </div>
  );
}

function DataTable({
  title,
  headers,
  rows,
  actions
}: {
  title: string;
  headers: string[];
  rows: string[][];
  actions: string[];
}) {
  return (
    <section className="admin-section" aria-labelledby={`${title}-heading`}>
      <div className="section-heading">
        <h2 id={`${title}-heading`}>{title}</h2>
        <span>{rows.length} records</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header} scope="col">
                  {header}
                </th>
              ))}
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]}>
                {row.map((cell) => (
                  <td key={`${row[0]}-${cell}`}>{cell}</td>
                ))}
                <td>
                  <div className="row-actions">
                    {actions.map((action) => (
                      <button key={action} aria-label={`${action} ${row[0]}`}>
                        {action}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="state-row" aria-live="polite">
        <span>Loading state ready</span>
        <span>Empty state ready</span>
        <span>Error state ready</span>
        <span>Server-side pagination enabled</span>
      </div>
    </section>
  );
}

export default function AdminPanelPage() {
  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p>Admin operations</p>
          <h1>FreelanceFlow Control Room</h1>
        </div>
        <span className="access-badge">Server-side admin guard</span>
      </header>

      <Toolbar />

      <section className="metric-grid" aria-label="Platform metrics">
        {metrics.map(([label, value]) => (
          <article className="metric-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="admin-section" aria-labelledby="trust-heading">
        <div className="section-heading">
          <h2 id="trust-heading">Trust Score Distribution</h2>
          <span>Current period</span>
        </div>
        <div className="trust-bars" aria-label="Trust score distribution chart">
          {[12, 24, 46, 70, 92].map((height, index) => (
            <div key={height}>
              <span style={{ height: `${height}%` }} />
              <small>{index * 20}-{index * 20 + 20}</small>
            </div>
          ))}
        </div>
      </section>

      <DataTable
        title="User Management"
        headers={["ID", "Name", "Role", "Status", "Jobs", "Disputes"]}
        rows={users}
        actions={["View", "Suspend", "Reinstate", "Ban"]}
      />

      <DataTable
        title="Job Moderation"
        headers={["ID", "Listing", "Reporter", "Status"]}
        rows={flaggedListings}
        actions={["Approve", "Reject", "Escalate"]}
      />

      <DataTable
        title="Dispute Resolution"
        headers={["ID", "Job", "Status", "Amount", "Evidence"]}
        rows={disputes}
        actions={["Freelancer", "Client", "Escalate"]}
      />

      <section className="admin-section controls" aria-labelledby="controls-heading">
        <div className="section-heading">
          <h2 id="controls-heading">Platform Controls</h2>
          <span>Confirmation required</span>
        </div>
        <label>
          <input type="checkbox" defaultChecked aria-label="Enable new user registrations" />
          New user registrations
        </label>
        <label>
          <input type="checkbox" defaultChecked aria-label="Enable new job postings" />
          New job postings
        </label>
      </section>

      <DataTable
        title="Audit Log"
        headers={["ID", "Admin", "Action", "Target"]}
        rows={auditRows}
        actions={["Inspect"]}
      />
    </main>
  );
}
