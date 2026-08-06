import Link from "next/link";
import { jobs } from "../../../lib/mock";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = jobs.find((item) => item.id === id);

  if (!job) {
    return (
      <section className="card">
        <h2>Job not found</h2>
        <p>No mock job matches <strong>{id}</strong>.</p>
        <p>Review the active listings to choose an available project.</p>
        <Link href="/jobs">Back to jobs</Link>
      </section>
    );
  }

  return (
    <section className="card">
      <p>{job.category}</p>
      <h2>{job.title}</h2>
      <p>{job.summary}</p>
      <p><strong>Budget:</strong> {job.budget}</p>
      <p><strong>Timeline:</strong> {job.timeline}</p>
      <p><strong>Skills:</strong> {job.skills.join(", ")}</p>
      <Link href="/jobs">Back to jobs</Link>
    </section>
  );
}
