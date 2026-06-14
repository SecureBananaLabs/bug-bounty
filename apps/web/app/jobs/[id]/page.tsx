import { jobs } from "../../lib/mock";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = jobs.find((j) => j.id === params.id);

  if (!job) {
    return (
      <section className="card">
        <h2>Job Not Found</h2>
        <p>No job matches the id <strong>{params.id}</strong>.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Job Detail</h2>
      <p style={{ fontSize: "1.2rem", fontWeight: 600 }}>{job.title}</p>
      <p style={{ fontSize: "1.1rem", color: "var(--green, #4ade80)" }}>{job.budget}</p>
      <p style={{ marginTop: 12 }}>Responsibilities, milestones, and proposals would be shown here.</p>
    </section>
  );
}
