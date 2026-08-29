export default function SettingsPage() {
  const sections = [
    {
      title: "Account & Profile",
      items: [
        { label: "Display Name", value: "Jane Doe", action: "Edit" },
        { label: "Username", value: "@janedoe", action: "Edit" },
        { label: "Email", value: "jane@example.com", action: "Change" },
        { label: "Profile Visibility", value: "Public", status: "success" },
      ],
    },
    {
      title: "Notifications",
      items: [
        { label: "Job Alerts", value: "Daily Digest", action: "Change" },
        { label: "Messages", value: "Push + Email", status: "success" },
        { label: "Marketing", value: "Off", status: "muted" },
      ],
    },
    {
      title: "Security",
      items: [
        { label: "Two-Factor Auth", value: "Enabled", status: "success", action: "Manage" },
        { label: "Active Sessions", value: "2 devices", action: "View All" },
        { label: "Last Password Change", value: "30 days ago", action: "Update" },
      ],
    },
    {
      title: "Payout & Billing",
      items: [
        { label: "Payout Method", value: "Stripe", status: "success" },
        { label: "Payout Schedule", value: "Weekly", action: "Change" },
        { label: "Next Payout", value: "$1,250 (est.)", action: "Details" },
      ],
    },
  ];

  return (
    <section>
      <h2>Settings</h2>
      <p className="muted" style={{ marginBottom: 20 }}>
        Account preferences, profile visibility, and security controls.
      </p>
      {sections.map((section) => (
        <div key={section.title} className="card" style={{ marginBottom: 16, padding: 16 }}>
          <h3 style={{ marginBottom: 12, fontSize: "1.1rem" }}>{section.title}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {section.items.map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: 8,
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.9rem", opacity: 0.7 }}>{item.label}</span>
                  <div
                    style={{
                      fontSize: "0.95rem",
                      color: item.status === "success" ? "var(--green, #4ade80)" : item.status === "muted" ? "var(--muted, #888)" : "inherit",
                    }}
                  >
                    {item.value}
                  </div>
                </div>
                {item.action && (
                  <button
                    className="card"
                    style={{ padding: "4px 12px", fontSize: "0.8rem", cursor: "pointer", border: "none" }}
                    onClick={() => {}}
                  >
                    {item.action}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
