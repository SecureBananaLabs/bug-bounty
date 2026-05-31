import { findJobById } from "../../../lib/mock";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = findJobById(params.id);

  if (!job) {
    return (
      <section className="card">
        <h2>Job not found</h2>
        <p>No job matches <strong>{params.id}</strong>.</p>
        <p>Return to the job listings to choose an active project.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{job.title}</h2>
      <p><strong>Budget:</strong> {job.budget}</p>
      <p>{job.summary}</p>
      <p>Responsibilities, milestones, and proposals for <strong>{job.id}</strong> would be shown here.</p>
    </section>
  );
}
