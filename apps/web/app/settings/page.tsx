import type { CSSProperties, ReactNode } from "react";

type StatusTone = "good" | "warning" | "neutral" | "danger";

const toneStyles: Record<StatusTone, { background: string; borderColor: string; color: string }> = {
  good: { background: "#103524", borderColor: "#2f8a5f", color: "#9af2c9" },
  warning: { background: "#3a2b10", borderColor: "#a97824", color: "#ffd894" },
  neutral: { background: "#223055", borderColor: "#40558f", color: "#d7e1ff" },
  danger: { background: "#3b1724", borderColor: "#9d3d5a", color: "#ffb3c8" }
};

const overview = [
  { label: "Profile", value: "Public", tone: "good" as const },
  { label: "Alerts", value: "Weekly digest", tone: "neutral" as const },
  { label: "Security", value: "2FA pending", tone: "warning" as const },
  { label: "Payouts", value: "Verified", tone: "good" as const }
];

const sections = [
  {
    title: "Account / profile",
    description: "Public profile details visible to clients and matched freelancers.",
    status: "Ready for clients",
    tone: "good" as const,
    primaryAction: "Edit profile",
    secondaryAction: "Preview page",
    fields: [
      ["Display name", "Jordan Lee"],
      ["Primary email", "jordan.lee@example.com"],
      ["Account type", "Freelancer"],
      ["Visibility", "Public to verified clients"]
    ],
    controls: [
      ["Portfolio links", "3 connected"],
      ["Profile completion", "86% complete"]
    ]
  },
  {
    title: "Notifications",
    description: "Delivery preferences for proposals, messages, milestones, and invoices.",
    status: "Digest enabled",
    tone: "neutral" as const,
    primaryAction: "Update alerts",
    secondaryAction: "Send test",
    fields: [
      ["Proposal updates", "Email and in-app"],
      ["Direct messages", "Immediate in-app alerts"],
      ["Milestone activity", "Daily digest"],
      ["Billing alerts", "Email only"]
    ],
    controls: [
      ["Marketing email", "Off"],
      ["Quiet hours", "10 PM - 7 AM"]
    ]
  },
  {
    title: "Security",
    description: "Sign-in safeguards, recovery coverage, and active device posture.",
    status: "Action needed",
    tone: "warning" as const,
    primaryAction: "Enable 2FA",
    secondaryAction: "Review sessions",
    fields: [
      ["Password", "Changed 42 days ago"],
      ["Two-factor authentication", "Not enabled"],
      ["Recovery email", "Configured"],
      ["Active sessions", "2 trusted devices"]
    ],
    controls: [
      ["Login notifications", "On"],
      ["API tokens", "None active"]
    ]
  },
  {
    title: "Billing / payout preferences",
    description: "Invoice defaults, payout readiness, and tax profile state.",
    status: "Payout ready",
    tone: "good" as const,
    primaryAction: "Manage payout",
    secondaryAction: "View invoices",
    fields: [
      ["Default currency", "USD"],
      ["Payout method", "Bank account ending in 1042"],
      ["Invoice cadence", "Monthly summary"],
      ["Tax profile", "Verified"]
    ],
    controls: [
      ["Auto-withdraw", "Enabled above $100"],
      ["Next payout", "Jun 07, 2026"]
    ]
  }
];

function StatusChip({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  const style = toneStyles[tone];

  return (
    <span
      style={{
        alignSelf: "flex-start",
        background: style.background,
        border: `1px solid ${style.borderColor}`,
        borderRadius: 999,
        color: style.color,
        fontSize: "0.75rem",
        fontWeight: 700,
        padding: "0.25rem 0.55rem",
        whiteSpace: "nowrap"
      }}
    >
      {children}
    </span>
  );
}

const buttonStyle = {
  background: "#2f4274",
  border: "1px solid #4a5f98",
  borderRadius: 8,
  color: "#f2f5ff",
  cursor: "default",
  font: "inherit",
  padding: "0.55rem 0.75rem"
} satisfies CSSProperties;

const secondaryButtonStyle = {
  ...buttonStyle,
  background: "transparent",
  color: "#d7e1ff"
};

export default function SettingsPage() {
  return (
    <>
      <section className="card">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ marginTop: 0 }}>Settings</h2>
            <p style={{ color: "#bec9f4", maxWidth: 620 }}>
              Account controls, notification preferences, security posture, and payout defaults for
              the current mock user.
            </p>
          </div>
          <StatusChip tone="warning">2 actions pending</StatusChip>
        </div>

        <div className="grid" style={{ marginTop: "1rem" }} aria-label="Settings status summary">
          {overview.map((item) => (
            <div
              key={item.label}
              style={{
                background: "#10172d",
                border: "1px solid #26345f",
                borderRadius: 10,
                padding: "0.8rem"
              }}
            >
              <div style={{ color: "#9eaddd", fontSize: "0.8rem" }}>{item.label}</div>
              <div style={{ alignItems: "center", display: "flex", gap: "0.5rem", marginTop: "0.4rem" }}>
                <strong>{item.value}</strong>
                <StatusChip tone={item.tone}>Current</StatusChip>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid" aria-label="Account settings overview">
        {sections.map((section) => (
          <article className="card" key={section.title} style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "space-between" }}>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ margin: 0 }}>{section.title}</h3>
                <p style={{ color: "#bec9f4" }}>{section.description}</p>
              </div>
              <StatusChip tone={section.tone}>{section.status}</StatusChip>
            </div>

            <dl style={{ display: "grid", gap: "0.75rem", margin: "0 0 1rem" }}>
              {section.fields.map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    borderBottom: "1px solid #26345f",
                    display: "grid",
                    gap: "0.25rem",
                    paddingBottom: "0.65rem"
                  }}
                >
                  <dt style={{ color: "#9eaddd", fontSize: "0.8rem" }}>{label}</dt>
                  <dd style={{ margin: 0 }}>{value}</dd>
                </div>
              ))}
            </dl>

            <div style={{ display: "grid", gap: "0.6rem", marginTop: "auto" }}>
              {section.controls.map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    alignItems: "center",
                    background: "#10172d",
                    border: "1px solid #26345f",
                    borderRadius: 10,
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    gap: "1rem",
                    padding: "0.65rem 0.75rem"
                  }}
                >
                  <span>{label}</span>
                  <span style={{ color: "#9eaddd", textAlign: "right" }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem", marginTop: "1rem" }}>
              <button type="button" style={buttonStyle}>
                {section.primaryAction}
              </button>
              <button type="button" style={secondaryButtonStyle}>
                {section.secondaryAction}
              </button>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
