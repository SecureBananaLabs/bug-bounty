import Link from "next/link";
import { jobs } from "../../../lib/mock";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = jobs.find((candidate) => candidate.id === id);

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
      <p>Job ID: <strong>{job.id}</strong></p>
      <h2>{job.title}</h2>
      <p>Budget: <strong>{job.budget}</strong></p>
      <p>Review the project scope, milestones, and proposals for this mock listing.</p>
      <Link href="/jobs">Back to job listings</Link>
    </section>
  );
}
