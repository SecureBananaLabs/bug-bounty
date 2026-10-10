import Link from "next/link";

export default function ClientDashboardPage() {
  const jobs = [
    { id: "job-101", title: "Build an AI customer support widget", status: "Open", proposals: 4, budget: "$1,500" },
    { id: "job-102", title: "Migrate legacy API to Node.js", status: "In Progress", proposals: 1, budget: "$2,800" },
    { id: "job-103", title: "Design SaaS onboarding flows", status: "Closed", proposals: 7, budget: "$900" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h2>Client Dashboard</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" }}>
        <section className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#5468ff" }}>3</div>
          <div style={{ color: "#666" }}>Active Jobs</div>
        </section>
        <section className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#22c55e" }}>12</div>
          <div style={{ color: "#666" }}>Total Proposals</div>
        </section>
        <section className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#f59e0b" }}>$5,200</div>
          <div style={{ color: "#666" }}>Total Spent</div>
        </section>
      </div>

      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3>My Jobs</h3>
          <Link href="/jobs/post" className="card" style={{ padding: "0.4rem 0.8rem", background: "#5468ff", color: "white" }}>+ Post Job</Link>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "0.5rem" }}>
          <thead><tr style={{ borderBottom: "1px solid #ddd" }}>
            <th style={{ textAlign: "left", padding: "0.4rem" }}>Title</th>
            <th style={{ textAlign: "left", padding: "0.4rem" }}>Budget</th>
            <th style={{ textAlign: "left", padding: "0.4rem" }}>Proposals</th>
            <th style={{ textAlign: "left", padding: "0.4rem" }}>Status</th>
          </tr></thead>
          <tbody>{jobs.map((j) => (
            <tr key={j.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "0.4rem" }}><Link href={`/jobs/${j.id}`}>{j.title}</Link></td>
              <td style={{ padding: "0.4rem" }}>{j.budget}</td>
              <td style={{ padding: "0.4rem" }}>{j.proposals}</td>
              <td style={{ padding: "0.4rem", color: j.status === "Open" ? "#22c55e" : j.status === "In Progress" ? "#5468ff" : "#999" }}>{j.status}</td>
            </tr>
          ))}</tbody>
        </table>
      </section>
    </div>
  );
}
