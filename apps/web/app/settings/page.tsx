export default function SettingsPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h2>Settings</h2>

      <section className="card">
        <h3>Account &amp; Profile</h3>
        <p><strong>Display name:</strong> Jane Doe</p>
        <p><strong>Email:</strong> jane@example.com</p>
        <p><strong>Profile visibility:</strong> <span style={{ color: "#22c55e" }}>Public</span></p>
        <button style={{ marginTop: "0.5rem" }}>Edit Profile</button>
      </section>

      <section className="card">
        <h3>Notifications</h3>
        <p><strong>Email notifications:</strong> <span style={{ color: "#22c55e" }}>Enabled</span></p>
        <p><strong>Job alert emails:</strong> <span style={{ color: "#22c55e" }}>Enabled</span></p>
        <p><strong>Message notifications:</strong> <span style={{ color: "#f59e0b" }}>In-app only</span></p>
        <button style={{ marginTop: "0.5rem" }}>Manage Notifications</button>
      </section>

      <section className="card">
        <h3>Security</h3>
        <p><strong>Password:</strong> Last changed 30 days ago</p>
        <p><strong>Two-factor authentication:</strong> <span style={{ color: "#ef4444" }}>Disabled</span></p>
        <p><strong>Active sessions:</strong> 2 devices</p>
        <button style={{ marginTop: "0.5rem" }}>Change Password</button>
        <button style={{ marginTop: "0.5rem", marginLeft: "0.5rem" }}>Enable 2FA</button>
      </section>

      <section className="card">
        <h3>Billing &amp; Payouts</h3>
        <p><strong>Payment method:</strong> Visa •••• 4242</p>
        <p><strong>Payout account:</strong> <span style={{ color: "#f59e0b" }}>Not configured</span></p>
        <p><strong>Next invoice:</strong> Jul 1, 2026</p>
        <button style={{ marginTop: "0.5rem" }}>Manage Billing</button>
        <button style={{ marginTop: "0.5rem", marginLeft: "0.5rem" }}>Set Up Payouts</button>
      </section>
    </div>
  );
}
