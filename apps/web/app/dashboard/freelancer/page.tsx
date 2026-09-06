"use client";

const MOCK_PROPOSALS = [
  { job: "Build an AI customer support widget", bid: "$1,200", status: "pending",  submitted: "Jun 15" },
  { job: "Migrate legacy API to Node.js",       bid: "$2,500", status: "accepted", submitted: "Jun 10" },
  { job: "Design SaaS onboarding flows",        bid: "$800",   status: "rejected", submitted: "Jun 08" },
];

const MOCK_EARNINGS = [
  { month: "April 2026",  amount: "$3,200" },
  { month: "May 2026",    amount: "$4,100" },
  { month: "June 2026",   amount: "$1,500" },
];

const STATUS_COLOR: Record<string, string> = { pending: "#888", accepted: "green", rejected: "#e55" };

export default function FreelancerDashboardPage() {
  const totalEarned = "$8,800";
  const responseRate = "92%";

  return (
    <main style={{ padding: "1.5rem", maxWidth: 1000, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1>Freelancer Dashboard</h1>

      {/* Stats */}
      <section style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        {[["Total Earned", totalEarned], ["Active Jobs", "1"], ["Response Rate", responseRate], ["Proposals", MOCK_PROPOSALS.length]].map(([label, val]) => (
          <div key={label as string} className="card" style={{ minWidth: 140, textAlign: "center" }}>
            <div style={{ fontSize: "1.8rem", fontWeight: "bold" }}>{val}</div>
            <div>{label}</div>
          </div>
        ))}
      </section>

      {/* Proposals */}
      <section className="card" aria-label="Proposals">
        <h2>My Proposals</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Job","Bid","Submitted","Status"].map(h =>
            <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "0.4rem" }}>{h}</th>
          )}</tr></thead>
          <tbody>{MOCK_PROPOSALS.map((p, i) => (
            <tr key={i}>
              <td style={{ padding: "0.4rem" }}>{p.job}</td>
              <td style={{ padding: "0.4rem", fontWeight: "bold" }}>{p.bid}</td>
              <td style={{ padding: "0.4rem", color: "#888" }}>{p.submitted}</td>
              <td style={{ padding: "0.4rem", color: STATUS_COLOR[p.status], fontWeight: "bold" }}>{p.status}</td>
            </tr>
          ))}</tbody>
        </table>
      </section>

      {/* Earnings */}
      <section className="card" aria-label="Earnings history" style={{ marginTop: "1rem" }}>
        <h2>Earnings</h2>
        {MOCK_EARNINGS.map(e => (
          <div key={e.month} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid #eee" }}>
            <span>{e.month}</span>
            <strong style={{ color: "#5468ff" }}>{e.amount}</strong>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", fontWeight: "bold" }}>
          <span>Total</span><span>{totalEarned}</span>
        </div>
      </section>
    </main>
  );
}
