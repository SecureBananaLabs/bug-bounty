import { notFound } from "next/navigation";
import { jobs } from "../../../lib/mock";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = jobs.find((item) => item.id === params.id);

  if (!job) {
    notFound();
  }

  return (
    <section className="card">
      <p style={{ color: "#93c5fd", fontWeight: 700, margin: 0 }}>{job.client}</p>
      <h2>{job.title}</h2>
      <p style={{ color: "#c7d2fe", lineHeight: 1.6 }}>
        Budget: <strong>{job.budget}</strong>
      </p>
      <h3>Milestones</h3>
      <ul>
        {job.milestones.map((milestone) => (
          <li key={milestone}>{milestone}</li>
        ))}
      </ul>
      <a href="/jobs">Back to jobs</a>
    </section>
  );
}
