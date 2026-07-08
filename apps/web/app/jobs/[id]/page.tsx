import Link from "next/link";
import { jobs } from "../../../lib/mock";

type JobDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const job = jobs.find((item) => item.id === id);

  if (!job) {
    return (
      <section className="card">
        <h2>Job not found</h2>
        <p>No job listing exists for <strong>{id}</strong>.</p>
        <Link href="/jobs">Back to job listings</Link>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{job.title}</h2>
      <p><strong>Budget:</strong> {job.budget}</p>
      <p>{job.summary}</p>
      <h3>Project context</h3>
      <ul>
        {job.deliverables.map((deliverable) => (
          <li key={deliverable}>{deliverable}</li>
        ))}
      </ul>
      <Link href="/jobs">Back to job listings</Link>
    </section>
  );
}
