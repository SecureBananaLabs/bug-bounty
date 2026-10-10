import { notFound } from "next/navigation";
import { getJobById, jobs } from "../../../lib/mock";

type JobDetailPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return jobs.map((job) => ({ id: job.id }));
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const job = getJobById(id);

  if (!job) {
    notFound();
  }

  return (
    <section className="card">
      <h2>{job.title}</h2>
      <p>{job.summary}</p>
      <p>
        <strong>Budget:</strong> {job.budget}
      </p>
      <h3>Milestones</h3>
      <ul>
        {job.milestones.map((milestone) => (
          <li key={milestone}>{milestone}</li>
        ))}
      </ul>
    </section>
  );
}
