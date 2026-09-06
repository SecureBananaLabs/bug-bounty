import { jobs } from "../../../lib/mock";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = jobs.find((item) => item.id === params.id);

  if (!job) {
    return (
      <section className="card">
        <h2>Job not found</h2>
        <p>No job listing exists for <strong>{params.id}</strong>.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Job Detail</h2>
      <h3>{job.title}</h3>
      <p>Budget: {job.budget}</p>
      <p>Responsibilities, milestones, and proposals would be shown here.</p>
    </section>
  );
}
