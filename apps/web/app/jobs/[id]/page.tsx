import { jobs } from "../../../lib/mock";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = jobs.find((entry) => entry.id === params.id);

  return (
    <section className="card">
      <h2>Job Detail</h2>
      {job ? (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <p>{job.title}</p>
          <p>{job.budget}</p>
          <p>{job.description}</p>
        </div>
      ) : (
        <p>Job not found</p>
      )}
    </section>
  );
}
