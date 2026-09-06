import { jobs } from "../../../lib/mock";
import Link from "next/link";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = jobs.find((j) => j.id === params.id);

  if (!job) {
    return (
      <section className="card">
        <h2>Job Not Found</h2>
        <p>No job matches <strong>{params.id}</strong>.</p>
        <Link href="/jobs">Browse jobs</Link>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{job.title}</h2>
      <p><strong>Budget:</strong> {job.budget}</p>
      <Link href="/jobs">← Back to jobs</Link>
    </section>
  );
}
