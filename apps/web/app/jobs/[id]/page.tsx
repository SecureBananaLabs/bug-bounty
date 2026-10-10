import { jobs } from "../../lib/mock";
import { findJobById } from "../../lib/jobLookup.mjs";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = findJobById(jobs, params.id);

  if (!job) {
    return (
      <section className="card">
        <h2>Job not found</h2>
        <p>No job matches the id <strong>{params.id}</strong>.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{job.title}</h2>
      <p>{job.budget}</p>
      <p>Job id: <strong>{job.id}</strong></p>
    </section>
  );
}
