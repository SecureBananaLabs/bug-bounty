export default function SettingsPage() {
  const settingsSections = [
    {
      title: "Account profile",
      status: "Visible",
      description: "Client profile is published with verified email and company details.",
      actions: ["Edit profile", "Preview public profile"],
      details: ["Display name: Priya Sharma", "Company: Northstar Retail", "Role: Client"]
    },
    {
      title: "Notifications",
      status: "Digest on",
      description: "Proposal, message, and invoice alerts are grouped into a daily digest.",
      actions: ["Change cadence", "Test email alert"],
      details: ["Proposal updates: instant", "Messages: instant", "Billing: daily digest"]
    },
    {
      title: "Security",
      status: "Review needed",
      description: "Password was updated recently, but two-factor authentication is not enabled.",
      actions: ["Enable 2FA", "Review sessions"],
      details: ["Password: updated 12 days ago", "2FA: not enabled", "Active sessions: 2"]
    },
    {
      title: "Billing and payouts",
      status: "Ready",
      description: "Default payment method and invoice contact are configured for new projects.",
      actions: ["Update billing", "Download tax info"],
      details: ["Default currency: USD", "Invoice email: finance@example.com", "Payout method: bank transfer"]
    }
  ];

  return (
    <div className="settings-page">
      <section className="settings-header">
        <div>
          <p className="eyebrow">Account settings</p>
          <h2>Manage marketplace account controls</h2>
          <p>
            Review the account state users need before hiring, bidding, receiving alerts, and handling payments.
          </p>
        </div>
        <div className="settings-summary" aria-label="Settings completion summary">
          <span>3 of 4 ready</span>
          <strong>Security review pending</strong>
        </div>
      </section>

      <section className="settings-grid" aria-label="Settings sections">
        {settingsSections.map((section) => (
          <article className="settings-panel" key={section.title}>
            <div className="settings-panel-header">
              <h3>{section.title}</h3>
              <span className={section.status === "Review needed" ? "chip warning" : "chip"}>
                {section.status}
              </span>
            </div>
            <p>{section.description}</p>
            <ul className="settings-list">
              {section.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
            <div className="settings-actions">
              {section.actions.map((action) => (
                <button type="button" key={action}>
                  {action}
                </button>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
