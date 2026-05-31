import Link from "next/link";
import { jobs } from "../../../lib/mock";

export default function FreelancerDashboardPage() {
  return (
    <section>
      <h2>Freelancer Dashboard</h2>
      <div className="grid">
        <article className="card">
          <h3>Matched opportunities</h3>
          <p>{jobs.length} jobs match marketplace demand.</p>
        </article>
        <article className="card">
          <h3>Next action</h3>
          <p>Browse open listings and prepare a focused proposal.</p>
          <Link href="/jobs">Browse jobs</Link>
        </article>
      </div>
    </section>
  );
}
