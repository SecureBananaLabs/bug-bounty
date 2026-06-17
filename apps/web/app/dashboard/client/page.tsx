"use client";
import { jobs } from "../../lib/mock";

const MOCK_MILESTONES = [
  { job: "Build an AI customer support widget", milestone: "Design mockups",     due: "Jun 20", status: "in_progress" },
  { job: "Migrate legacy API to Node.js",       milestone: "Schema migration",   due: "Jun 25", status: "pending" },
  { job: "Design SaaS onboarding flows",        milestone: "Final delivery",     due: "Jul 1",  status: "pending" },
];

const MOCK_SHORTLISTED = [
  { username: "maya-dev",   skills: ["Next.js", "TypeScript"], rate: "$65/hr" },
  { username: "jordan-ux",  skills: ["Figma", "UX Research"],  rate: "$52/hr" },
];

export default function ClientDashboardPage() {
  return (
    <main style={{ padding: "1.5rem", maxWidth: 1000, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1>Client Dashboard</h1>

      {/* Stats */}
      <section style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        {[["Active Jobs", jobs.length], ["Pending Milestones", MOCK_MILESTONES.filter(m => m.status === "pending").length], ["Shortlisted", MOCK_SHORTLISTED.length]].map(([label, val]) => (
          <div key={label as string} className="card" style={{ minWidth: 140, textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: "bold" }}>{val}</div>
            <div>{label}</div>
          </div>
        ))}
      </section>

      {/* Active Jobs */}
      <section className="card" aria-label="Active jobs">
        <h2>Active Jobs</h2>
        {jobs.map(j => (
          <div key={j.id} style={{ padding: "0.5rem 0", borderBottom: "1px solid #eee" }}>
            <strong>{j.title}</strong> — <span style={{ color: "#666" }}>{j.budget}</span>
          </div>
        ))}
      </section>

      {/* Milestones */}
      <section className="card" aria-label="Payment milestones" style={{ marginTop: "1rem" }}>
        <h2>Payment Milestones</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Job","Milestone","Due","Status"].map(h =>
            <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "0.4rem" }}>{h}</th>
          )}</tr></thead>
          <tbody>{MOCK_MILESTONES.map((m, i) => (
            <tr key={i}>
              <td style={{ padding: "0.4rem" }}>{m.job}</td>
              <td style={{ padding: "0.4rem" }}>{m.milestone}</td>
              <td style={{ padding: "0.4rem" }}>{m.due}</td>
              <td style={{ padding: "0.4rem", color: m.status === "in_progress" ? "#5468ff" : "#888" }}>{m.status}</td>
            </tr>
          ))}</tbody>
        </table>
      </section>

      {/* Shortlisted */}
      <section className="card" aria-label="Shortlisted freelancers" style={{ marginTop: "1rem" }}>
        <h2>Shortlisted Freelancers</h2>
        {MOCK_SHORTLISTED.map(f => (
          <div key={f.username} style={{ padding: "0.5rem 0", borderBottom: "1px solid #eee" }}>
            <strong>{f.username}</strong> — {f.skills.join(", ")} — <span style={{ color: "#5468ff" }}>{f.rate}</span>
          </div>
        ))}
      </section>
    </main>
  );
}
