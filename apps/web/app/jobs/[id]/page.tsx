import { notFound } from "next/navigation";
import { jobs } from "../../../lib/mock";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = jobs.find((entry) => entry.id === id);

  if (!job) {
    notFound();
  }

  return (
    <section className="card">
      <h2>{job.title}</h2>
      <p>Budget: <strong>{job.budget}</strong></p>
      <p>Responsibilities, milestones, and proposals for {job.id} would be shown here.</p>
    </section>
  );
}
