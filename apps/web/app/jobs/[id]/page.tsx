import { jobs } from "@/lib/mock";
import { notFound } from "next/navigation";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = jobs.find((j) => j.id === params.id);

  if (!job) {
    notFound();
  }

  return (
    <section className="card">
      <h2>Job Detail</h2>
      <p>Project: <strong>{job.title}</strong></p>
      <p>Budget: {job.budget}</p>
      <p>Responsibilities, milestones, and proposals would be shown here.</p>
    </section>
  );
}
