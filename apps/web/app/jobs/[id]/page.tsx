import Link from "next/link";
import { jobs } from "../../../lib/mock";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = jobs.find((entry) => entry.id === params.id);

  if (!job) {
    return (
      <section className="card">
        <h2>Job not found</h2>
        <p>No mock job matches <strong>{params.id}</strong>.</p>
        <p>Return to the listings to choose one of the seeded demo jobs.</p>
        <Link href="/jobs">Back to job listings</Link>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{job.title}</h2>
      <p><strong>Budget:</strong> {job.budget}</p>
      <p>{job.summary}</p>
      <div>
        <h3>Milestones</h3>
        <ul>
          {job.milestones.map((milestone) => (
            <li key={milestone}>{milestone}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
