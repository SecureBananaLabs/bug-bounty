import Link from "next/link";
import { jobs } from "../../../lib/mock";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = jobs.find((item) => item.id === params.id);

  if (!job) {
    return (
      <section className="card">
        <h2>Job not found</h2>
        <p>No job listing matches <strong>{params.id}</strong>.</p>
        <Link href="/jobs">Back to job listings</Link>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{job.title}</h2>
      <p><strong>Budget:</strong> {job.budget}</p>
      <p><strong>Job ID:</strong> {job.id}</p>
      <p>Responsibilities, milestones, and proposals for this listing would be shown here.</p>
      <Link href="/jobs">Back to job listings</Link>
    </section>
  );
}
