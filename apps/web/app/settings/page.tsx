export default function SettingsPage() {
  const sections = [
    {
      title: "Account and profile",
      status: "Public profile",
      rows: [
        ["Display name", "Maya Chen"],
        ["Primary role", "Client"],
        ["Profile visibility", "Visible to verified freelancers"]
      ],
      actions: ["Edit profile", "Preview"]
    },
    {
      title: "Notifications",
      status: "Digest enabled",
      rows: [
        ["Proposal updates", "Email and in-app"],
        ["Message alerts", "In-app only"],
        ["Billing notices", "Email required"]
      ],
      actions: ["Manage alerts", "Send test"]
    },
    {
      title: "Security",
      status: "Needs review",
      rows: [
        ["Two-factor auth", "Not enabled"],
        ["Password age", "Updated 42 days ago"],
        ["Active sessions", "2 trusted devices"]
      ],
      actions: ["Enable 2FA", "Review sessions"]
    },
    {
      title: "Billing and payouts",
      status: "Ready",
      rows: [
        ["Default payment", "USDC escrow"],
        ["Payout cadence", "Manual release"],
        ["Tax profile", "Not required for mock account"]
      ],
      actions: ["Update method", "View invoices"]
    }
  ];

  return (
    <section>
      <div className="card settings-hero">
        <div>
          <h2>Settings</h2>
          <p>Review account defaults, profile visibility, security posture, and payout preferences.</p>
        </div>
        <span className="status-chip status-chip--ready">Account active</span>
      </div>

      <div className="settings-grid">
        {sections.map((section) => (
          <article className="card settings-panel" key={section.title}>
            <div className="settings-panel__header">
              <h3>{section.title}</h3>
              <span
                className={
                  section.status === "Needs review"
                    ? "status-chip status-chip--warning"
                    : "status-chip status-chip--ready"
                }
              >
                {section.status}
              </span>
            </div>

            <dl className="settings-list">
              {section.rows.map(([label, value]) => (
                <div key={label} className="settings-list__row">
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>

            <div className="settings-actions">
              {section.actions.map((action, index) => (
                <button className={index === 0 ? "button" : "button button--secondary"} key={action} type="button">
                  {action}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
