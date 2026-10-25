const MOCK_JOBS = [
  { id: "job_001", title: "Build React Dashboard", status: "active", proposals: 4 },
  { id: "job_002", title: "API Integration", status: "in-progress", proposals: 2 },
  { id: "job_003", title: "UI Design System", status: "completed", proposals: 7 }
];

const MOCK_MILESTONES = [
  { id: "ms_001", project: "Build React Dashboard", amount: 500, status: "pending" },
  { id: "ms_002", project: "API Integration", amount: 300, status: "released" }
];

export default function ClientDashboardPage() {
  return (
    <section className="card">
      <h2>Dashboard (Client)</h2>

      <h3>Active Jobs</h3>
      <ul>
        {MOCK_JOBS.map(j => (
          <li key={j.id}>
            <strong>{j.title}</strong> — Status: {j.status} | Proposals: {j.proposals}
          </li>
        ))}
      </ul>

      <h3>Payment Milestones</h3>
      <ul>
        {MOCK_MILESTONES.map(m => (
          <li key={m.id}>
            {m.project} — ${m.amount} — {m.status}
          </li>
        ))}
      </ul>
    </section>
  );
}
