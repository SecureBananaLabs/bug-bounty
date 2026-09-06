export default function SettingsPage() {
  const settingsGroups = [
    {
      id: "account-profile",
      title: "Account profile",
      description: "Public marketplace identity and profile discovery.",
      items: [
        { label: "Profile visibility", value: "Public", status: "Active" },
        { label: "Primary role", value: "Client and freelancer", status: "Synced" },
        { label: "Portfolio review", value: "Updated 2 days ago", status: "Current" }
      ],
      action: "Review profile"
    },
    {
      id: "notifications",
      title: "Notifications",
      description: "Proposal, message, and billing delivery preferences.",
      items: [
        { label: "Proposal updates", value: "Email and in-app", status: "On" },
        { label: "Unread message digest", value: "Daily summary", status: "On" },
        { label: "Billing alerts", value: "Instant", status: "On" }
      ],
      action: "Tune alerts"
    },
    {
      id: "security",
      title: "Security",
      description: "Account protection and session health.",
      items: [
        { label: "Two-step verification", value: "Authenticator app", status: "Enabled" },
        { label: "Last password change", value: "18 days ago", status: "Healthy" },
        { label: "Active sessions", value: "2 trusted devices", status: "Review" }
      ],
      action: "Manage access"
    },
    {
      id: "billing-defaults",
      title: "Billing defaults",
      description: "Invoice, payout, and tax preference summary.",
      items: [
        { label: "Default invoice currency", value: "USD", status: "Set" },
        { label: "Payout method", value: "Bank account ending 1842", status: "Verified" },
        { label: "Tax profile", value: "Individual contractor", status: "Complete" }
      ],
      action: "Open billing"
    }
  ];

  return (
    <section className="settings-page">
      <div className="settings-header">
        <div>
          <p className="eyebrow">Account center</p>
          <h2>Settings</h2>
        </div>
        <span className="status-pill">4 areas configured</span>
      </div>

      <div className="settings-summary" aria-label="Account settings summary">
        <div>
          <strong>Public profile</strong>
          <span>Visible to marketplace clients</span>
        </div>
        <div>
          <strong>Security score</strong>
          <span>Strong account posture</span>
        </div>
        <div>
          <strong>Billing status</strong>
          <span>Payouts ready</span>
        </div>
      </div>

      <div className="settings-grid">
        {settingsGroups.map((group) => (
          <section className="settings-panel" key={group.id} aria-labelledby={`${group.id}-heading`}>
            <div className="settings-panel-header">
              <div>
                <h3 id={`${group.id}-heading`}>{group.title}</h3>
                <p>{group.description}</p>
              </div>
              <button type="button">{group.action}</button>
            </div>

            <dl className="settings-list">
              {group.items.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>
                    <span>{item.value}</span>
                    <span className="status-pill subtle">{item.status}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </section>
  );
}
