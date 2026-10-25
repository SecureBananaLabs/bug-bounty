import { jobs } from "../../../lib/mock";
import Link from "next/link";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = jobs.find((j) => j.id === params.id);

  if (!job) {
    return (
      <section className="card">
        <h2>Job not found</h2>
        <p>No job matches &quot;{params.id}&quot;.</p>
        <Link href="/jobs">← Back to jobs</Link>
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
