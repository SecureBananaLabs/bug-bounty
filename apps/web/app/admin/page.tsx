export default function AdminPanelPage() {
  const metrics = [
    { label: "Open Jobs", value: 42, color: "#5468ff" },
    { label: "Active Freelancers", value: 185, color: "#22c55e" },
    { label: "Flagged Accounts", value: 3, color: "#ef4444" },
    { label: "Monthly Volume ($)", value: "128,900", color: "#f59e0b" },
  ];

  const flagged = [
    { id: "usr_001", email: "spammer@test.com", reason: "Repeated spam bids" },
    { id: "usr_002", email: "fake@example.com", reason: "Identity mismatch" },
    { id: "usr_003", email: "bot@example.com", reason: "Automated activity" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h2>Admin Panel</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem" }}>
        {metrics.map((m) => (
          <section key={m.label} className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: m.color }}>{m.value}</div>
            <div style={{ fontSize: "0.85rem", color: "#666" }}>{m.label}</div>
          </section>
        ))}
      </div>

      <section className="card">
        <h3>🚩 Flagged Accounts</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: "1px solid #ddd" }}>
            <th style={{ textAlign: "left", padding: "0.4rem" }}>ID</th>
            <th style={{ textAlign: "left", padding: "0.4rem" }}>Email</th>
            <th style={{ textAlign: "left", padding: "0.4rem" }}>Reason</th>
            <th style={{ textAlign: "left", padding: "0.4rem" }}>Actions</th>
          </tr></thead>
          <tbody>{flagged.map((u) => (
            <tr key={u.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "0.4rem", fontFamily: "monospace", fontSize: "0.85rem" }}>{u.id}</td>
              <td style={{ padding: "0.4rem" }}>{u.email}</td>
              <td style={{ padding: "0.4rem" }}>{u.reason}</td>
              <td style={{ padding: "0.4rem" }}>
                <button style={{ marginRight: "0.5rem" }}>Review</button>
                <button style={{ color: "#ef4444" }}>Suspend</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </section>

      <section className="card">
        <h3>🔧 Platform Controls</h3>
        <p><strong>Job posting:</strong> <span style={{ color: "#22c55e" }}>Open</span> <button style={{ marginLeft: "0.5rem" }}>Toggle</button></p>
        <p><strong>New registrations:</strong> <span style={{ color: "#22c55e" }}>Enabled</span> <button style={{ marginLeft: "0.5rem" }}>Toggle</button></p>
        <p><strong>Maintenance mode:</strong> <span style={{ color: "#22c55e" }}>Off</span> <button style={{ marginLeft: "0.5rem" }}>Activate</button></p>
      </section>
    </div>
  );
}
