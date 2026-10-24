import { jobs } from "../../../lib/mock";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = jobs.find((item) => item.id === params.id);

  if (!job) {
    return (
      <section className="card">
        <h2>Job not found</h2>
        <p>No job matches the id {params.id}.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{job.title}</h2>
      <p>{job.budget}</p>
      <p>Responsibilities, milestones, and proposals would be shown here.</p>
    </section>
  );
}
