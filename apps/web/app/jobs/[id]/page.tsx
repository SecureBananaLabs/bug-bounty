import { notFound } from "next/navigation";

import { jobs } from "../../../lib/mock";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = jobs.find((entry) => entry.id === params.id);

  if (!job) {
    notFound();
  }

  return (
    <section className="card">
      <h2>{job.title}</h2>
      <p>
        Job ID: <strong>{job.id}</strong>
      </p>
      <p>Budget: {job.budget}</p>
      <p>Responsibilities, milestones, and proposals would be shown here.</p>
    </section>
  );
}
