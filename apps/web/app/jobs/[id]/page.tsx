import Link from "next/link";
import { notFound } from "next/navigation";
import { jobs } from "../../../lib/mock";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = jobs.find((item) => item.id === params.id);

  if (!job) {
    notFound();
  }

  return (
    <section>
      <p style={{ marginBottom: 8 }}>
        <Link href="/jobs">Back to jobs</Link>
      </p>
      <article className="card">
        <p style={{ marginTop: 0, opacity: 0.75 }}>{job.id}</p>
        <h2>{job.title}</h2>
        <p style={{ fontSize: "1.1rem" }}>{job.budget}</p>
        <p>{job.summary}</p>
        <p>Responsibilities, milestones, and proposals would be shown here.</p>
      </article>
    </section>
  );
}
