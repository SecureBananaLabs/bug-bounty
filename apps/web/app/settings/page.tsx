export default function SettingsPage() {
  return (
    <div>
      <h2 style={{ marginBottom: "1.5rem" }}>Settings</h2>

      {/* Section 1: Account / Profile */}
      <section className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0 }}>Account &amp; Profile</h3>
          <span style={{ background: "#1e3a5f", color: "#60a5fa", padding: "2px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600 }}>
            Active
          </span>
        </div>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>Display Name</p>
              <p style={{ margin: 0, color: "#8893b0", fontSize: "0.875rem" }}>Alex Johnson</p>
            </div>
            <button style={{ background: "#2a3765", color: "#f2f5ff", border: "1px solid #3b4d8a", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.875rem" }}>
              Edit
            </button>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>Email</p>
              <p style={{ margin: 0, color: "#8893b0", fontSize: "0.875rem" }}>alex@example.com</p>
            </div>
            <button style={{ background: "#2a3765", color: "#f2f5ff", border: "1px solid #3b4d8a", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.875rem" }}>
              Change
            </button>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>Profile Visibility</p>
              <p style={{ margin: 0, color: "#8893b0", fontSize: "0.875rem" }}>Public — visible to all clients</p>
            </div>
            <select style={{ background: "#2a3765", color: "#f2f5ff", border: "1px solid #3b4d8a", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", fontSize: "0.875rem" }}>
              <option>Public</option>
              <option>Clients Only</option>
              <option>Private</option>
            </select>
          </div>
        </div>
      </section>

      {/* Section 2: Notifications */}
      <section className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0 }}>Notifications</h3>
          <span style={{ background: "#14532d", color: "#4ade80", padding: "2px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600 }}>
            Configured
          </span>
        </div>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {[
            { label: "Email Notifications", desc: "New messages, job updates, payment receipts", enabled: true },
            { label: "Push Notifications", desc: "Browser / mobile push alerts", enabled: true },
            { label: "In-App Alerts", desc: "Notification bell inside the dashboard", enabled: false },
            { label: "Weekly Digest", desc: "Summary of activity every Monday", enabled: true },
          ].map(({ label, desc, enabled }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>{label}</p>
                <p style={{ margin: 0, color: "#8893b0", fontSize: "0.875rem" }}>{desc}</p>
              </div>
              <div style={{
                width: "44px", height: "24px", borderRadius: "999px",
                background: enabled ? "#2563eb" : "#2a3765",
                border: "1px solid #3b4d8a", cursor: "pointer",
                display: "flex", alignItems: "center",
                padding: "2px",
              }}>
                <div style={{
                  width: "18px", height: "18px", borderRadius: "50%",
                  background: "#f2f5ff",
                  transform: enabled ? "translateX(20px)" : "translateX(0)",
                  transition: "transform 0.2s",
                }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Security */}
      <section className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0 }}>Security</h3>
          <span style={{ background: "#431407", color: "#fb923c", padding: "2px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600 }}>
            2FA Disabled
          </span>
        </div>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>Password</p>
              <p style={{ margin: 0, color: "#8893b0", fontSize: "0.875rem" }}>Last changed 45 days ago</p>
            </div>
            <button style={{ background: "#2a3765", color: "#f2f5ff", border: "1px solid #3b4d8a", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.875rem" }}>
              Change Password
            </button>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>Two-Factor Authentication</p>
              <p style={{ margin: 0, color: "#8893b0", fontSize: "0.875rem" }}>Add an extra layer of login security</p>
            </div>
            <button style={{ background: "#1d4ed8", color: "#f2f5ff", border: "none", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.875rem" }}>
              Enable 2FA
            </button>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>Active Sessions</p>
              <p style={{ margin: 0, color: "#8893b0", fontSize: "0.875rem" }}>2 devices — Chrome on macOS, Safari on iPhone</p>
            </div>
            <button style={{ background: "#7f1d1d", color: "#fca5a5", border: "1px solid #991b1b", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.875rem" }}>
              Revoke Others
            </button>
          </div>
        </div>
      </section>

      {/* Section 4: Billing / Payout */}
      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0 }}>Billing &amp; Payout</h3>
          <span style={{ background: "#14532d", color: "#4ade80", padding: "2px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600 }}>
            Connected
          </span>
        </div>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>Payment Method</p>
              <p style={{ margin: 0, color: "#8893b0", fontSize: "0.875rem" }}>Visa ending in 4242 — expires 08/2027</p>
            </div>
            <button style={{ background: "#2a3765", color: "#f2f5ff", border: "1px solid #3b4d8a", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.875rem" }}>
              Update
            </button>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>Payout Account</p>
              <p style={{ margin: 0, color: "#8893b0", fontSize: "0.875rem" }}>Bank of America ****7890 — USD</p>
            </div>
            <button style={{ background: "#2a3765", color: "#f2f5ff", border: "1px solid #3b4d8a", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.875rem" }}>
              Change
            </button>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>Billing History</p>
              <p style={{ margin: 0, color: "#8893b0", fontSize: "0.875rem" }}>Last invoice: $1,200.00 on Jun 1, 2026</p>
            </div>
            <button style={{ background: "#2a3765", color: "#f2f5ff", border: "1px solid #3b4d8a", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.875rem" }}>
              View All
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
