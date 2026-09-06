import Link from "next/link";
import { jobs } from "../../lib/mock";

export default function JobsPage() {
  return (
    <section>
      <h2>Job Listings</h2>
      <p>
        <Link href="/jobs/post">Post a job</Link>
      </p>
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
