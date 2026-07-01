import Link from "next/link";
import { notFound } from "next/navigation";
import { getJobById, jobs } from "../../../lib/mock";

type JobPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return jobs.map((job) => ({ id: job.id }));
}

export default async function JobDetailPage({ params }: JobPageProps) {
  const { id } = await params;
  const job = getJobById(id);

  if (!job) {
    notFound();
  }

  return (
    <section className="card">
      <p>{job.category}</p>
      <h2>{job.title}</h2>
      <p>{job.description}</p>
      <p>
        <strong>Budget:</strong> {job.budget}
      </p>
      <p>
        <strong>Skills:</strong> {job.skills.join(", ")}
      </p>
      <Link href="/jobs">Back to jobs</Link>
    </section>
  );
}
