import { notFound } from "next/navigation";
import { findJobById, jobs } from "../../../lib/mock";

export function generateStaticParams() {
  return jobs.map((job) => ({ id: job.id }));
}

type JobDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const job = findJobById(id);

  if (!job) {
    notFound();
  }

  return (
    <section className="card">
      <h2>{job.title}</h2>
      <p>{job.description}</p>
      <p>
        Budget: <strong>{job.budget}</strong>
      </p>
    </section>
  );
}
