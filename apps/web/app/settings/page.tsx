const account = {
  name: "Maya Chen",
  email: "maya@example.com",
  avatar: "MC",
  visibility: "Public freelancer profile"
};

const notifications = [
  { label: "Email proposal updates", enabled: true },
  { label: "Push message alerts", enabled: true },
  { label: "In-app billing reminders", enabled: false }
];

const sessions = [
  { device: "Chrome on macOS", location: "Santiago, CL", lastActive: "Active now" },
  { device: "Safari on iPhone", location: "Valparaiso, CL", lastActive: "2 hours ago" }
];

const billingHistory = [
  { id: "INV-1042", label: "Freelancer Plus", amount: "$29.00", status: "Paid" },
  { id: "PAY-8821", label: "Payout to bank", amount: "$640.00", status: "Processing" }
];

function StatusPill({ enabled }: { enabled: boolean }) {
  return (
    <span style={{ color: enabled ? "#7dd3fc" : "#cbd5e1", fontWeight: 700 }}>
      {enabled ? "On" : "Off"}
    </span>
  );
}

export default function SettingsPage() {
  return (
    <main>
      <section className="card">
        <h2>Settings</h2>
        <p>Manage profile, notification, security, and billing preferences.</p>
      </section>

      <section className="card">
        <h3>Account / Profile</h3>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <p><strong>Display name:</strong> {account.name}</p>
          <p><strong>Email:</strong> {account.email}</p>
          <p><strong>Avatar:</strong> {account.avatar}</p>
          <p><strong>Visibility:</strong> {account.visibility}</p>
        </div>
      </section>

      <section className="card">
        <h3>Notifications</h3>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {notifications.map((item) => (
            <p key={item.label}>
              <strong>{item.label}:</strong> <StatusPill enabled={item.enabled} />
            </p>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Security</h3>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <p><strong>Password:</strong> Last changed 18 days ago</p>
          <p><strong>Two-factor authentication:</strong> Enabled</p>
          <div>
            <strong>Active sessions:</strong>
            <ul>
              {sessions.map((session) => (
                <li key={session.device}>
                  {session.device} - {session.location} - {session.lastActive}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="card">
        <h3>Billing / Payout</h3>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <p><strong>Payment method:</strong> Visa ending in 4242</p>
          <p><strong>Payout details:</strong> Bank transfer ending in 1188</p>
          <div>
            <strong>Billing history:</strong>
            <ul>
              {billingHistory.map((entry) => (
                <li key={entry.id}>
                  {entry.id} - {entry.label} - {entry.amount} - {entry.status}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
