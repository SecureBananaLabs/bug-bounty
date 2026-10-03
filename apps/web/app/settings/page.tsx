const settingsGroups = [
  {
    title: "Account / profile",
    status: "Public profile",
    description: "Profile discovery is enabled for client search and direct freelancer links.",
    controls: ["Review display name", "Update profile visibility"]
  },
  {
    title: "Notifications",
    status: "Digest enabled",
    description: "Proposal updates, direct messages, and billing alerts are grouped into a daily digest.",
    controls: ["Adjust email alerts", "Manage message reminders"]
  },
  {
    title: "Security",
    status: "Password active",
    description: "Password sign-in is enabled. Two-factor authentication is ready to configure.",
    controls: ["Change password", "Enable two-factor auth"]
  },
  {
    title: "Billing / payout",
    status: "Payout review needed",
    description: "Default invoice currency is USD. Payout details should be reviewed before accepting milestones.",
    controls: ["Review payout method", "Open billing preferences"]
  }
];

export default function SettingsPage() {
  return (
    <section className="card" aria-labelledby="settings-title">
      <h2 id="settings-title">Settings</h2>
      <p>Account preferences, profile visibility, security posture, and payout defaults.</p>

      <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
        {settingsGroups.map((group) => (
          <section
            aria-labelledby={`settings-${group.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
            key={group.title}
            style={{ borderTop: "1px solid #2a3765", paddingTop: "1rem" }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "space-between" }}>
              <h3 id={`settings-${group.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} style={{ margin: 0 }}>
                {group.title}
              </h3>
              <span
                style={{
                  border: "1px solid #5f75c8",
                  borderRadius: "999px",
                  color: "#dce5ff",
                  fontSize: "0.85rem",
                  padding: "0.2rem 0.55rem"
                }}
              >
                {group.status}
              </span>
            </div>
            <p>{group.description}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {group.controls.map((control) => (
                <button
                  key={control}
                  type="button"
                  style={{
                    background: "#22305f",
                    border: "1px solid #5f75c8",
                    borderRadius: "6px",
                    color: "#f2f5ff",
                    cursor: "pointer",
                    padding: "0.45rem 0.7rem"
                  }}
                >
                  {control}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
