const mockUser = {
  displayName: "Alex Johnson",
  email: "alex@example.com",
  notifications: true
};

export default function SettingsPage() {
  return (
    <section className="card">
      <h2>Settings</h2>
      <form>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="displayName"><strong>Display Name</strong></label>
          <br />
          <input
            id="displayName"
            type="text"
            defaultValue={mockUser.displayName}
            style={{ marginTop: "0.25rem", padding: "0.4rem", width: "100%", maxWidth: 300 }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="email"><strong>Email</strong></label>
          <br />
          <input
            id="email"
            type="email"
            defaultValue={mockUser.email}
            readOnly
            style={{ marginTop: "0.25rem", padding: "0.4rem", width: "100%", maxWidth: 300, background: "#f5f5f5" }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label>
            <input type="checkbox" defaultChecked={mockUser.notifications} style={{ marginRight: "0.5rem" }} />
            <strong>Email notifications</strong>
          </label>
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <button type="button" style={{ padding: "0.5rem 1rem" }}>Change Password</button>
        </div>
        <div>
          <button type="submit" style={{ padding: "0.5rem 1rem", background: "#5468ff", color: "white", border: "none", borderRadius: 6 }}>
            Save Changes
          </button>
        </div>
      </form>
    </section>
  );
}
