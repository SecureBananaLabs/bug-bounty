export default function SettingsPage() {
  const mockUser = {
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    username: "alexj_freelancer",
    profileVisibility: "public",
    twoFactorEnabled: false,
    lastPasswordChange: "2025-11-14",
    activeSessions: 2,
    emailNotifications: true,
    projectUpdates: true,
    marketingEmails: false,
    smsAlerts: false,
    payoutMethod: "Bank Transfer",
    payoutSchedule: "Weekly",
    currency: "USD",
    billingEmail: "alex.johnson@example.com",
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.25rem" }}>
        Settings
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
        Manage your account, security, and preferences.
      </p>

      {/* Account & Profile */}
      <section className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, margin: 0 }}>Account &amp; Profile</h2>
          <button
            style={{
              padding: "0.375rem 0.875rem",
              fontSize: "0.875rem",
              borderRadius: "0.375rem",
              border: "1px solid #d1d5db",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Edit Profile
          </button>
        </div>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <SettingRow label="Full Name" value={mockUser.name} />
          <SettingRow label="Email" value={mockUser.email} />
          <SettingRow label="Username" value={`@${mockUser.username}`} />
          <SettingRow
            label="Profile Visibility"
            value={
              <StatusChip
                label={mockUser.profileVisibility === "public" ? "Public" : "Private"}
                color={mockUser.profileVisibility === "public" ? "green" : "gray"}
              />
            }
            action={
              <button style={linkBtnStyle}>
                {mockUser.profileVisibility === "public" ? "Set Private" : "Set Public"}
              </button>
            }
          />
        </div>
      </section>

      {/* Notifications */}
      <section className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, margin: 0 }}>Notifications</h2>
          <button style={{ padding: "0.375rem 0.875rem", fontSize: "0.875rem", borderRadius: "0.375rem", border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" }}>
            Manage All
          </button>
        </div>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <SettingRow
            label="Email Notifications"
            value={<StatusChip label={mockUser.emailNotifications ? "Enabled" : "Disabled"} color={mockUser.emailNotifications ? "green" : "gray"} />}
            action={<ToggleAction enabled={mockUser.emailNotifications} />}
          />
          <SettingRow
            label="Project Updates"
            value={<StatusChip label={mockUser.projectUpdates ? "Enabled" : "Disabled"} color={mockUser.projectUpdates ? "green" : "gray"} />}
            action={<ToggleAction enabled={mockUser.projectUpdates} />}
          />
          <SettingRow
            label="Marketing Emails"
            value={<StatusChip label={mockUser.marketingEmails ? "Enabled" : "Disabled"} color={mockUser.marketingEmails ? "green" : "gray"} />}
            action={<ToggleAction enabled={mockUser.marketingEmails} />}
          />
          <SettingRow
            label="SMS Alerts"
            value={<StatusChip label={mockUser.smsAlerts ? "Enabled" : "Disabled"} color={mockUser.smsAlerts ? "green" : "gray"} />}
            action={<ToggleAction enabled={mockUser.smsAlerts} />}
          />
        </div>
      </section>

      {/* Security */}
      <section className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, margin: 0 }}>Security</h2>
        </div>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <SettingRow
            label="Two-Factor Authentication"
            value={
              <StatusChip
                label={mockUser.twoFactorEnabled ? "Enabled" : "Not Enabled"}
                color={mockUser.twoFactorEnabled ? "green" : "red"}
              />
            }
            action={
              <button style={linkBtnStyle}>
                {mockUser.twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
              </button>
            }
          />
          <SettingRow
            label="Password"
            value={
              <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                Last changed {mockUser.lastPasswordChange}
              </span>
            }
            action={<button style={linkBtnStyle}>Change Password</button>}
          />
          <SettingRow
            label="Active Sessions"
            value={
              <StatusChip
                label={`${mockUser.activeSessions} active`}
                color={mockUser.activeSessions > 1 ? "yellow" : "green"}
              />
            }
            action={<button style={{ ...linkBtnStyle, color: "#dc2626" }}>Revoke All</button>}
          />
        </div>
      </section>

      {/* Billing & Payouts */}
      <section className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, margin: 0 }}>Billing &amp; Payouts</h2>
          <a
            href="/billing"
            style={{
              padding: "0.375rem 0.875rem",
              fontSize: "0.875rem",
              borderRadius: "0.375rem",
              border: "1px solid #d1d5db",
              background: "#fff",
              cursor: "pointer",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            Billing Details
          </a>
        </div>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <SettingRow
            label="Payout Method"
            value={<StatusChip label={mockUser.payoutMethod} color="green" />}
            action={<button style={linkBtnStyle}>Change Method</button>}
          />
          <SettingRow
            label="Payout Schedule"
            value={
              <span style={{ fontSize: "0.875rem", color: "#374151" }}>{mockUser.payoutSchedule}</span>
            }
            action={<button style={linkBtnStyle}>Edit Schedule</button>}
          />
          <SettingRow
            label="Currency"
            value={<span style={{ fontSize: "0.875rem", color: "#374151" }}>{mockUser.currency}</span>}
            action={<button style={linkBtnStyle}>Change</button>}
          />
          <SettingRow
            label="Billing Email"
            value={<span style={{ fontSize: "0.875rem", color: "#374151" }}>{mockUser.billingEmail}</span>}
            action={<button style={linkBtnStyle}>Update</button>}
          />
        </div>
      </section>

      {/* Danger Zone */}
      <section className="card" style={{ border: "1px solid #fecaca" }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem", color: "#dc2626" }}>
          Danger Zone
        </h2>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 500, fontSize: "0.875rem" }}>Delete Account</p>
            <p style={{ margin: 0, fontSize: "0.8125rem", color: "#6b7280" }}>
              Permanently remove your account and all associated data.
            </p>
          </div>
          <button
            style={{
              padding: "0.375rem 0.875rem",
              fontSize: "0.875rem",
              borderRadius: "0.375rem",
              border: "1px solid #dc2626",
              background: "#fff",
              color: "#dc2626",
              cursor: "pointer",
            }}
          >
            Delete Account
          </button>
        </div>
      </section>
    </div>
  );
}

const linkBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#2563eb",
  cursor: "pointer",
  fontSize: "0.875rem",
  padding: 0,
  textDecoration: "underline",
};

function StatusChip({ label, color }: { label: string; color: "green" | "red" | "gray" | "yellow" }) {
  const colors: Record<string, { bg: string; text: string }> = {
    green: { bg: "#dcfce7", text: "#166534" },
    red: { bg: "#fee2e2", text: "#991b1b" },
    gray: { bg: "#f3f4f6", text: "#374151" },
    yellow: { bg: "#fef9c3", text: "#854d0e" },
  };
  const { bg, text } = colors[color];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.125rem 0.625rem",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        background: bg,
        color: text,
      }}
    >
      {label}
    </span>
  );
}

function ToggleAction({ enabled }: { enabled: boolean }) {
  return (
    <button style={linkBtnStyle}>{enabled ? "Disable" : "Enable"}</button>
  );
}

function SettingRow({
  label,
  value,
  action,
}: {
  label: string;
  value: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.625rem 0",
        borderBottom: "1px solid #f3f4f6",
        gap: "1rem",
      }}
    >
      <span style={{ fontSize: "0.875rem", color: "#6b7280", minWidth: 180 }}>{label}</span>
      <span style={{ flex: 1 }}>{value}</span>
      {action && <span>{action}</span>}
    </div>
  );
}
