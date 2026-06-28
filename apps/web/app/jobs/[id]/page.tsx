import { jobs } from "@/lib/mock";
import Link from "next/link";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = jobs.find((j) => j.id === params.id);

  if (!job) {
    return (
      <section className="card">
        <h2>Job Detail</h2>
        <p>Job not found.</p>
        <Link href="/jobs">Back to jobs</Link>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Job Detail</h2>
      <p>Job ID: <strong>{job.id}</strong></p>
      <p>Title: <strong>{job.title}</strong></p>
      <p>Budget: <strong>{job.budget}</strong></p>
      <Link href="/jobs">Back to jobs</Link>
    </section>
  );
}
