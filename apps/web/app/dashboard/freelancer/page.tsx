export default function FreelancerDashboardPage() {
  const proposals = [
    { job: "Build an AI customer support widget", status: "Pending", bid: "$1,200", submitted: "2026-06-10" },
    { job: "Migrate legacy API to Node.js", status: "Accepted", bid: "$2,500", submitted: "2026-06-14" },
    { job: "Design SaaS onboarding flows", status: "Rejected", bid: "$800", submitted: "2026-06-12" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h2>Freelancer Dashboard</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" }}>
        <section className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#5468ff" }}>3</div>
          <div style={{ color: "#666" }}>Active Proposals</div>
        </section>
        <section className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#22c55e" }}>$3,700</div>
          <div style={{ color: "#666" }}>Total Earned</div>
        </section>
        <section className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#f59e0b" }}>92%</div>
          <div style={{ color: "#666" }}>Response Rate</div>
        </section>
      </div>

      <section className="card">
        <h3>My Proposals</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: "1px solid #ddd" }}>
            <th style={{ textAlign: "left", padding: "0.4rem" }}>Job</th>
            <th style={{ textAlign: "left", padding: "0.4rem" }}>Bid</th>
            <th style={{ textAlign: "left", padding: "0.4rem" }}>Status</th>
            <th style={{ textAlign: "left", padding: "0.4rem" }}>Submitted</th>
          </tr></thead>
          <tbody>{proposals.map((p) => (
            <tr key={p.job} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "0.4rem" }}>{p.job}</td>
              <td style={{ padding: "0.4rem" }}>{p.bid}</td>
              <td style={{ padding: "0.4rem", color: p.status === "Accepted" ? "#22c55e" : p.status === "Rejected" ? "#ef4444" : "#f59e0b" }}>{p.status}</td>
              <td style={{ padding: "0.4rem", fontSize: "0.85rem", color: "#666" }}>{p.submitted}</td>
            </tr>
          ))}</tbody>
        </table>
      </section>
    </div>
  );
}
