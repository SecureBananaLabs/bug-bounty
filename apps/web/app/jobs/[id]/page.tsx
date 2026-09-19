import Link from "next/link";
import { jobs } from "../../../lib/mock";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = jobs.find((item) => item.id === params.id);

  if (!job) {
    return (
      <section className="card">
        <h2>Job Not Found</h2>
        <p>No job listing matches <strong>{params.id}</strong>.</p>
        <Link href="/jobs">Back to job listings</Link>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{job.title}</h2>
      <p>{job.budget}</p>
      <p>Project id: <strong>{job.id}</strong></p>
      <p>Responsibilities, milestones, and proposals for this project would be shown here.</p>
      <Link href="/jobs">Back to job listings</Link>
    </section>
  );
}
