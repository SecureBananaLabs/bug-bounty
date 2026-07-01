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
        <p>No job listing matches <strong>{id}</strong>.</p>
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
