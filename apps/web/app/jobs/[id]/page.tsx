import Link from "next/link";
import { jobs } from "../../../lib/mock";

type JobDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const job = jobs.find((item) => item.id === id);

  if (!job) {
    return (
      <section className="card">
        <h2>Job Not Found</h2>
        <p>No active job matches <strong>{id}</strong>.</p>
        <Link href="/jobs">Back to jobs</Link>
      </section>
    );
  }

  return (
    <section className="card">
      <p>{job.category} · {job.level}</p>
      <h2>{job.title}</h2>
      <p>{job.description}</p>
      <div className="grid">
        <div>
          <strong>Budget</strong>
          <p>{job.budget}</p>
        </div>
        <div>
          <strong>Timeline</strong>
          <p>{job.duration}</p>
        </div>
        <div>
          <strong>Client</strong>
          <p>{job.client}</p>
        </div>
      </div>
      <h3>Skills</h3>
      <p>{job.skills.join(" · ")}</p>
      <Link href="/jobs">Back to jobs</Link>
    </section>
  );
}
