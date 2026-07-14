import { freelancers } from "../../lib/mock";

export default function SettingsPage() {
  const currentUser = {
    displayName: "Maya Thompson",
    email: "maya@example.com",
    notifications: true
  };

  return (
    <section className="card">
      <h2>Settings</h2>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        <label>
          <div>Display name</div>
          <input defaultValue={currentUser.displayName} />
        </label>
        <label>
          <div>Email</div>
          <input defaultValue={currentUser.email} readOnly />
        </label>
        <label>
          <div>Notification preferences</div>
          <input type="checkbox" defaultChecked={currentUser.notifications} />
          <span>Enable email updates</span>
        </label>
        <button type="button">Change password</button>
        <p>Available freelancer presets: {freelancers.length}</p>
      </div>
    </section>
  );
}
