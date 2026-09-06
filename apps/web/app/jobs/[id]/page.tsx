import { notFound } from "next/navigation";
import { jobs } from "../../lib/mock";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  // Resolve the job from the mock store by id.
  // Previously the page displayed params.id as-is without checking whether
  // the job actually existed, so any arbitrary path like /jobs/evil would
  // render a page with no real data instead of returning 404.
  const job = jobs.find((j) => j.id === params.id);
  if (!job) {
    notFound();
  }

  return (
    <section className="card">
      <h2>Job Detail</h2>
      <p>
        <strong>{job.title}</strong>
      </p>
      <p>Budget: {job.budget}</p>
      <p>Responsibilities, milestones, and proposals would be shown here.</p>
    </section>
  );
}
