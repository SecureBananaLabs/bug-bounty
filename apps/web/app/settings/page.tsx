const settingsSections = [
  {
    title: "Account profile",
    status: "Public client profile",
    detail: "Display name, company role, and marketplace profile are visible to matched freelancers.",
    action: "Review profile copy before inviting proposals"
  },
  {
    title: "Notifications",
    status: "Email and in-app alerts enabled",
    detail: "Proposal updates, unread messages, contract milestones, and billing events are grouped by urgency.",
    action: "Tune digest frequency for low-priority updates"
  },
  {
    title: "Security",
    status: "Password active, 2FA not configured",
    detail: "Recent account access is tracked, but stronger sign-in protection has not been enabled yet.",
    action: "Enable two-factor authentication"
  },
  {
    title: "Billing and payouts",
    status: "USD billing, manual payout review",
    detail: "Invoices use USD by default and payout changes require manual review before they become active.",
    action: "Confirm default invoice and payout preferences"
  }
];

export default function SettingsPage() {
  return (
    <section>
      <div className="card">
        <h2>Settings</h2>
        <p>Account controls are organized by profile, notifications, security, and billing readiness.</p>
      </div>

      <div className="grid">
        {settingsSections.map((section) => (
          <article className="card" key={section.title}>
            <h3>{section.title}</h3>
            <p><strong>Status:</strong> {section.status}</p>
            <p>{section.detail}</p>
            <p><strong>Next action:</strong> {section.action}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
