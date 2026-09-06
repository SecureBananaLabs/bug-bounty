export default function SettingsPage() {
  return (
    <section>
      <h2>Settings</h2>

      <div className="card">
        <h3>Profile</h3>
        <p>Manage your public profile, display name, and avatar.</p>
        <button disabled>Edit Profile</button>
      </div>

      <div className="card">
        <h3>Notifications</h3>
        <p>Control email and in-app notification preferences.</p>
        <button disabled>Manage Notifications</button>
      </div>

      <div className="card">
        <h3>Security</h3>
        <p>Update your password and manage active sessions.</p>
        <button disabled>Security Settings</button>
      </div>

      <div className="card">
        <h3>Billing & Payouts</h3>
        <p>View payment methods, billing history, and payout preferences.</p>
        <button disabled>Billing Settings</button>
      </div>
    </section>
  );
}
