export default function SettingsPage() {
  return (
    <section className="card">
      <h2>Settings</h2>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h3>Account &amp; Profile</h3>
        <p>Update your display name, email address, and profile photo.</p>
        <button disabled style={{ marginTop: "0.5rem" }}>Edit Profile</button>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h3>Notifications</h3>
        <p>Choose which events trigger email or in-app notifications.</p>
        <label style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
          <input type="checkbox" defaultChecked /> Job alerts
        </label>
        <label style={{ display: "flex", gap: "0.5rem" }}>
          <input type="checkbox" defaultChecked /> Proposal updates
        </label>
        <label style={{ display: "flex", gap: "0.5rem" }}>
          <input type="checkbox" /> Marketing emails
        </label>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h3>Security</h3>
        <p>Manage your password and two-factor authentication settings.</p>
        <button disabled style={{ marginTop: "0.5rem" }}>Change Password</button>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h3>Billing &amp; Payouts</h3>
        <p>View your payment methods and payout preferences.</p>
        <button disabled style={{ marginTop: "0.5rem" }}>Manage Billing</button>
      </div>
    </section>
  );
}
