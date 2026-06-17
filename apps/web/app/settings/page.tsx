export default function SettingsPage() {
  return (
    <main>
      <h1 style={{ marginBottom: '1.5rem' }}>Settings</h1>

      {/* Account / Profile Section */}
      <section className="card">
        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Account & Profile</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <strong>Email</strong>
            <p style={{ margin: '0.25rem 0 0', color: '#94a3b8' }}>user@example.com</p>
          </div>
          <span style={{ background: '#22c55e', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem' }}>Verified</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <strong>Profile Visibility</strong>
            <p style={{ margin: '0.25rem 0 0', color: '#94a3b8' }}>Public profile visible to all users</p>
          </div>
          <button style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>Edit</button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>Full Name</strong>
            <p style={{ margin: '0.25rem 0 0', color: '#94a3b8' }}>John Doe</p>
          </div>
          <button style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>Edit</button>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="card">
        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Notifications</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <strong>Email Notifications</strong>
            <p style={{ margin: '0.25rem 0 0', color: '#94a3b8' }}>Receive updates about proposals and messages</p>
          </div>
          <span style={{ background: '#22c55e', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem' }}>Enabled</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <strong>Job Alerts</strong>
            <p style={{ margin: '0.25rem 0 0', color: '#94a3b8' }}>Get notified when new jobs match your skills</p>
          </div>
          <span style={{ background: '#f59e0b', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem' }}>Paused</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>Marketing Emails</strong>
            <p style={{ margin: '0.25rem 0 0', color: '#94a3b8' }}>Product updates and newsletter</p>
          </div>
          <span style={{ background: '#64748b', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem' }}>Disabled</span>
        </div>
      </section>

      {/* Security Section */}
      <section className="card">
        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Security</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <strong>Password</strong>
            <p style={{ margin: '0.25rem 0 0', color: '#94a3b8' }}>Last changed 30 days ago</p>
          </div>
          <button style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>Change</button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <strong>Two-Factor Authentication</strong>
            <p style={{ margin: '0.25rem 0 0', color: '#94a3b8' }}>Add an extra layer of security</p>
          </div>
          <span style={{ background: '#ef4444', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem' }}>Not Set Up</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>Active Sessions</strong>
            <p style={{ margin: '0.25rem 0 0', color: '#94a3b8' }}>2 devices currently logged in</p>
          </div>
          <button style={{ background: 'transparent', color: '#3b82f6', border: '1px solid #3b82f6', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>Manage</button>
        </div>
      </section>

      {/* Billing / Payout Section */}
      <section className="card">
        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Billing & Payouts</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <strong>Payment Method</strong>
            <p style={{ margin: '0.25rem 0 0', color: '#94a3b8' }}>Visa ending in 4242</p>
          </div>
          <span style={{ background: '#22c55e', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem' }}>Default</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <strong>Payout Method</strong>
            <p style={{ margin: '0.25rem 0 0', color: '#94a3b8' }}>Bank account for receiving payments</p>
          </div>
          <button style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>Setup</button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>Billing History</strong>
            <p style={{ margin: '0.25rem 0 0', color: '#94a3b8' }}>View past invoices and transactions</p>
          </div>
          <button style={{ background: 'transparent', color: '#3b82f6', border: '1px solid #3b82f6', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>View</button>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="card" style={{ border: '1px solid #ef4444' }}>
        <h2 style={{ marginTop: 0, marginBottom: '1rem', color: '#ef4444' }}>Danger Zone</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>Delete Account</strong>
            <p style={{ margin: '0.25rem 0 0', color: '#94a3b8' }}>Permanently delete your account and all data</p>
          </div>
          <button style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>Delete</button>
        </div>
      </section>
    </main>
  );
}
