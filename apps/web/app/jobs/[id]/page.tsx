import Link from "next/link";
import { jobs } from "../../../lib/mock";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = jobs.find((candidate) => candidate.id === params.id);

  if (!job) {
    return (
      <section className="card">
        <h2>Job not found</h2>
        <p>No mock job exists for <strong>{params.id}</strong>.</p>
        <Link href="/jobs">Back to job listings</Link>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{job.title}</h2>
      <p><strong>Budget:</strong> {job.budget}</p>
      <p>{job.summary}</p>
      <p>Responsibilities, milestones, and proposals can be reviewed with the client.</p>
      <Link href="/jobs">Back to job listings</Link>
    </section>
  );
}
