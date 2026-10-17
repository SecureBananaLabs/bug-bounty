export default function SettingsPage() {
  return (
    <section className="card">
      <h2>Settings</h2>
      
      <div className="settings-section">
        <h3>Account / Profile</h3>
        <div className="settings-item">
          <span className="label">Display Name</span>
          <span className="value">John Doe</span>
          <button className="btn-small">Edit</button>
        </div>
        <div className="settings-item">
          <span className="label">Email</span>
          <span className="value">john@example.com</span>
          <span className="chip success">Verified</span>
        </div>
        <div className="settings-item">
          <span className="label">Profile Visibility</span>
          <span className="value">Public</span>
          <button className="btn-small">Change</button>
        </div>
      </div>

      <div className="settings-section">
        <h3>Notifications</h3>
        <div className="settings-item">
          <span className="label">Email Notifications</span>
          <span className="chip success">Enabled</span>
          <button className="btn-small">Configure</button>
        </div>
        <div className="settings-item">
          <span className="label">Push Notifications</span>
          <span className="chip warning">Disabled</span>
          <button className="btn-small">Enable</button>
        </div>
        <div className="settings-item">
          <span className="label">Weekly Digest</span>
          <span className="chip success">Enabled</span>
          <button className="btn-small">Configure</button>
        </div>
      </div>

      <div className="settings-section">
        <h3>Security</h3>
        <div className="settings-item">
          <span className="label">Two-Factor Auth</span>
          <span className="chip warning">Not Enabled</span>
          <button className="btn-small">Enable</button>
        </div>
        <div className="settings-item">
          <span className="label">Password</span>
          <span className="value">Last changed 30 days ago</span>
          <button className="btn-small">Change</button>
        </div>
        <div className="settings-item">
          <span className="label">Active Sessions</span>
          <span className="value">2 devices</span>
          <button className="btn-small">Manage</button>
        </div>
      </div>

      <div className="settings-section">
        <h3>Billing / Payout</h3>
        <div className="settings-item">
          <span className="label">Payment Method</span>
          <span className="value">Visa ending in 4242</span>
          <button className="btn-small">Update</button>
        </div>
        <div className="settings-item">
          <span className="label">Payout Method</span>
          <span className="chip warning">Not Set</span>
          <button className="btn-small">Setup</button>
        </div>
        <div className="settings-item">
          <span className="label">Billing Email</span>
          <span className="value">billing@example.com</span>
          <button className="btn-small">Change</button>
        </div>
      </div>
    </section>
  );
}
