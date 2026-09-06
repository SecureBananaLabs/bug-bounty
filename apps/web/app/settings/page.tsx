export default function SettingsPage() {
  return (
    <section className="card">
      <h2>Settings</h2>

      <h3>Profile</h3>
      <form>
        <label htmlFor="displayName">Display Name</label>
        <input id="displayName" type="text" defaultValue="John Doe" />
        <br />
        <label htmlFor="email">Email</label>
        <input id="email" type="email" defaultValue="john@example.com" />
        <br />
        <button type="button">Save Profile</button>
      </form>

      <h3>Security</h3>
      <button type="button">Change Password</button>
      <button type="button" style={{ marginLeft: "8px" }}>Enable 2FA</button>

      <h3>Notifications</h3>
      <label>
        <input type="checkbox" defaultChecked /> Email notifications
      </label>
      <br />
      <label>
        <input type="checkbox" /> SMS notifications
      </label>

      <h3>Danger Zone</h3>
      <button type="button" style={{ color: "red" }}>Delete Account</button>
    </section>
  );
}
