import { jobs } from "../../../lib/mock";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = jobs.find(j => j.id === params.id);
  
  if (!job) {
    return (
      <section className="card">
        <h2>Job Detail</h2>
        <p>Job <strong>{params.id}</strong> not found.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Job Detail</h2>
      <p>Viewing details for <strong>{job.title}</strong>.</p>
      <p>Budget: {job.budget}</p>
      <p>Responsibilities, milestones, and proposals would be shown here.</p>
    </section>
  );
}
