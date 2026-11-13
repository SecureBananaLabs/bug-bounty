import type { CSSProperties } from "react";

const settingSections = [
  {
    title: "Account & profile",
    status: "Public profile live",
    statusTone: "ready",
    description: "Maya Chen is visible to clients with verified identity, hourly rate, and portfolio highlights.",
    details: ["Profile visibility: Public", "Primary email: maya@example.com", "Timezone: UTC-08:00"],
    action: "Review profile"
  },
  {
    title: "Notifications",
    status: "3 channels active",
    statusTone: "ready",
    description: "Proposal, message, milestone, and payment alerts are routed to the preferred inbox.",
    details: ["Email: Enabled", "Product digest: Weekly", "Billing alerts: Immediate"],
    action: "Adjust alerts"
  },
  {
    title: "Security",
    status: "Action recommended",
    statusTone: "warning",
    description: "Password sign-in is protected, but two-factor authentication is not enabled yet.",
    details: ["Password updated: 18 days ago", "Two-factor auth: Not enabled", "Active sessions: 2 devices"],
    action: "Enable 2FA"
  },
  {
    title: "Payout & billing",
    status: "Default set",
    statusTone: "ready",
    description: "Client billing and freelancer payout defaults are ready for new marketplace activity.",
    details: ["Default payout: USDC wallet", "Invoice currency: USD", "Tax profile: Needs annual review"],
    action: "Manage billing"
  }
];

const pageStyle: CSSProperties = {
  display: "grid",
  gap: "1rem"
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "1rem",
  alignItems: "flex-start",
  flexWrap: "wrap"
};

const sectionGridStyle: CSSProperties = {
  display: "grid",
  gap: "0.75rem",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))"
};

const panelStyle: CSSProperties = {
  border: "1px solid #2a3765",
  borderRadius: "10px",
  padding: "1rem",
  background: "#10172c"
};

const rowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.75rem",
  marginBottom: "0.75rem"
};

const chipBaseStyle: CSSProperties = {
  borderRadius: "999px",
  padding: "0.25rem 0.55rem",
  fontSize: "0.75rem",
  whiteSpace: "nowrap"
};

const actionStyle: CSSProperties = {
  marginTop: "0.75rem",
  width: "100%",
  border: "1px solid #6d7fc4",
  borderRadius: "8px",
  background: "#1d2850",
  color: "#f2f5ff",
  padding: "0.55rem 0.75rem",
  fontWeight: 700,
  cursor: "pointer"
};

export default function SettingsPage() {
  return (
    <section className="card" style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h2>Settings</h2>
          <p>Account preferences, profile visibility, security, and billing defaults.</p>
        </div>
        <span
          style={{
            ...chipBaseStyle,
            background: "#163b2b",
            color: "#95f0bf",
            border: "1px solid #2f8b5b"
          }}
        >
          Account in good standing
        </span>
      </div>

      <div style={sectionGridStyle}>
        {settingSections.map((section) => {
          const isWarning = section.statusTone === "warning";

          return (
            <article key={section.title} style={panelStyle}>
              <div style={rowStyle}>
                <h3 style={{ margin: 0 }}>{section.title}</h3>
                <span
                  style={{
                    ...chipBaseStyle,
                    background: isWarning ? "#3a2d12" : "#163b2b",
                    color: isWarning ? "#ffd27a" : "#95f0bf",
                    border: isWarning ? "1px solid #8b6b20" : "1px solid #2f8b5b"
                  }}
                >
                  {section.status}
                </span>
              </div>

              <p>{section.description}</p>

              <ul style={{ paddingLeft: "1.1rem", margin: "0.75rem 0" }}>
                {section.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>

              <button type="button" style={actionStyle}>
                {section.action}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
