import { jobs } from "../../../lib/mock";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = jobs.find((item) => item.id === params.id);

  if (!job) {
    return (
      <section className="card">
        <h2>Job not found</h2>
        <p>No mock job exists for <strong>{params.id}</strong>.</p>
        <p>Return to the job listings to choose an available project.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{job.title}</h2>
      <p><strong>Budget:</strong> {job.budget}</p>
      <p>{job.brief}</p>
      <p><strong>Estimated timeline:</strong> {job.timeline}</p>
    </section>
  );
}
