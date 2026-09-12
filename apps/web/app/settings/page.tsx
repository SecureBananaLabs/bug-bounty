const settingsSections = [
  {
    title: "Account",
    status: "Public profile active",
    description: "Maya Chen is visible to clients searching for Next.js and TypeScript projects.",
    action: "Review profile",
  },
  {
    title: "Notifications",
    status: "Digest enabled",
    description: "Proposal updates, unread messages, and billing alerts are grouped into a daily summary.",
    action: "Tune alerts",
  },
  {
    title: "Security",
    status: "Two-factor pending",
    description: "Password login is active. Add an authenticator app before accepting large contracts.",
    action: "Secure account",
  },
  {
    title: "Payouts",
    status: "Bank transfer ready",
    description: "Default payout method is connected and invoice reminders are enabled.",
    action: "Manage payouts",
  },
];

export default function SettingsPage() {
  return (
    <section className="card">
      <h2>Settings</h2>
      <p>Account preferences, profile visibility, security, and payout defaults.</p>
      <div className="grid">
        {settingsSections.map((section) => (
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
