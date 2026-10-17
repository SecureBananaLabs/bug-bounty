export default function AdminPanelPage() {
  const metrics = [
    ["Total users", "4"],
    ["Active jobs", "6"],
    ["Open disputes", "2"],
    ["Flagged listings", "2"],
    ["Revenue", "$128,900"]
  ];

  const users = [
    ["Maya Chen", "client", "active", "3 jobs", "91 trust"],
    ["Arun Patel", "freelancer", "active", "2 jobs", "84 trust"],
    ["Lena Ortiz", "freelancer", "suspended", "2 disputes", "48 trust"],
    ["Northstar Labs", "client", "review", "1 job", "63 trust"]
  ];

  const moderationQueue = [
    ["Wallet recovery automation", "high", "Escrow bypass language", "pending"],
    ["Data enrichment script", "medium", "Unclear data provenance", "escalated"]
  ];

  const disputes = [
    ["DSP-7001", "$2,400", "open", "Delivery disputed after milestone approval"],
    ["DSP-7002", "$950", "under review", "Escrow release blocked after policy review"]
  ];

  return (
    <section className="admin-shell">
      <div className="admin-header">
        <div>
          <p className="eyebrow">Admin operations</p>
          <h2>Control room</h2>
        </div>
        <div className="admin-badge">Server guarded</div>
      </div>

      <div className="admin-grid metrics-grid">
        {metrics.map(([label, value]) => (
          <article className="card metric-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <div className="admin-grid">
        <article className="card admin-panel">
          <h3>User management</h3>
          <div className="toolbar">
            <span>Search</span>
            <span>Role</span>
            <span>Status</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Signal</th>
              </tr>
            </thead>
            <tbody>
              {users.map(([name, role, status, jobs, trust]) => (
                <tr key={name}>
                  <td>
                    <strong>{name}</strong>
                    <small>{trust}</small>
                  </td>
                  <td>{role}</td>
                  <td><span className={`status ${status.replace(" ", "-")}`}>{status}</span></td>
                  <td>{jobs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="card admin-panel">
          <h3>Moderation queue</h3>
          <div className="queue-list">
            {moderationQueue.map(([title, severity, reason, status]) => (
              <div className="queue-item" key={title}>
                <div>
                  <strong>{title}</strong>
                  <small>{reason}</small>
                </div>
                <span className={`status ${severity}`}>{severity}</span>
                <span>{status}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="card admin-panel">
          <h3>Dispute resolution</h3>
          <div className="queue-list">
            {disputes.map(([id, amount, status, summary]) => (
              <div className="queue-item" key={id}>
                <div>
                  <strong>{id} · {amount}</strong>
                  <small>{summary}</small>
                </div>
                <span className="status review">{status}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="card admin-panel">
          <h3>Platform controls</h3>
          <div className="control-list">
            <label><input type="checkbox" /> Maintenance mode</label>
            <label><input type="checkbox" defaultChecked /> Allow new jobs</label>
            <label><input type="checkbox" defaultChecked /> Auto moderation</label>
            <label>Escalation SLA <input type="number" defaultValue={72} /></label>
          </div>
        </article>
      </div>

      <article className="card admin-panel">
        <h3>Audit log</h3>
        <ol className="audit-list">
          <li><strong>admin_panel_seeded</strong><span>system · platform</span></li>
          <li><strong>user_status_updated</strong><span>admin · usr_free_003</span></li>
          <li><strong>listing_moderated</strong><span>admin · flag_1001</span></li>
        </ol>
      </article>
    </section>
  );
}
