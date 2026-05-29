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
      <h3>{job.title}</h3>
      <p>Budget: {job.budget}</p>
      <p>Viewing details for <strong>{params.id}</strong>.</p>
      <p>Responsibilities, milestones, and proposals would be shown here.</p>
    </section>
  );
}
