const profileSettings = [
  { label: "Display name", value: "Maya Chen" },
  { label: "Public role", value: "Freelancer" },
  { label: "Profile visibility", value: "Public" }
];

const notificationSettings = [
  { label: "Proposal updates", value: "Email + in-app" },
  { label: "Message alerts", value: "In-app only" },
  { label: "Weekly digest", value: "Enabled" }
];

const securitySettings = [
  { label: "Password", value: "Updated 18 days ago", status: "Healthy" },
  { label: "Two-factor auth", value: "Not enabled", status: "Recommended" },
  { label: "Active sessions", value: "2 devices", status: "Review" }
];

const payoutSettings = [
  { label: "Default payout rail", value: "USDC on Solana" },
  { label: "Invoice currency", value: "USD" },
  { label: "Auto-withdraw", value: "Manual approval" }
];

function SettingsGroup({
  title,
  description,
  action,
  rows
}: {
  title: string;
  description: string;
  action: string;
  rows: Array<{ label: string; value: string; status?: string }>;
}) {
  return (
    <section className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start" }}>
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <button>{action}</button>
      </div>
      <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
        {rows.map((row) => (
          <div
            key={row.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "1rem",
              borderTop: "1px solid #e5e7eb",
              paddingTop: "0.75rem"
            }}
          >
            <span>{row.label}</span>
            <strong>{row.status ? `${row.value} - ${row.status}` : row.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function SettingsPage() {
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <section className="card">
        <h2>Settings</h2>
        <p>Review account defaults, notification routing, security posture, and payout preferences.</p>
      </section>

      <SettingsGroup
        title="Account and profile"
        description="Controls how your public profile appears to clients and collaborators."
        action="Edit profile"
        rows={profileSettings}
      />

      <SettingsGroup
        title="Notifications"
        description="Keeps high-signal workflow updates visible without overloading email."
        action="Tune alerts"
        rows={notificationSettings}
      />

      <SettingsGroup
        title="Security"
        description="Highlights session and authentication settings that need attention."
        action="Review access"
        rows={securitySettings}
      />

      <SettingsGroup
        title="Billing and payouts"
        description="Shows the default money movement settings used for invoices and withdrawals."
        action="Manage payouts"
        rows={payoutSettings}
      />
    </div>
  );
}
