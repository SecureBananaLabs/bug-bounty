const settingSections = [
  {
    title: "Account and profile",
    description: "Keep public profile details accurate for clients and collaborators.",
    items: [
      ["Display name", "Maya Chen"],
      ["Primary email", "maya@example.com"],
      ["Profile visibility", "Public to verified clients"],
      ["Profile completeness", "85% complete"],
    ],
    actions: ["Edit profile", "Preview public profile"],
  },
  {
    title: "Notifications",
    description: "Control which marketplace updates should interrupt you.",
    items: [
      ["New project matches", "Daily digest"],
      ["Direct messages", "Email and in-app"],
      ["Proposal updates", "Instant"],
      ["Billing alerts", "Instant"],
    ],
    actions: ["Manage alerts", "Send test notification"],
  },
  {
    title: "Security",
    description: "Review account protection and recent access controls.",
    items: [
      ["Two-factor authentication", "Enabled"],
      ["Password", "Updated 32 days ago"],
      ["Active sessions", "2 trusted devices"],
      ["Recovery email", "Configured"],
    ],
    actions: ["Review sessions", "Change password"],
  },
  {
    title: "Billing and payout preferences",
    description: "Confirm payout defaults before invoices or milestones are processed.",
    items: [
      ["Default currency", "USD"],
      ["Payout method", "Bank transfer ending in 0421"],
      ["Invoice email", "billing@example.com"],
      ["Tax profile", "Needs annual review"],
    ],
    actions: ["Update payout method", "Review invoices"],
  },
];

export default function SettingsPage() {
  return (
    <>
      <section className="card">
        <p style={{ color: "#9fb0d8", margin: "0 0 0.35rem" }}>Account settings</p>
        <h2 style={{ margin: "0 0 0.5rem" }}>Actionable account controls</h2>
        <p style={{ margin: 0, color: "#c6d2f2", lineHeight: 1.6 }}>
          Review profile, notification, security, and payout preferences from one
          settings overview. These controls use mock data only and do not change
          backend behavior.
        </p>
      </section>

      <section className="grid" aria-label="Settings controls">
        {settingSections.map((section) => (
          <article className="card" key={section.title}>
            <h3 style={{ margin: "0 0 0.5rem" }}>{section.title}</h3>
            <p style={{ color: "#aebce2", lineHeight: 1.5, margin: "0 0 1rem" }}>
              {section.description}
            </p>

            <dl style={{ display: "grid", gap: "0.65rem", margin: "0 0 1rem" }}>
              {section.items.map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    borderTop: "1px solid #2a3765",
                    display: "grid",
                    gap: "0.25rem",
                    paddingTop: "0.65rem",
                  }}
                >
                  <dt style={{ color: "#9fb0d8", fontSize: "0.85rem" }}>{label}</dt>
                  <dd style={{ margin: 0, fontWeight: 700 }}>{value}</dd>
                </div>
              ))}
            </dl>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {section.actions.map((action) => (
                <button
                  key={action}
                  type="button"
                  style={{
                    background: "#26345f",
                    border: "1px solid #3e5190",
                    borderRadius: 8,
                    color: "#f2f5ff",
                    cursor: "pointer",
                    padding: "0.55rem 0.75rem",
                  }}
                >
                  {action}
                </button>
              ))}
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
