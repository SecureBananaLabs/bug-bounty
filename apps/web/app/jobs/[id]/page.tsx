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
      <p><strong>Client:</strong> {job.client}</p>
      <p><strong>Budget:</strong> {job.budget}</p>
      <p>{job.summary}</p>
      <h3>Milestones</h3>
      <ul>
        {job.milestones.map((milestone) => (
          <li key={milestone}>{milestone}</li>
        ))}
      </ul>
    </section>
  );
}
