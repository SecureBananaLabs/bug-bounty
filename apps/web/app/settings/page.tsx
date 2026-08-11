export default function SettingsPage() {
  // Mock data for static settings overview
  const accountStatus = {
    email: "alex.dev@example.com",
    emailVerified: true,
    profileComplete: true,
    memberSince: "2026-01-15",
    role: "Freelancer",
    visibility: "Public"
  };

  const notificationPrefs = {
    email: true,
    push: false,
    proposalUpdates: true,
    messageAlerts: true,
    billingAlerts: true,
    marketingEmails: false
  };

  const securityStatus = {
    twoFactorEnabled: false,
    lastLogin: "2026-06-02 08:45 UTC",
    passwordLastChanged: "2026-03-20",
    sessionsActive: 1,
    loginAlerts: true
  };

  const billingPayout = {
    defaultCurrency: "USD",
    payoutMethod: "Bank Transfer (ACH)",
    nextInvoiceDue: "2026-06-15",
    balance: "$2,450.00",
    pendingPayouts: "$1,200.00"
  };

  const StatusChip = ({ active, label }: { active: boolean; label: string }) => (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 12,
        fontSize: "0.78rem",
        fontWeight: 600,
        background: active ? "#1b3a2d" : "#3a1e1e",
        color: active ? "#4caf50" : "#ef5350",
        border: `1px solid ${active ? "#2e7d32" : "#c62828"}`
      }}
    >
      {active ? "✓" : "✗"} {label}
    </span>
  );

  const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div
      className="card"
      style={{ marginBottom: "1rem" }}
    >
      <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "1.1rem", borderBottom: "1px solid #2a3765", paddingBottom: "0.5rem" }}>
        {title}
      </h3>
      {children}
    </div>
  );

  const LabelValue = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.35rem 0" }}>
      <span style={{ color: "#8892b0", fontSize: "0.9rem" }}>{label}</span>
      <span style={{ fontFamily: mono ? "monospace" : "inherit", fontWeight: mono ? 500 : 400, color: "#ccd6f6" }}>
        {value}
      </span>
    </div>
  );

  const ActionButton = ({ label, variant }: { label: string; variant?: "primary" | "danger" }) => (
    <button
      style={{
        background: variant === "danger" ? "#c62828" : "#5468ff",
        color: "white",
        border: "none",
        borderRadius: 6,
        padding: "0.35rem 0.8rem",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: "0.8rem",
        marginTop: "0.5rem"
      }}
    >
      {label}
    </button>
  );

  return (
    <section>
      <h2 style={{ marginBottom: "0.25rem" }}>Settings</h2>
      <p style={{ color: "#8892b0", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
        Manage your account preferences, security, and billing.
      </p>

      {/* Account / Profile Section */}
      <SectionCard title="Account &amp; Profile">
        <div style={{ marginBottom: "0.75rem" }}>
          <LabelValue label="Email" value={accountStatus.email} mono />
          <LabelValue label="Role" value={accountStatus.role} />
          <LabelValue label="Member since" value={accountStatus.memberSince} />
          <LabelValue label="Profile visibility" value={accountStatus.visibility} />
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
          <StatusChip active={accountStatus.emailVerified} label="Email verified" />
          <StatusChip active={accountStatus.profileComplete} label="Profile complete" />
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <ActionButton label="Edit Profile" />
          <ActionButton label="Change Email" />
        </div>
      </SectionCard>

      {/* Notifications Section */}
      <SectionCard title="Notifications">
        <div style={{ marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.35rem 0" }}>
            <span style={{ color: "#ccd6f6", fontSize: "0.9rem" }}>Email notifications</span>
            <StatusChip active={notificationPrefs.email} label={notificationPrefs.email ? "On" : "Off"} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.35rem 0" }}>
            <span style={{ color: "#ccd6f6", fontSize: "0.9rem" }}>Push notifications</span>
            <StatusChip active={notificationPrefs.push} label={notificationPrefs.push ? "On" : "Off"} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.35rem 0" }}>
            <span style={{ color: "#ccd6f6", fontSize: "0.9rem" }}>Proposal updates</span>
            <StatusChip active={notificationPrefs.proposalUpdates} label={notificationPrefs.proposalUpdates ? "On" : "Off"} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.35rem 0" }}>
            <span style={{ color: "#ccd6f6", fontSize: "0.9rem" }}>Message alerts</span>
            <StatusChip active={notificationPrefs.messageAlerts} label={notificationPrefs.messageAlerts ? "On" : "Off"} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.35rem 0" }}>
            <span style={{ color: "#ccd6f6", fontSize: "0.9rem" }}>Billing alerts</span>
            <StatusChip active={notificationPrefs.billingAlerts} label={notificationPrefs.billingAlerts ? "On" : "Off"} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.35rem 0" }}>
            <span style={{ color: "#ccd6f6", fontSize: "0.9rem" }}>Marketing emails</span>
            <StatusChip active={notificationPrefs.marketingEmails} label={notificationPrefs.marketingEmails ? "On" : "Off"} />
          </div>
        </div>
        <ActionButton label="Manage Notifications" />
      </SectionCard>

      {/* Security Section */}
      <SectionCard title="Security">
        <div style={{ marginBottom: "0.75rem" }}>
          <LabelValue label="Last login" value={securityStatus.lastLogin} />
          <LabelValue label="Password changed" value={securityStatus.passwordLastChanged} />
          <LabelValue label="Active sessions" value={String(securityStatus.sessionsActive)} />
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
          <StatusChip active={securityStatus.twoFactorEnabled} label="2FA" />
          <StatusChip active={securityStatus.loginAlerts} label="Login alerts" />
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <ActionButton label="Enable 2FA" />
          <ActionButton label="Change Password" />
          <ActionButton label="View Sessions" variant="danger" />
        </div>
      </SectionCard>

      {/* Billing & Payout Section */}
      <SectionCard title="Billing &amp; Payout">
        <div style={{ marginBottom: "0.75rem" }}>
          <LabelValue label="Balance" value={billingPayout.balance} mono />
          <LabelValue label="Pending payouts" value={billingPayout.pendingPayouts} mono />
          <LabelValue label="Payout method" value={billingPayout.payoutMethod} />
          <LabelValue label="Currency" value={billingPayout.defaultCurrency} />
          <LabelValue label="Next invoice" value={billingPayout.nextInvoiceDue} />
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <ActionButton label="Update Payout Method" />
          <ActionButton label="View Invoices" />
        </div>
      </SectionCard>
    </section>
  );
}
