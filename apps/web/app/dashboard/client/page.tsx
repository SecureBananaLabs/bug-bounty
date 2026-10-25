import { jobs } from "../../../lib/mock";

const mockMilestones = [
  { jobId: "job-101", title: "Initial prototype", status: "Completed", amount: "$500" },
  { jobId: "job-102", title: "API migration v1", status: "In Progress", amount: "$1,000" }
];

export default function ClientDashboardPage() {
  return (
    <section className="card">
      <h2>Dashboard (Client)</h2>
      <h3>Active Jobs</h3>
      <ul>
        {jobs.map(j => (
          <li key={j.id}><strong>{j.title}</strong> — {j.budget}</li>
        ))}
      </ul>
      <h3>Milestones</h3>
      <ul>
        {mockMilestones.map(m => (
          <li key={m.jobId + m.title}>{m.title} — {m.amount} — <em>{m.status}</em></li>
        ))}
      </ul>
    </section>
  );
}
