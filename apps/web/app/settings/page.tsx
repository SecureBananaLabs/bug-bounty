export default function SettingsPage() {
  return (
    <section>
      <div className="settingsHeader">
        <div>
          <h2>Settings</h2>
          <p>Freelancer profile, notifications, security, and billing defaults.</p>
        </div>
        <button className="settingsButton" type="button">Save changes</button>
      </div>

      <div className="settingsGrid">
        <article className="card settingsPanel">
          <div className="settingsPanelHeader">
            <h3>Profile Visibility</h3>
            <span className="statusBadge">Public</span>
          </div>
          <label className="fieldGroup">
            Display name
            <input defaultValue="Maya Dev Studio" />
          </label>
          <label className="fieldGroup">
            Marketplace status
            <select defaultValue="available">
              <option value="available">Available for projects</option>
              <option value="limited">Limited availability</option>
              <option value="hidden">Hidden from search</option>
            </select>
          </label>
          <label className="checkRow">
            <input defaultChecked type="checkbox" />
            Show hourly rate on public profile
          </label>
        </article>

        <article className="card settingsPanel">
          <div className="settingsPanelHeader">
            <h3>Notifications</h3>
            <span className="statusBadge">3 enabled</span>
          </div>
          <label className="checkRow">
            <input defaultChecked type="checkbox" />
            Proposal and shortlist updates
          </label>
          <label className="checkRow">
            <input defaultChecked type="checkbox" />
            New direct messages
          </label>
          <label className="checkRow">
            <input defaultChecked type="checkbox" />
            Billing and payout alerts
          </label>
        </article>

        <article className="card settingsPanel">
          <div className="settingsPanelHeader">
            <h3>Security</h3>
            <span className="statusBadge warning">Review</span>
          </div>
          <div className="settingsRow">
            <span>Password</span>
            <strong>Updated 42 days ago</strong>
          </div>
          <div className="settingsRow">
            <span>Two-factor authentication</span>
            <strong>Not enabled</strong>
          </div>
          <button className="settingsButton secondary" type="button">Enable 2FA</button>
        </article>

        <article className="card settingsPanel">
          <div className="settingsPanelHeader">
            <h3>Billing Defaults</h3>
            <span className="statusBadge">Verified</span>
          </div>
          <label className="fieldGroup">
            Default currency
            <select defaultValue="usd">
              <option value="usd">USD</option>
              <option value="eur">EUR</option>
              <option value="gbp">GBP</option>
            </select>
          </label>
          <div className="settingsRow">
            <span>Payout method</span>
            <strong>Bank ending 4821</strong>
          </div>
          <button className="settingsButton secondary" type="button">Update billing</button>
        </article>
      </div>
    </section>
  );
}
