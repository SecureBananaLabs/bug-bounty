export default function SettingsPage() {
  const accountActions = [
    {
      title: "Profile details",
      description: "Update your display name, headline, location, and public freelancer summary.",
      action: "Edit profile",
    },
    {
      title: "Email address",
      description: "Manage the email used for sign-in, client messages, receipts, and payout updates.",
      action: "Change email",
    },
    {
      title: "Password",
      description: "Refresh your password and review the last account security update.",
      action: "Update password",
    },
  ];

  const preferences = [
    "Show my freelancer profile in marketplace search",
    "Allow clients to invite me to private jobs",
    "Send weekly project and proposal summaries",
  ];

  return (
    <section className="settings-page">
      <div className="card settings-header">
        <div>
          <p className="eyebrow">Account</p>
          <h2>Settings</h2>
          <p>Manage profile visibility, sign-in security, notifications, and account lifecycle controls.</p>
        </div>
        <button type="button" className="primary-action">Save changes</button>
      </div>

      <div className="settings-grid">
        <section className="card settings-panel">
          <h3>Account controls</h3>
          <div className="action-list">
            {accountActions.map((item) => (
              <article className="action-row" key={item.title}>
                <div>
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                </div>
                <button type="button">{item.action}</button>
              </article>
            ))}
          </div>
        </section>

        <section className="card settings-panel">
          <h3>Preferences</h3>
          <div className="toggle-list">
            {preferences.map((item) => (
              <label className="toggle-row" key={item}>
                <span>{item}</span>
                <input type="checkbox" defaultChecked />
              </label>
            ))}
          </div>
        </section>

        <section className="card settings-panel">
          <h3>Security</h3>
          <dl className="status-list">
            <div>
              <dt>Two-factor authentication</dt>
              <dd>Not enabled</dd>
            </div>
            <div>
              <dt>Active sessions</dt>
              <dd>1 current browser</dd>
            </div>
            <div>
              <dt>Data export</dt>
              <dd>Available on request</dd>
            </div>
          </dl>
          <div className="button-row">
            <button type="button">Enable 2FA</button>
            <button type="button">Review sessions</button>
          </div>
        </section>

        <section className="card settings-panel danger-zone">
          <h3>Danger zone</h3>
          <p>Deactivate marketplace visibility or close the account after resolving open contracts and invoices.</p>
          <div className="button-row">
            <button type="button">Pause profile</button>
            <button type="button" className="danger-action">Close account</button>
          </div>
        </section>
      </div>
    </section>
  );
}
