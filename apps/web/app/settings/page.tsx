"use client";

type StatusVariant = "success" | "warning" | "danger" | "info";

function StatusChip({ label, variant }: { label: string; variant: StatusVariant }) {
  const colors: Record<StatusVariant, { bg: string; dot: string }> = {
    success: { bg: "#0f2e1a", dot: "#2ed158" },
    warning: { bg: "#2e240f", dot: "#f5a623" },
    danger: { bg: "#2e0f0f", dot: "#e5484d" },
    info: { bg: "#0f1a2e", dot: "#5096ff" },
  };
  const c = colors[variant];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 500,
        background: c.bg,
        color: c.dot,
        border: `1px solid ${c.dot}33`,
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
      {label}
    </span>
  );
}

function ActionButton({ label, href }: { label: string; href?: string }) {
  return (
    <a
      href={href || "#"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 16px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 500,
        background: "#2a3765",
        color: "#f2f5ff",
        border: "1px solid #3a4a7a",
        cursor: "pointer",
        transition: "background 0.15s",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#3a4a7a")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "#2a3765")}
    >
      {label}
      <span style={{ fontSize: 16 }}>→</span>
    </a>
  );
}

function SettingsSection({
  title,
  subtitle,
  status,
  children,
}: {
  title: string;
  subtitle: string;
  status?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      className="card"
      style={{
        padding: "1.25rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#f2f5ff" }}>{title}</h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#8892b0" }}>{subtitle}</p>
        </div>
        {status && <div>{status}</div>}
      </div>
      {children}
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 0",
        borderBottom: "1px solid #1e284a",
        fontSize: 14,
      }}
    >
      <span style={{ color: "#8892b0" }}>{label}</span>
      <span style={{ color: "#f2f5ff", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: "#f2f5ff" }}>Settings</h2>
        <p style={{ margin: "4px 0 0", fontSize: 15, color: "#8892b0" }}>
          Manage your account, security, and preferences.
        </p>
      </div>

      {/* Account / Profile */}
      <SettingsSection
        title="Account & Profile"
        subtitle="Your personal information and public profile"
        status={<StatusChip label="Active" variant="success" />}
      >
        <DetailRow label="Name" value="Alexa Andrews" />
        <DetailRow label="Email" value="alexa@example.com" />
        <DetailRow label="Member since" value="January 2026" />
        <DetailRow label="Account type" value="Freelancer" />
        <div style={{ marginTop: 12 }}>
          <ActionButton label="Edit Profile" />
        </div>
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection
        title="Notifications"
        subtitle="Control how and when we contact you"
        status={<StatusChip label="Enabled" variant="info" />}
      >
        <DetailRow label="Email notifications" value="On" />
        <DetailRow label="Push notifications" value="Off" />
        <DetailRow label="Weekly digest" value="On" />
        <DetailRow label="Marketing emails" value="Off" />
        <div style={{ marginTop: 12 }}>
          <ActionButton label="Manage Preferences" />
        </div>
      </SettingsSection>

      {/* Security */}
      <SettingsSection
        title="Security"
        subtitle="Password, 2FA, and login activity"
        status={<StatusChip label="Good" variant="warning" />}
      >
        <DetailRow label="Two-factor auth" value="Not enabled" />
        <DetailRow label="Last login" value="May 30, 2026 · 7:17 AM CST" />
        <DetailRow label="Active sessions" value="2" />
        <DetailRow label="Password last changed" value="3 months ago" />
        <div
          style={{
            marginTop: 12,
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <ActionButton label="Enable 2FA" />
          <ActionButton label="Change Password" />
          <ActionButton label="View Sessions" />
        </div>
      </SettingsSection>

      {/* Billing & Payout */}
      <SettingsSection
        title="Billing & Payout"
        subtitle="Payment methods, invoices, and earnings"
        status={<StatusChip label="Incomplete" variant="danger" />}
      >
        <DetailRow label="Payout method" value="Not set" />
        <DetailRow label="Default currency" value="USD" />
        <DetailRow label="Earnings (MTD)" value="$0.00" />
        <DetailRow label="Next payout" value="N/A" />
        <div style={{ marginTop: 12 }}>
          <ActionButton label="Set Up Payout" />
        </div>
      </SettingsSection>

      {/* Account Actions */}
      <SettingsSection title="Account Actions" subtitle="Danger zone and account management">
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <ActionButton label="Download Data" />
          <ActionButton label="Deactivate Account" />
        </div>
      </SettingsSection>
    </>
  );
}
