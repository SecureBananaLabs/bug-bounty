const settingsSections = [
  {
    title: "Account & Profile",
    eyebrow: "Public marketplace identity",
    description: "Keep the profile clients see accurate, complete, and easy to audit before new proposals go out.",
    status: "Profile live",
    tone: "success",
    metrics: [
      ["Display name", "Alex Rivera"],
      ["Visibility", "Public to clients"],
      ["Profile strength", "4 of 5 steps complete"]
    ],
    actions: ["Review profile", "Edit visibility"]
  },
  {
    title: "Notifications",
    eyebrow: "Proposal and message routing",
    description: "Summarize which alerts are active so important marketplace events do not get missed.",
    status: "Alerts active",
    tone: "info",
    metrics: [
      ["Proposal updates", "Email + in-app"],
      ["Unread messages", "Daily digest"],
      ["Billing reminders", "Immediate"]
    ],
    actions: ["Manage channels", "Send test alert"]
  },
  {
    title: "Security",
    eyebrow: "Account protection",
    description: "Show the current security posture and surface the next safety tasks without changing backend state.",
    status: "Needs review",
    tone: "warning",
    metrics: [
      ["Two-factor auth", "Not enabled"],
      ["Password age", "18 days"],
      ["Active sessions", "2 devices"]
    ],
    actions: ["Enable 2FA", "Review sessions"]
  },
  {
    title: "Billing & Payouts",
    eyebrow: "Money movement defaults",
    description: "Make payout readiness and client billing preferences scannable with mock account data only.",
    status: "Configured",
    tone: "accent",
    metrics: [
      ["Default billing", "Milestone payments"],
      ["Payout method", "Primary account connected"],
      ["Tax profile", "Pending confirmation"]
    ],
    actions: ["Review payouts", "Update billing"]
  }
];

const toneStyles = {
  success: { border: "#3ddc97", background: "rgba(61, 220, 151, 0.12)", color: "#8ef0bf" },
  info: { border: "#7dd3fc", background: "rgba(125, 211, 252, 0.12)", color: "#b9e9ff" },
  warning: { border: "#fbbf24", background: "rgba(251, 191, 36, 0.12)", color: "#ffe08a" },
  accent: { border: "#c084fc", background: "rgba(192, 132, 252, 0.12)", color: "#dec2ff" }
};

export default function SettingsPage() {
  return (
    <section className="card" style={{ display: "grid", gap: "1.25rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          alignItems: "flex-start",
          flexWrap: "wrap"
        }}
      >
        <div style={{ maxWidth: 680 }}>
          <p style={{ margin: "0 0 0.4rem", color: "#9fb0d8", fontSize: "0.9rem" }}>
            Workspace settings
          </p>
          <h2 style={{ margin: "0 0 0.6rem", fontSize: "2rem" }}>Settings</h2>
          <p style={{ margin: 0, color: "#c8d2f0", lineHeight: 1.6 }}>
            Review account preferences, profile visibility, notification routing, security posture,
            and billing defaults from one static overview.
          </p>
        </div>
        <span
          style={{
            border: "1px solid #3b4d82",
            borderRadius: 999,
            color: "#c8d2f0",
            padding: "0.35rem 0.75rem",
            background: "#1b2444",
            whiteSpace: "nowrap"
          }}
        >
          Mock data only
        </span>
      </div>

      <div className="grid">
        {settingsSections.map((section) => {
          const tone = toneStyles[section.tone as keyof typeof toneStyles];

          return (
            <article
              key={section.title}
              className="card"
              style={{
                margin: 0,
                display: "grid",
                gap: "1rem",
                minHeight: "100%"
              }}
            >
              <div style={{ display: "grid", gap: "0.6rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
                  <p style={{ margin: 0, color: "#9fb0d8", fontSize: "0.82rem" }}>
                    {section.eyebrow}
                  </p>
                  <span
                    style={{
                      alignSelf: "flex-start",
                      border: `1px solid ${tone.border}`,
                      borderRadius: 999,
                      background: tone.background,
                      color: tone.color,
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      padding: "0.25rem 0.6rem",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {section.status}
                  </span>
                </div>
                <h3 style={{ margin: 0 }}>{section.title}</h3>
                <p style={{ margin: 0, color: "#c8d2f0", lineHeight: 1.55 }}>
                  {section.description}
                </p>
              </div>

              <dl style={{ display: "grid", gap: "0.6rem", margin: 0 }}>
                {section.metrics.map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                      borderTop: "1px solid #2a3765",
                      paddingTop: "0.6rem"
                    }}
                  >
                    <dt style={{ color: "#9fb0d8" }}>{label}</dt>
                    <dd style={{ margin: 0, textAlign: "right", color: "#f2f5ff" }}>{value}</dd>
                  </div>
                ))}
              </dl>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.55rem", marginTop: "auto" }}>
                {section.actions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    aria-label={`${action} for ${section.title}`}
                    style={{
                      background: "#24325c",
                      border: "1px solid #3b4d82",
                      borderRadius: 8,
                      color: "#f2f5ff",
                      cursor: "pointer",
                      fontWeight: 700,
                      padding: "0.55rem 0.75rem"
                    }}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
