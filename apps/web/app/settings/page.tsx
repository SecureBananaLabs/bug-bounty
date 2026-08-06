const sections = [
  {
    title: "Account & profile",
    status: "Public profile live",
    description: "Your marketplace profile is visible to clients and ready for proposals.",
    action: "Review profile",
  },
  {
    title: "Notifications",
    status: "Email alerts enabled",
    description: "Project invites, proposal updates, and payout notices are sent to email.",
    action: "Manage alerts",
  },
  {
    title: "Security",
    status: "Password updated recently",
    description: "Two-factor authentication is available for stronger account protection.",
    action: "Set up 2FA",
  },
  {
    title: "Billing & payouts",
    status: "Default payout pending",
    description: "Add a payout method before accepting paid marketplace work.",
    action: "Add payout method",
  },
];

export default function SettingsPage() {
  return (
    <section className="card">
      <h2>Settings</h2>
      <p>Review account preferences, profile visibility, security, and payout readiness.</p>

      <div className="grid">
        {sections.map((section) => (
          <article className="card" key={section.title}>
            <h3>{section.title}</h3>
            <strong>{section.status}</strong>
            <p>{section.description}</p>
            <button type="button">{section.action}</button>
          </article>
        ))}
      </div>
    </section>
  );
}
