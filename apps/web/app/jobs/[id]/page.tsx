import { jobs } from "../../../lib/mock";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = jobs.find((j) => j.id === params.id);

  if (!job) {
    return (
      <section className="card">
        <h2>Job Not Found</h2>
        <p>No job exists for id <strong>{params.id}</strong>.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{job.title}</h2>
      <p><strong>Budget:</strong> {job.budget}</p>
      <p><strong>Job ID:</strong> {job.id}</p>
      <p>Responsibilities, milestones, and proposals would be shown here.</p>
    </section>
  );
}
