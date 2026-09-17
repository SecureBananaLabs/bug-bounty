import type { CSSProperties } from "react";

type SettingsGroup = {
  title: string;
  description: string;
  status: string;
  statusTone: "good" | "warning" | "info";
  details: string[];
  actions: string[];
};

const settingsGroups: SettingsGroup[] = [
  {
    title: "Account & profile",
    description: "Public profile, contact details, and client-facing identity.",
    status: "Profile live",
    statusTone: "good",
    details: ["Display name: Alex Morgan", "Visibility: discoverable", "Portfolio: 8 featured projects"],
    actions: ["Edit profile", "Preview public page"],
  },
  {
    title: "Notifications",
    description: "Email and in-product alerts for project activity.",
    status: "3 channels active",
    statusTone: "info",
    details: ["Proposal updates: instant", "Message digest: daily", "Billing alerts: enabled"],
    actions: ["Manage alerts", "Send test email"],
  },
  {
    title: "Security",
    description: "Sign-in protection, sessions, and recovery controls.",
    status: "Review recommended",
    statusTone: "warning",
    details: ["Two-factor auth: pending setup", "Active sessions: 2 devices", "Recovery email: verified"],
    actions: ["Set up 2FA", "Review sessions"],
  },
  {
    title: "Billing & payouts",
    description: "Invoices, payout schedule, and saved payment methods.",
    status: "Payout ready",
    statusTone: "good",
    details: ["Default payout: bank account ending 2481", "Next payout: Jun 14", "Tax profile: complete"],
    actions: ["Update payout", "View invoices"],
  },
];

const toneStyles: Record<SettingsGroup["statusTone"], CSSProperties> = {
  good: { background: "#123c2a", borderColor: "#2f9e63", color: "#a7f3c3" },
  warning: { background: "#3a2d12", borderColor: "#d19a2a", color: "#ffe0a3" },
  info: { background: "#162f4a", borderColor: "#4f9de8", color: "#bddfff" },
};

const pageHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "1rem",
  alignItems: "flex-start",
  marginBottom: "1rem",
};

const cardHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "0.75rem",
  alignItems: "flex-start",
};

const chipStyle: CSSProperties = {
  border: "1px solid",
  borderRadius: "999px",
  padding: "0.25rem 0.55rem",
  fontSize: "0.78rem",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const detailListStyle: CSSProperties = {
  display: "grid",
  gap: "0.45rem",
  margin: "1rem 0",
  padding: 0,
  listStyle: "none",
};

const actionRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem",
  marginTop: "auto",
};

const primaryButtonStyle: CSSProperties = {
  border: "1px solid #7ea5ff",
  borderRadius: "8px",
  background: "#7ea5ff",
  color: "#071126",
  cursor: "pointer",
  fontWeight: 700,
  padding: "0.55rem 0.75rem",
};

const secondaryButtonStyle: CSSProperties = {
  border: "1px solid #3a4f87",
  borderRadius: "8px",
  background: "#111936",
  color: "#f2f5ff",
  cursor: "pointer",
  fontWeight: 700,
  padding: "0.55rem 0.75rem",
};

export default function SettingsPage() {
  return (
    <section aria-labelledby="settings-heading">
      <div className="card" style={pageHeaderStyle}>
        <div>
          <h2 id="settings-heading">Settings</h2>
          <p>Account preferences, profile visibility, notifications, security, and payout controls.</p>
        </div>
        <span style={{ ...chipStyle, ...toneStyles.good }}>Account active</span>
      </div>

      <div className="grid">
        {settingsGroups.map((group) => (
          <article
            className="card"
            key={group.title}
            style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}
          >
            <div style={cardHeaderStyle}>
              <div>
                <h3 style={{ margin: "0 0 0.4rem" }}>{group.title}</h3>
                <p style={{ margin: 0, color: "#c7d2fe", lineHeight: 1.5 }}>{group.description}</p>
              </div>
              <span style={{ ...chipStyle, ...toneStyles[group.statusTone] }}>{group.status}</span>
            </div>

            <ul style={detailListStyle}>
              {group.details.map((detail) => (
                <li
                  key={detail}
                  style={{
                    borderTop: "1px solid #26345f",
                    color: "#e7ecff",
                    paddingTop: "0.45rem",
                  }}
                >
                  {detail}
                </li>
              ))}
            </ul>

            <div style={actionRowStyle}>
              {group.actions.map((action, index) => (
                <button
                  aria-label={`${action} for ${group.title}`}
                  key={action}
                  style={index === 0 ? primaryButtonStyle : secondaryButtonStyle}
                  type="button"
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
