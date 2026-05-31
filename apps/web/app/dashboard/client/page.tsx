import Link from "next/link";
import { jobs } from "../../../lib/mock";

export default function ClientDashboardPage() {
  return (
    <section>
      <h2>Client Dashboard</h2>
      <div className="grid">
        <article className="card">
          <h3>Open jobs</h3>
          <p>{jobs.length} active listings</p>
        </article>
        <article className="card">
          <h3>Next action</h3>
          <p>Review proposals and keep project scopes current.</p>
          <Link href="/jobs">View jobs</Link>
        </article>
      </div>
    </section>
  );
}
