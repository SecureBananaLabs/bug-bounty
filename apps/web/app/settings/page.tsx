export default function SettingsPage() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.5rem" }}>
      <h2>Settings</h2>
      <section className="card">
        <h3>Account &amp; Profile</h3>
        <p><strong>Name:</strong> Jane Doe</p>
        <p><strong>Email:</strong> jane@example.com</p>
        <p><strong>Visibility:</strong> <span style={{color:"#22c55e"}}>Public</span></p>
        <button>Edit Profile</button>
      </section>
      <section className="card">
        <h3>Notifications</h3>
        <p><strong>Email notifications:</strong> <span style={{color:"#22c55e"}}>Enabled</span></p>
        <p><strong>Job alerts:</strong> <span style={{color:"#22c55e"}}>Enabled</span></p>
        <p><strong>Message alerts:</strong> <span style={{color:"#f59e0b"}}>In-app only</span></p>
        <button>Manage</button>
      </section>
      <section className="card">
        <h3>Security</h3>
        <p><strong>Password:</strong> Changed 30 days ago</p>
        <p><strong>2FA:</strong> <span style={{color:"#ef4444"}}>Disabled</span></p>
        <button>Change Password</button>
        <button style={{marginLeft:"0.5rem"}}>Enable 2FA</button>
      </section>
      <section className="card">
        <h3>Billing &amp; Payouts</h3>
        <p><strong>Payment:</strong> Visa •••• 4242</p>
        <p><strong>Payout:</strong> <span style={{color:"#f59e0b"}}>Not configured</span></p>
        <button>Manage Billing</button>
        <button style={{marginLeft:"0.5rem"}}>Set Up Payouts</button>
      </section>
    </div>
  );
}
