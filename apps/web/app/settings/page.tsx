const settingsSections = [
  {
    title: "Account / Profile",
    status: "Public profile",
    detail: "Maya Chen is visible to clients with portfolio links and verified skills enabled.",
    action: "Edit profile"
  },
  {
    title: "Notifications",
    status: "Digest on",
    detail: "Email alerts are enabled for proposals, milestones, direct messages, and payout updates.",
    action: "Manage alerts"
  },
  {
    title: "Security",
    status: "2FA ready",
    detail: "Password login is active and two-factor authentication is ready to be configured.",
    action: "Review security"
  },
  {
    title: "Billing / Payout",
    status: "Default saved",
    detail: "Client billing uses the saved card, while freelancer payouts are set to weekly bank transfer.",
    action: "Update billing"
  }
];

export default function SettingsPage() {
  return (
    <section>
      <h2>Settings</h2>
      <p>Account preferences, profile visibility, notification, security, and payout defaults.</p>
      <div className="grid">
        {settingsSections.map((section) => (
          <article className="card" key={section.title}>
            <p className="status-chip">
              {section.status}
            </p>
            <h3>{section.title}</h3>
            <p>{section.detail}</p>
            <button className="action-button" type="button">{section.action}</button>
          </article>
        ))}
      </div>
    </section>
  );
}
