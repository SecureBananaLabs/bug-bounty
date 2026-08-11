import Link from "next/link";
import { jobs } from "../../lib/mock";

export default function JobsPage() {
  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <h2>Job Listings</h2>
        <Link href="/jobs/post" className="card" style={{ padding: "0.55rem 0.85rem", marginBottom: 0 }}>
          Post a Job
        </Link>
      </div>
      <div className="grid">
        {jobs.map((job) => (
          <article className="card" key={job.id}>
            <h3>{job.title}</h3>
            <p>{job.budget}</p>
            <Link href={`/jobs/${job.id}`}>View details</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
