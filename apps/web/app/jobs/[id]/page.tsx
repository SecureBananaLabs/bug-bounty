import { notFound } from "next/navigation";
import { jobs } from "../../../lib/mock";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = jobs.find((j) => j.id === params.id);
  if (!job) {
    notFound();
  }

  return (
    <section className="card">
      <h2>Job Detail</h2>
      <p>Viewing details for <strong>{job.title}</strong>.</p>
      <p>Budget: <strong>{job.budget}</strong></p>
      <p>Responsibilities, milestones, and proposals would be shown here.</p>
    </section>
  );
}
