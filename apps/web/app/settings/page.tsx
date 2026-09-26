import Link from "next/link";

const settingsSections = [
  {
    title: "Account & profile",
    status: "Visible",
    tone: "ready",
    description: "Public profile is searchable and ready for client review.",
    details: [
      ["Display name", "Avery Morgan"],
      ["Profile visibility", "Public"],
      ["Primary role", "Full-stack freelancer"]
    ],
    action: "Review profile",
    href: "/dashboard/freelancer"
  },
  {
    title: "Notifications",
    status: "Daily digest",
    tone: "neutral",
    description: "Project, message, and billing alerts are grouped into one daily email.",
    details: [
      ["Unread messages", "3"],
      ["Proposal alerts", "Enabled"],
      ["Billing alerts", "Immediate"]
    ],
    action: "Open alerts",
    href: "/notifications"
  },
  {
    title: "Security",
    status: "Action needed",
    tone: "warning",
    description: "Password is current, but two-step verification is not enabled yet.",
    details: [
      ["Password updated", "12 days ago"],
      ["Two-step verification", "Not enabled"],
      ["Trusted devices", "2 active"]
    ],
    action: "Enable 2FA",
    href: null
  },
  {
    title: "Billing & payouts",
    status: "Ready",
    tone: "ready",
    description: "Default payout method and invoice preferences are configured.",
    details: [
      ["Default payout", "Bank transfer"],
      ["Invoice currency", "GBP"],
      ["Tax profile", "Verified"]
    ],
    action: "Manage billing",
    href: "/billing"
  }
];

export default function SettingsPage() {
  return (
    <section className="settings-page">
      <div className="settings-header">
        <div>
          <h2>Settings</h2>
          <p>Account preferences, profile visibility, security, and payout defaults.</p>
        </div>
        <span className="status-chip ready">Account active</span>
      </div>

      <div className="settings-grid">
        {settingsSections.map((section) => (
          <article className="card setting-card" key={section.title}>
            <div className="setting-card-header">
              <h3>{section.title}</h3>
              <span className={`status-chip ${section.tone}`}>{section.status}</span>
            </div>
            <p>{section.description}</p>
            <dl className="setting-detail-list">
              {section.details.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            {section.href ? (
              <Link className="setting-action" href={section.href}>
                {section.action}
              </Link>
            ) : (
              <button className="setting-action" type="button">
                {section.action}
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
