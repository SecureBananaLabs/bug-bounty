import type { CSSProperties } from "react";

export default function SettingsPage() {
  const settingsGroups = [
    {
      title: "Account",
      status: "Profile 86%",
      statusTone: "#47d18c",
      summary: "FreelanceFlow Studio",
      details: ["Public freelancer profile", "Primary email verified", "Portfolio visible to clients"],
      action: "Review profile",
    },
    {
      title: "Notifications",
      status: "3 enabled",
      statusTone: "#8bc5ff",
      summary: "Project and payout alerts",
      details: ["Email project updates", "Weekly opportunity digest", "SMS disabled"],
      action: "Edit alerts",
    },
    {
      title: "Security",
      status: "Action needed",
      statusTone: "#ffcf6e",
      summary: "Password updated 42 days ago",
      details: ["Two-factor authentication off", "Trusted devices: 2", "Session review recommended"],
      action: "Secure account",
    },
    {
      title: "Billing",
      status: "Ready",
      statusTone: "#b6f06f",
      summary: "ACH payouts to Mercury",
      details: ["Next payout: Jun 14", "Tax profile complete", "Auto-invoice enabled"],
      action: "Manage payout",
    },
  ];

  return (
    <section style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.kicker}>Workspace settings</p>
          <h2 style={styles.title}>Account controls</h2>
        </div>
        <button style={styles.primaryAction}>Save changes</button>
      </div>

      <div style={styles.summaryStrip}>
        <div>
          <span style={styles.summaryLabel}>Account owner</span>
          <strong style={styles.summaryValue}>Maya Chen</strong>
        </div>
        <div>
          <span style={styles.summaryLabel}>Plan</span>
          <strong style={styles.summaryValue}>Creator Pro</strong>
        </div>
        <div>
          <span style={styles.summaryLabel}>Payout status</span>
          <strong style={styles.summaryValue}>Verified</strong>
        </div>
      </div>

      <div style={styles.grid}>
        {settingsGroups.map((group) => (
          <article key={group.title} style={styles.panel}>
            <div style={styles.panelHeader}>
              <h3 style={styles.panelTitle}>{group.title}</h3>
              <span style={{ ...styles.statusChip, borderColor: group.statusTone, color: group.statusTone }}>
                {group.status}
              </span>
            </div>
            <p style={styles.panelSummary}>{group.summary}</p>
            <ul style={styles.detailList}>
              {group.details.map((detail) => (
                <li key={detail} style={styles.detailItem}>
                  <span aria-hidden style={styles.detailDot} />
                  {detail}
                </li>
              ))}
            </ul>
            <button style={styles.secondaryAction}>{group.action}</button>
          </article>
        ))}
      </div>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    display: "grid",
    gap: "1rem",
  },
  header: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: "1rem",
  },
  kicker: {
    color: "#9fb0da",
    fontSize: "0.82rem",
    fontWeight: 700,
    letterSpacing: "0",
    margin: "0 0 0.35rem",
    textTransform: "uppercase" as const,
  },
  title: {
    fontSize: "2rem",
    lineHeight: 1.1,
    margin: 0,
  },
  primaryAction: {
    background: "#f2f5ff",
    border: "0",
    borderRadius: "8px",
    color: "#0b1020",
    cursor: "pointer",
    fontWeight: 800,
    minHeight: "2.6rem",
    padding: "0 1rem",
  },
  summaryStrip: {
    background: "#151c35",
    border: "1px solid #2a3765",
    borderRadius: "8px",
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    padding: "1rem",
  },
  summaryLabel: {
    color: "#9fb0da",
    display: "block",
    fontSize: "0.78rem",
    marginBottom: "0.25rem",
  },
  summaryValue: {
    display: "block",
    fontSize: "1rem",
  },
  grid: {
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  },
  panel: {
    background: "#151c35",
    border: "1px solid #2a3765",
    borderRadius: "8px",
    display: "grid",
    gap: "0.9rem",
    padding: "1rem",
  },
  panelHeader: {
    alignItems: "center",
    display: "flex",
    gap: "0.75rem",
    justifyContent: "space-between",
  },
  panelTitle: {
    fontSize: "1.05rem",
    margin: 0,
  },
  statusChip: {
    border: "1px solid",
    borderRadius: "999px",
    fontSize: "0.76rem",
    fontWeight: 800,
    padding: "0.25rem 0.55rem",
    whiteSpace: "nowrap" as const,
  },
  panelSummary: {
    color: "#dbe4ff",
    margin: 0,
  },
  detailList: {
    display: "grid",
    gap: "0.5rem",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  detailItem: {
    alignItems: "center",
    color: "#b8c5ec",
    display: "flex",
    fontSize: "0.92rem",
    gap: "0.5rem",
  },
  detailDot: {
    background: "#47d18c",
    borderRadius: "999px",
    display: "inline-block",
    flex: "0 0 0.45rem",
    height: "0.45rem",
    width: "0.45rem",
  },
  secondaryAction: {
    background: "#202a4f",
    border: "1px solid #3a4a82",
    borderRadius: "8px",
    color: "#f2f5ff",
    cursor: "pointer",
    fontWeight: 800,
    minHeight: "2.4rem",
    padding: "0 0.9rem",
    width: "100%",
  },
};
