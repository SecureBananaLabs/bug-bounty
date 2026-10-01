export default function SettingsPage() {
  return (
    <section>
      <h2>Settings</h2>

      <form className="grid">
        <fieldset className="card" style={{ borderStyle: "solid" }}>
          <legend>Account</legend>
          <label>
            Display name
            <input name="displayName" defaultValue="Maya Chen" />
          </label>
          <label>
            Email
            <input name="email" type="email" defaultValue="maya@example.com" />
          </label>
          <label>
            Time zone
            <select name="timezone" defaultValue="America/New_York">
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </select>
          </label>
        </fieldset>

        <fieldset className="card" style={{ borderStyle: "solid" }}>
          <legend>Profile visibility</legend>
          <label>
            <input name="publicProfile" type="checkbox" defaultChecked />
            Public freelancer profile
          </label>
          <label>
            <input name="showRate" type="checkbox" defaultChecked />
            Show hourly rate
          </label>
          <label>
            <input name="availableForWork" type="checkbox" defaultChecked />
            Available for new projects
          </label>
        </fieldset>

        <fieldset className="card" style={{ borderStyle: "solid" }}>
          <legend>Notifications</legend>
          <label>
            <input name="proposalEmails" type="checkbox" defaultChecked />
            Proposal emails
          </label>
          <label>
            <input name="messageAlerts" type="checkbox" defaultChecked />
            Message alerts
          </label>
          <label>
            <input name="billingUpdates" type="checkbox" />
            Billing updates
          </label>
        </fieldset>

        <fieldset className="card" style={{ borderStyle: "solid" }}>
          <legend>Security</legend>
          <label>
            Current password
            <input name="currentPassword" type="password" />
          </label>
          <label>
            New password
            <input name="newPassword" type="password" />
          </label>
          <label>
            <input name="twoFactor" type="checkbox" />
            Require two-factor login
          </label>
        </fieldset>

        <div className="card" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button type="submit">Save changes</button>
          <button type="reset">Reset</button>
        </div>
      </form>
    </section>
  );
}
