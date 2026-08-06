export default function SettingsPage() {
  return (
    <section className="card">
      <h2>Settings</h2>

      <div style={{ marginTop: '16px' }}>
        <h3>Account / Profile</h3>
        <p>Manage your profile information and account details.</p>
        <p><strong>Status:</strong> <span style={{ color: 'green' }}>Active</span></p>
      </div>

      <div style={{ marginTop: '16px' }}>
        <h3>Notifications</h3>
        <p>Email and push notification preferences.</p>
        <p><strong>Email:</strong> <span style={{ color: 'green' }}>Enabled</span></p>
        <p><strong>Push:</strong> <span style={{ color: 'green' }}>Enabled</span></p>
      </div>

      <div style={{ marginTop: '16px' }}>
        <h3>Security</h3>
        <p>Two-factor authentication and password management.</p>
        <p><strong>2FA:</strong> <span style={{ color: 'orange' }}>Not enabled</span></p>
      </div>

      <div style={{ marginTop: '16px' }}>
        <h3>Billing / Payout Preferences</h3>
        <p>Payment methods and payout settings.</p>
        <p><strong>Method:</strong> Bank Transfer</p>
        <p><strong>Status:</strong> <span style={{ color: 'green' }}>Verified</span></p>
      </div>
    </section>
  );
}
