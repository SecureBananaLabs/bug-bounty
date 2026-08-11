import { notFound } from "next/navigation";
import { jobs } from "../../../lib/mock";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = jobs.find((item) => item.id === params.id);

  if (!job) {
    notFound();
  }

  return (
    <section className="card">
      <h2>{job.title}</h2>
      <p>{job.budget}</p>
      <p>Responsibilities, milestones, and proposals for <strong>{job.id}</strong>.</p>
    </section>
  );
}
