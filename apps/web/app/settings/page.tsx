const settingsSections = [
  {
    title: "Account and profile",
    description: "Control how clients see the workspace and what profile signals are complete.",
    status: "Visible",
    statusColor: "#3ddc97",
    items: [
      ["Public profile", "Enabled"],
      ["Availability", "Open to new contracts"],
      ["Profile strength", "4 of 5 steps complete"]
    ],
    actions: ["Review profile", "Edit visibility"]
  },
  {
    title: "Notifications",
    description: "Keep proposal, message, and milestone updates easy to audit.",
    status: "Active",
    statusColor: "#7dd3fc",
    items: [
      ["Proposal alerts", "Email and in-app"],
      ["Unread messages", "Daily digest enabled"],
      ["Billing alerts", "Immediate"]
    ],
    actions: ["Manage channels", "Test alert"]
  },
  {
    title: "Security",
    description: "Show the current access posture and the next account-safety steps.",
    status: "Needs review",
    statusColor: "#fbbf24",
    items: [
      ["Password", "Updated 18 days ago"],
      ["Two-factor authentication", "Not enabled"],
      ["Active sessions", "2 devices"]
    ],
    actions: ["Enable 2FA", "Review sessions"]
  },
  {
    title: "Billing and payouts",
    description: "Surface payout readiness and client billing preferences without changing APIs.",
    status: "Configured",
    statusColor: "#c084fc",
    items: [
      ["Default billing", "Milestone payments"],
      ["Payout method", "Primary account connected"],
      ["Tax profile", "Pending confirmation"]
    ],
    actions: ["Review payouts", "Update billing"]
  }
];

export default function SettingsPage() {
  return (
    <section className="card">
      <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1rem" }}>
        <p style={{ margin: 0, color: "#9fb0d8", fontSize: "0.9rem" }}>Workspace settings</p>
        <h2 style={{ margin: 0 }}>Settings</h2>
        <p style={{ margin: 0, color: "#c8d2f0" }}>
          Account preferences, profile visibility, notification routing, security posture,
          and billing defaults.
        </p>
      </div>

      <div className="grid">
        {settingsSections.map((section) => (
          <article
            key={section.title}
            className="card"
            style={{ margin: 0, display: "grid", gap: "0.85rem" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
              <div>
                <h3 style={{ margin: "0 0 0.35rem" }}>{section.title}</h3>
                <p style={{ margin: 0, color: "#c8d2f0", lineHeight: 1.5 }}>
                  {section.description}
                </p>
              </div>
              <span
                style={{
                  alignSelf: "flex-start",
                  border: `1px solid ${section.statusColor}`,
                  borderRadius: 999,
                  color: section.statusColor,
                  fontSize: "0.78rem",
                  padding: "0.25rem 0.55rem",
                  whiteSpace: "nowrap"
                }}
              >
                {section.status}
              </span>
            </div>

            <dl style={{ display: "grid", gap: "0.55rem", margin: 0 }}>
              {section.items.map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    borderTop: "1px solid #2a3765",
                    paddingTop: "0.55rem"
                  }}
                >
                  <dt style={{ color: "#9fb0d8" }}>{label}</dt>
                  <dd style={{ margin: 0, textAlign: "right" }}>{value}</dd>
                </div>
              ))}
            </dl>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {section.actions.map((action) => (
                <button
                  key={action}
                  type="button"
                  style={{
                    background: "#24325c",
                    border: "1px solid #3b4d82",
                    borderRadius: 8,
                    color: "#f2f5ff",
                    cursor: "pointer",
                    padding: "0.5rem 0.7rem"
                  }}
                >
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
