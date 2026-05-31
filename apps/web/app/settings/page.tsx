const sections = [
  {
    title: "Account / profile",
    description: "Keep public profile details accurate before sending proposals or inviting talent.",
    status: "Profile 86% complete",
    action: "Review profile",
    items: [
      ["Display name", "Jordan Lee"],
      ["Primary email", "jordan.lee@example.com"],
      ["Profile visibility", "Public to verified clients"],
      ["Recommended action", "Add a backup contact and refresh portfolio links"]
    ]
  },
  {
    title: "Notifications",
    description: "Control which account events are surfaced quickly across email and in-app alerts.",
    status: "Digest enabled",
    action: "Update alerts",
    items: [
      ["Proposal updates", "Email and in-app"],
      ["Messages", "Immediate alerts"],
      ["Billing alerts", "Email only"],
      ["Recommended action", "Enable mobile alerts for urgent client messages"]
    ]
  },
  {
    title: "Security",
    description: "Review sign-in protections and recovery coverage for this mock account.",
    status: "2FA pending",
    action: "Enable 2FA",
    items: [
      ["Password", "Last changed 42 days ago"],
      ["Two-factor authentication", "Not enabled"],
      ["Active sessions", "2 trusted devices"],
      ["Recommended action", "Enable 2FA and review active sessions"]
    ]
  },
  {
    title: "Billing / payout preferences",
    description: "Check payout readiness and invoice defaults before accepting new milestones.",
    status: "Payout ready",
    action: "Review payout",
    items: [
      ["Default currency", "USD"],
      ["Payout method", "Bank account ending in 1042"],
      ["Invoice delivery", "Monthly summary"],
      ["Recommended action", "Confirm tax profile before the next payout cycle"]
    ]
  }
];

export default function SettingsPage() {
  return (
    <>
      <section className="card">
        <h2>Settings</h2>
        <p>
          Account controls, notification preferences, security checks, and payout readiness
          for a sample FreelanceFlow user.
        </p>
      </section>

      <section className="grid" aria-label="Account settings overview">
        {sections.map((section) => (
          <article className="card" key={section.title}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
              <h3 style={{ marginTop: 0 }}>{section.title}</h3>
              <span
                style={{
                  alignSelf: "flex-start",
                  background: "#223055",
                  border: "1px solid #384a80",
                  borderRadius: 999,
                  color: "#d7e1ff",
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.5rem",
                  whiteSpace: "nowrap"
                }}
              >
                {section.status}
              </span>
            </div>

            <p>{section.description}</p>

            <dl style={{ display: "grid", gap: "0.75rem", margin: 0 }}>
              {section.items.map(([label, value]) => (
                <div key={label}>
                  <dt style={{ color: "#9eaddd", fontSize: "0.8rem" }}>{label}</dt>
                  <dd style={{ margin: 0 }}>{value}</dd>
                </div>
              ))}
            </dl>

            <button
              type="button"
              style={{
                background: "#2f4274",
                border: "1px solid #4a5f98",
                borderRadius: 8,
                color: "#f2f5ff",
                cursor: "default",
                marginTop: "1rem",
                padding: "0.5rem 0.75rem"
              }}
            >
              {section.action}
            </button>
          </article>
        ))}
      </section>
    </>
  );
}
