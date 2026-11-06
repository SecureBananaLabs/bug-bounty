import Link from "next/link";
import { jobs } from "../../../lib/mock";

type JobDetailPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return jobs.map((job) => ({ id: job.id }));
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const job = jobs.find((item) => item.id === id);

  if (!job) {
    return (
      <section className="card">
        <h2>Job Not Found</h2>
        <p>No mock job exists for <strong>{id}</strong>.</p>
        <Link href="/jobs">Back to jobs</Link>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{job.title}</h2>
      <p><strong>Budget:</strong> {job.budget}</p>
      <p>Review the project scope, milestones, and proposal activity for this mock job.</p>
      <Link href="/jobs">Back to jobs</Link>
    </section>
  );
}
