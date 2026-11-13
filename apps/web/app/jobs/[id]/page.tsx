import { jobs } from "../../../lib/mock";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = jobs.find((item) => item.id === id);

  if (!job) {
    return (
      <section className="card">
        <h2>Job Not Found</h2>
        <p>No active job matches <strong>{id}</strong>.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{job.title}</h2>
      <p>Budget: <strong>{job.budget}</strong></p>
      <p>Responsibilities, milestones, and proposals would be shown here.</p>
    </section>
  );
}
