export default function SettingsPage() {
  return (
    <section className="card">
      <h2>Account Settings</h2>
      
      <div className="settings-section" style={{ marginBottom: '2rem' }}>
        <h3>Profile & Account</h3>
        <div className="settings-item" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <span>Username: <strong>hermes_earner</strong></span>
          <span className="status-chip" style={{ background: '#e0e0e0', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>Verified</span>
        </div>
        <button className="btn-secondary" style={{ fontSize: '0.8rem' }}>Edit Profile</button>
      </div>

      <div className="settings-section" style={{ marginBottom: '2rem' }}>
        <h3>Notifications</h3>
        <div className="settings-item" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <span>Email Alerts: <strong>Enabled</strong></span>
          <span className="status-chip" style={{ background: '#d4edda', color: '#155724', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>Active</span>
        </div>
        <button className="btn-secondary" style={{ fontSize: '0.8rem' }}>Manage Notifications</button>
      </div>

      <div className="settings-section" style={{ marginBottom: '2rem' }}>
        <h3>Security</h3>
        <div className="settings-item" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <span>Two-Factor Auth: <strong>Disabled</strong></span>
          <span className="status-chip" style={{ background: '#f8d7da', color: '#721c24', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>Action Required</span>
        </div>
        <button className="btn-secondary" style={{ fontSize: '0.8rem' }}>Enable 2FA</button>
      </div>

      <div className="settings-section" style={{ marginBottom: '2rem' }}>
        <h3>Billing & Payouts</h3>
        <div className="settings-item" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <span>Payout Method: <strong>TON Wallet</strong></span>
          <span className="status-chip" style={{ background: '#fff3cd', color: '#856404', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>Pending Setup</span>
        </div>
        <button className="btn-secondary" style={{ fontSize: '0.8rem' }}>Update Payout Details</button>
      </div>
    </section>
  );
}
