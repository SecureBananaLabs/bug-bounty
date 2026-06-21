import Link from "next/link";
import { jobs, freelancers } from "../../../lib/mock";

const milestones = [
  { id: "ms-1", jobTitle: "Build an AI customer support widget", amount: 750, due: "2024-06-20", status: "Pending" },
  { id: "ms-2", jobTitle: "Migrate legacy API to Node.js", amount: 1400, due: "2024-06-30", status: "Pending" }
];

export default function ClientDashboardPage() {
  return (
    <section>
      <h2>Dashboard (Client)</h2>

      <h3>Active Jobs</h3>
      <div className="grid">
        {jobs.map((job) => (
          <article className="card" key={job.id}>
            <h4>{job.title}</h4>
            <p>{job.budget}</p>
            <Link href={`/jobs/${job.id}`}>View</Link>
          </article>
        ))}
      </div>

      <h3>Shortlisted Freelancers</h3>
      <div className="grid">
        {freelancers.map((f) => (
          <article className="card" key={f.username}>
            <h4>{f.username}</h4>
            <p>{f.skills.join(" · ")}</p>
            <p>{f.rate}</p>
          </article>
        ))}
      </div>

      <h3>Payment Milestones</h3>
      <div className="grid">
        {milestones.map((ms) => (
          <article className="card" key={ms.id}>
            <h4>{ms.jobTitle}</h4>
            <p>${ms.amount.toLocaleString()} — due {ms.due}</p>
            <p><strong>{ms.status}</strong></p>
          </article>
        ))}
      </div>
    </section>
  );
}
