import Link from "next/link";

export default function SettingsPage() {
  const user = {
    name: "Alex Doe",
    email: "alex@example.com",
    profileVisible: true,
    verified: true,
  };

  const notifications = {
    email: true,
    push: false,
    weeklySummary: true,
  };

  const security = {
    twoFactor: false,
    lastPasswordChange: "2026-05-01",
  };

  const payout = { method: "PayPal", defaultAccount: true };

  const chip = (text: string, opts?: { bg?: string }) => (
    <span
      style={{
        display: "inline-block",
        padding: "0.25rem 0.5rem",
        borderRadius: 9999,
        background: opts?.bg ?? "#132033",
        border: "1px solid #2a3765",
        fontSize: "0.85rem",
        marginLeft: "0.5rem",
      }}
    >
      {text}
    </span>
  );

  return (
    <main>
      <h2>Settings</h2>
      <p className="muted">Account preferences, profile visibility, and security controls.</p>

      <div className="grid">
        <article className="card">
          <h3>Account</h3>
          <p>
            <strong>{user.name}</strong>
            <br />
            {user.email}
          </p>
          <p>
            Profile: {user.profileVisible ? "Public" : "Private"}
            {user.profileVisible ? chip("Visible") : chip("Hidden", { bg: "#331522" })}
            {user.verified && chip("Verified", { bg: "#163b22" })}
          </p>
          <div style={{ marginTop: "0.5rem" }}>
            <Link href="#">Manage profile</Link>
            <span style={{ marginLeft: "1rem" }} />
            <button style={{ marginLeft: "0.5rem" }}>Edit account</button>
          </div>
        </article>

        <article className="card">
          <h3>Notifications</h3>
          <p>Email notifications: {notifications.email ? "On" : "Off"} {notifications.email && chip("Enabled", { bg: "#163b22" })}</p>
          <p>Push notifications: {notifications.push ? "On" : "Off"} {notifications.push ? chip("Enabled", { bg: "#163b22" }) : chip("Disabled", { bg: "#331522" })}</p>
          <p>Weekly summary: {notifications.weeklySummary ? "Subscribed" : "Unsubscribed"} {notifications.weeklySummary && chip("Subscribed")}</p>
          <div style={{ marginTop: "0.5rem" }}>
            <button>Manage notification settings</button>
          </div>
        </article>

        <article className="card">
          <h3>Security</h3>
          <p>Two-factor authentication: {security.twoFactor ? "Enabled" : "Disabled"} {security.twoFactor ? chip("On", { bg: "#163b22" }) : chip("Off", { bg: "#331522" })}</p>
          <p>Last password change: {security.lastPasswordChange}</p>
          <div style={{ marginTop: "0.5rem" }}>
            <button>Enable 2FA</button>
            <span style={{ marginLeft: "1rem" }} />
            <button>Change password</button>
          </div>
        </article>

        <article className="card">
          <h3>Billing & Payout</h3>
          <p>Default payout method: {payout.method} {payout.defaultAccount && chip("Default", { bg: "#163b22" })}</p>
          <p>Billing preferences: Automatic invoices</p>
          <div style={{ marginTop: "0.5rem" }}>
            <button>Manage payout methods</button>
          </div>
        </article>
      </div>
    </main>
  );
}
