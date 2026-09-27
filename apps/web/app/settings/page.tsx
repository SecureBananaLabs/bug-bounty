const settingsSections = [
  {
    title: "Account and profile",
    description: "Identity, profile visibility, and portfolio readiness for client discovery.",
    status: "Public profile on",
    items: [
      { label: "Display name", value: "Avery Stone" },
      { label: "Visibility", value: "Listed in freelancer search" },
      { label: "Portfolio", value: "4 featured case studies" }
    ],
    actions: ["Review profile", "Update portfolio", "Preview public page"]
  },
  {
    title: "Notifications",
    description: "Stay on top of proposals, replies, contract milestones, and billing updates.",
    status: "Inbox under control",
    items: [
      { label: "Proposal alerts", value: "Instant email + in-app" },
      { label: "Client messages", value: "Desktop and mobile" },
      { label: "Weekly digest", value: "Every Monday at 9:00 AM" }
    ],
    actions: ["Tune alerts", "Pause digests", "Open notifications"]
  },
  {
    title: "Security",
    description: "Protect access, review recovery posture, and keep sessions tidy.",
    status: "Needs one action",
    items: [
      { label: "Password", value: "Updated 42 days ago" },
      { label: "Two-factor auth", value: "Not enabled" },
      { label: "Active sessions", value: "2 trusted devices" }
    ],
    actions: ["Enable 2FA", "Rotate password", "Sign out other sessions"]
  },
  {
    title: "Billing and payouts",
    description: "Track payout preferences, invoice defaults, and tax details before the next milestone clears.",
    status: "Payout ready",
    items: [
      { label: "Primary payout", value: "ACH ending in 1842" },
      { label: "Default invoice terms", value: "Net 7 days" },
      { label: "Tax profile", value: "W-9 verified" }
    ],
    actions: ["Update payout method", "Review invoices", "Download tax docs"]
  }
];

const activityChecks = [
  "Profile score: 92% complete",
  "Last security review: May 18",
  "Next payout window: Tomorrow",
  "Unread billing alerts: 1"
];

export default function SettingsPage() {
  return (
    <section className="settings-shell">
      <div className="card settings-hero">
        <div>
          <p className="eyebrow">Settings</p>
          <h2>Account controls that are actually useful</h2>
          <p className="settings-lead">
            Review profile visibility, notification coverage, security posture, and payout readiness
            from one place.
          </p>
        </div>
        <div className="settings-summary" aria-label="Settings health summary">
          {activityChecks.map((item) => (
            <span key={item} className="status-chip status-chip-muted">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="grid settings-grid">
        {settingsSections.map((section) => (
          <article key={section.title} className="card settings-card">
            <div className="settings-card-header">
              <div>
                <h3>{section.title}</h3>
                <p>{section.description}</p>
              </div>
              <span
                className={`status-chip ${
                  section.status === "Needs one action" ? "status-chip-warning" : "status-chip-success"
                }`}
              >
                {section.status}
              </span>
            </div>

            <dl className="settings-list">
              {section.items.map((item) => (
                <div key={item.label} className="settings-list-row">
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>

            <div className="settings-actions" aria-label={`${section.title} actions`}>
              {section.actions.map((action) => (
                <button key={action} type="button" className="settings-action-button">
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
