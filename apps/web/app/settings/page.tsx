const sections = [
  {
    title: "Account / Profile",
    rows: [
      { label: "Display Name", value: "Alex Morgan", chip: "Up to date" },
      { label: "Email", value: "alex@example.com", chip: "Verified" },
      { label: "Profile Visibility", value: "Public", chip: "Active" },
    ],
  },
  {
    title: "Notifications",
    rows: [
      { label: "Email Notifications", value: "Enabled", chip: "On" },
      { label: "Job Alerts", value: "Daily digest", chip: "Active" },
      { label: "Proposal Updates", value: "Real-time", chip: "On" },
    ],
  },
  {
    title: "Security",
    rows: [
      { label: "Password", value: "Last changed 14 days ago", chip: "Strong" },
      { label: "Two-Factor Auth", value: "Disabled", chip: "Off" },
      { label: "Active Sessions", value: "2 devices", chip: "Review" },
    ],
  },
  {
    title: "Billing / Payout",
    rows: [
      { label: "Payment Method", value: "Visa ending 4242", chip: "Default" },
      { label: "Payout Schedule", value: "Monthly", chip: "Active" },
      { label: "Tax Information", value: "US - W-9 on file", chip: "Complete" },
    ],
  },
];

function chipColor(chip: string) {
  if (chip === "Off" || chip === "Review") return "#f59e0b";
  if (chip === "Strong" || chip === "Verified" || chip === "Complete") return "#10b981";
  return "#6366f1";
}

export default function SettingsPage() {
  return (
    <section>
      <h2>Settings</h2>
      {sections.map((section) => (
        <div className="card" key={section.title}>
          <h3>{section.title}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {section.rows.map((row) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{row.label}</div>
                  <div style={{ color: "#94a3b8", fontSize: "0.875rem" }}>{row.value}</div>
                </div>
                <span
                  style={{
                    background: chipColor(row.chip),
                    borderRadius: 999,
                    padding: "0.2rem 0.6rem",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#fff",
                  }}
                >
                  {row.chip}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
