import { notFound } from "next/navigation";
import { jobs } from "../../../lib/mock";

type JobDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const job = jobs.find((job) => job.id === id);

  if (!job) {
    notFound();
  }

  return (
    <section className="card">
      <h2>{job.title}</h2>
      <p>
        <strong>Budget:</strong> {job.budget}
      </p>
      <p>Responsibilities, milestones, and proposals would be shown here.</p>
    </section>
  );
}
