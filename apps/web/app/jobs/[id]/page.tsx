import Link from "next/link";
import { jobs } from "../../../lib/mock";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = jobs.find((item) => item.id === id);

  if (!job) {
    return (
      <section className="card">
        <h2>Job not found</h2>
        <p>No mock job exists for <strong>{id}</strong>.</p>
        <Link href="/jobs">Back to job listings</Link>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{job.title}</h2>
      <p><strong>Budget:</strong> {job.budget}</p>
      <p>{job.summary}</p>
      <h3>Milestones</h3>
      <ul>
        {job.milestones.map((milestone) => (
          <li key={milestone}>{milestone}</li>
        ))}
      </ul>
      <Link href="/jobs">Back to job listings</Link>
    </section>
  );
}
