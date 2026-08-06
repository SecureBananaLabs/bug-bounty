export default function SettingsPage() {
  const sections = [
    {
      title: "Account",
      status: "Public",
      description: "Profile identity and marketplace visibility",
      items: ["Public profile: visible", "Primary role: client and freelancer", "Portfolio status: ready"],
      action: "Edit profile"
    },
    {
      title: "Notifications",
      status: "On",
      description: "Inbox, proposal, and payment alerts",
      items: ["Proposal updates: instant", "Milestone reminders: daily digest", "Payment receipts: enabled"],
      action: "Manage alerts"
    },
    {
      title: "Security",
      status: "Review",
      description: "Session and sign-in controls",
      items: ["Two-factor auth: recommended", "Active sessions: 2 devices", "Password age: 43 days"],
      action: "Secure account"
    },
    {
      title: "Payouts",
      status: "Weekly",
      description: "Billing defaults and withdrawal preferences",
      items: ["Default currency: USD", "Auto invoice: enabled", "Payout cadence: weekly"],
      action: "Review payouts"
    }
  ];

  return (
    <section>
      <div className="card settings-hero">
        <p className="settings-eyebrow">Account controls</p>
        <h2>Settings</h2>
        <p>
          Review profile visibility, alert preferences, security status, and payout defaults from a single workspace.
        </p>
      </div>

      <div className="settings-summary">
        <article className="card settings-stat">
          <span>Profile health</span>
          <strong>86%</strong>
          <small>3 recommended updates</small>
        </article>
        <article className="card settings-stat">
          <span>Alerts enabled</span>
          <strong>9</strong>
          <small>Across jobs and payments</small>
        </article>
        <article className="card settings-stat">
          <span>Security score</span>
          <strong>Good</strong>
          <small>2FA not yet enabled</small>
        </article>
      </div>

      <div className="settings-grid">
        {sections.map((section) => (
          <article className="card settings-panel" key={section.title}>
            <div className="settings-panel-header">
              <div>
                <h3>{section.title}</h3>
                <span className="settings-chip">{section.status}</span>
              </div>
              <p>{section.description}</p>
            </div>
            <ul>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <button type="button">{section.action}</button>
          </article>
        ))}
      </div>

      <section className="card settings-actions">
        <h3>Recommended next steps</h3>
        <div>
          <button type="button">Enable two-factor auth</button>
          <button type="button">Verify payout method</button>
          <button type="button">Refresh public portfolio</button>
        </div>
      </section>
    </section>
  );
}
