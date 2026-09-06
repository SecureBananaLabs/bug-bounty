const settingsSections = [
  {
    title: "Account profile",
    summary: "Freelancer profile is public and ready for marketplace discovery.",
    status: "Profile visible",
    action: { label: "Review profile", href: "/dashboard/freelancer" },
    items: [
      ["Display name", "Avery Stone"],
      ["Primary role", "Full-stack freelancer"],
      ["Visibility", "Public marketplace listing"]
    ]
  },
  {
    title: "Notifications",
    summary: "Project updates, message alerts, and weekly digests are enabled.",
    status: "Alerts on",
    action: { label: "Open feed", href: "/notifications" },
    items: [
      ["Proposal updates", "Instant email"],
      ["Message alerts", "In-app and email"],
      ["Weekly digest", "Every Monday"]
    ]
  },
  {
    title: "Security",
    summary: "Password is current, but stronger sign-in protection is recommended.",
    status: "Action suggested",
    action: { label: "Review sessions", href: "/settings#security" },
    items: [
      ["Password age", "42 days"],
      ["Two-factor auth", "Not enabled"],
      ["Active sessions", "2 trusted devices"]
    ]
  },
  {
    title: "Billing and payouts",
    summary: "Default payout and invoice preferences are configured for paid work.",
    status: "Billing current",
    action: { label: "Billing center", href: "/billing" },
    items: [
      ["Default payout", "Bank transfer"],
      ["Invoice delivery", "Email PDF"],
      ["Tax profile", "Ready for review"]
    ]
  }
];

const mutedTextStyle = { color: "#c7d2fe", lineHeight: 1.6 } as const;
const chipStyle = {
  border: "1px solid #4ade80",
  borderRadius: 999,
  color: "#bbf7d0",
  display: "inline-flex",
  fontSize: "0.78rem",
  fontWeight: 700,
  padding: "0.25rem 0.55rem"
} as const;
const actionStyle = {
  background: "#f8fafc",
  borderRadius: 8,
  color: "#0b1020",
  display: "inline-flex",
  fontWeight: 700,
  padding: "0.55rem 0.75rem"
} as const;

export default function SettingsPage() {
  return (
    <div>
      <header style={{ marginBottom: "1.25rem" }}>
        <p style={{ color: "#93c5fd", fontWeight: 700, margin: 0 }}>Workspace settings</p>
        <h2 style={{ margin: "0.35rem 0" }}>Account controls</h2>
        <p style={mutedTextStyle}>
          Manage profile visibility, communication preferences, security posture, and payout defaults from one scannable overview.
        </p>
      </header>

      <section className="grid" aria-label="Settings overview">
        {settingsSections.map((section) => (
          <article className="card" key={section.title} id={section.title === "Security" ? "security" : undefined}>
            <div style={{ alignItems: "flex-start", display: "flex", gap: "0.75rem", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0 }}>{section.title}</h3>
              <span style={chipStyle}>{section.status}</span>
            </div>
            <p style={mutedTextStyle}>{section.summary}</p>
            <dl style={{ display: "grid", gap: "0.6rem", margin: "1rem 0" }}>
              {section.items.map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    borderTop: "1px solid #2a3765",
                    display: "flex",
                    gap: "0.75rem",
                    justifyContent: "space-between",
                    paddingTop: "0.6rem"
                  }}
                >
                  <dt style={{ color: "#cbd5e1" }}>{label}</dt>
                  <dd style={{ fontWeight: 700, margin: 0, textAlign: "right" }}>{value}</dd>
                </div>
              ))}
            </dl>
            <a href={section.action.href} style={actionStyle}>
              {section.action.label}
            </a>
          </article>
        ))}
      </section>
    </div>
  );
}
