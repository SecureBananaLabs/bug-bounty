export default function SettingsPage() {
  const settings = [
    {
      category: "Account / Profile",
      items: [
        { label: "Display Name", value: "John Developer", status: "verified" },
        { label: "Email", value: "john@example.com", status: "verified" },
        { label: "Role", value: "Freelancer", status: "active" }
      ]
    },
    {
      category: "Notifications",
      items: [
        { label: "Email Notifications", value: "Enabled", status: "on" },
        { label: "Push Notifications", value: "Disabled", status: "off" },
        { label: "Weekly Digest", value: "Enabled", status: "on" }
      ]
    },
    {
      category: "Security",
      items: [
        { label: "Two-Factor Auth", value: "Disabled", status: "warning" },
        { label: "Session Timeout", value: "30 minutes", status: "ok" },
        { label: "Password", value: "Last changed 30 days ago", status: "ok" }
      ]
    },
    {
      category: "Billing / Payout",
      items: [
        { label: "Payment Method", value: "Visa ending in 4242", status: "verified" },
        { label: "Default Currency", value: "USD", status: "ok" },
        { label: "Payout Schedule", value: "Monthly", status: "ok" }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
      case "on":
      case "ok":
        return "#22c55e";
      case "active":
        return "#3b82f6";
      case "warning":
        return "#f59e0b";
      case "off":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  return (
    <section className="card">
      <h2>Settings</h2>
      <p>Manage your account preferences and security settings.</p>

      {settings.map((section) => (
        <div key={section.category} style={{ marginTop: "1.5rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem", color: "#374151" }}>
            {section.category}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {section.items.map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.75rem",
                  backgroundColor: "#f9fafb",
                  borderRadius: "0.375rem"
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{item.label}</div>
                  <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>{item.value}</div>
                </div>
                <span
                  style={{
                    padding: "0.25rem 0.5rem",
                    borderRadius: "9999px",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    backgroundColor: getStatusColor(item.status) + "20",
                    color: getStatusColor(item.status)
                  }}
                >
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
