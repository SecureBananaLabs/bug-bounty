export default function SettingsPage() {
  const sections = [
    {
      title: "Account",
      description: "Core identity and contact details used across proposals and invoices.",
      rows: [
        ["Display name", "Jordan Rivera"],
        ["Primary email", "jordan@example.com"],
        ["Workspace role", "Client and freelancer"],
      ],
    },
    {
      title: "Profile visibility",
      description: "Controls for marketplace discovery and public profile details.",
      rows: [
        ["Marketplace profile", "Public"],
        ["Availability", "Open to new work"],
        ["Portfolio previews", "Visible to verified clients"],
      ],
    },
    {
      title: "Notifications",
      description: "Preferences for messages, proposal updates, and billing alerts.",
      rows: [
        ["Project messages", "Email and in-app"],
        ["Proposal activity", "Daily digest"],
        ["Billing alerts", "Immediate"],
      ],
    },
  ];

  const security = [
    { label: "Two-factor authentication", status: "Enabled", action: "Review" },
    { label: "Password updated", status: "42 days ago", action: "Change" },
    { label: "Active sessions", status: "3 devices", action: "Manage" },
  ];

  return (
    <>
      <section className="card">
        <p style={{ margin: "0 0 0.35rem", color: "#93a4d7", fontWeight: 700 }}>
          Settings
        </p>
        <h2 style={{ margin: "0 0 0.5rem" }}>Account control center</h2>
        <p style={{ margin: 0, color: "#c8d2f2", maxWidth: "700px" }}>
          Review account identity, marketplace visibility, notification preferences, and
          security posture from one organized page.
        </p>
      </section>

      <section className="grid" aria-label="Settings sections">
        {sections.map((section) => (
          <article className="card" key={section.title}>
            <h3 style={{ margin: "0 0 0.35rem" }}>{section.title}</h3>
            <p style={{ margin: "0 0 0.9rem", color: "#aebce7" }}>
              {section.description}
            </p>
            <div style={{ display: "grid", gap: "0.65rem" }}>
              {section.rows.map(([label, value], index) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem",
                    alignItems: "center",
                    borderBottom: index === section.rows.length - 1 ? "0" : "1px solid #2a3765",
                    paddingBottom: index === section.rows.length - 1 ? "0" : "0.65rem",
                  }}
                >
                  <span style={{ color: "#d7def8" }}>{label}</span>
                  <strong style={{ textAlign: "right" }}>{value}</strong>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: "1rem",
          }}
        >
          <div>
            <h3 style={{ margin: "0 0 0.25rem" }}>Security controls</h3>
            <p style={{ margin: 0, color: "#aebce7" }}>
              Current account safeguards and session review actions.
            </p>
          </div>
          <span
            style={{
              border: "1px solid #465894",
              borderRadius: "999px",
              padding: "0.35rem 0.75rem",
              color: "#d7def8",
              fontSize: "0.9rem",
            }}
          >
            Strong security posture
          </span>
        </div>

        <div style={{ display: "grid", gap: "0.75rem" }}>
          {security.map((item) => (
            <article
              key={item.label}
              style={{
                border: "1px solid #2a3765",
                borderRadius: "8px",
                padding: "0.9rem",
                background: "#111832",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1rem",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <p style={{ margin: 0, color: "#9fb0e2", fontSize: "0.85rem" }}>
                    Control
                  </p>
                  <h4 style={{ margin: "0.2rem 0 0" }}>{item.label}</h4>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong style={{ display: "block", color: "#95e6c8" }}>
                    {item.status}
                  </strong>
                  <p style={{ margin: "0.3rem 0 0", color: "#c8d2f2" }}>{item.action}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <h3 style={{ margin: "0 0 0.75rem" }}>Review checklist</h3>
        <div style={{ display: "grid", gap: "0.65rem" }}>
          {[
            "Confirm public profile details before sending proposals",
            "Review active sessions after signing in from a new device",
            "Keep billing alerts immediate for payout and invoice changes",
          ].map((item, index) => (
            <div
              key={item}
              style={{
                display: "flex",
                gap: "0.75rem",
                alignItems: "center",
                color: "#d7def8",
              }}
            >
              <strong
                style={{
                  display: "inline-grid",
                  placeItems: "center",
                  width: "2rem",
                  height: "2rem",
                  borderRadius: "999px",
                  background: "#24345f",
                  color: "#f2f5ff",
                  flex: "0 0 auto",
                }}
              >
                {index + 1}
              </strong>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
