import Link from "next/link";
import { freelancers, jobs } from "../lib/mock";

const metrics = [
  ["Open projects", jobs.length.toString()],
  ["Vetted freelancers", freelancers.length.toString()],
  ["Average budget", "$1.7k"]
];

const actions = [
  ["Post a job", "/jobs/post"],
  ["Browse projects", "/jobs"],
  ["Find freelancers", "/freelancers/search"],
  ["Open messages", "/messaging"]
];

export default function HomePage() {
  return (
    <section className="home-stack">
      <div className="hero-panel">
        <div>
          <p className="eyebrow">FreelanceFlow marketplace</p>
          <h2>Plan, hire, and move project work forward from one place.</h2>
          <p className="lede">
            Review active projects, compare available talent, and jump into the
            client workflows already available in the app.
          </p>
          <div className="action-row">
            {actions.map(([label, href]) => (
              <Link key={href} href={href} className="action-link">
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="metric-grid" aria-label="Marketplace summary">
          {metrics.map(([label, value]) => (
            <div className="metric-card" key={label}>
              <span>{value}</span>
              <small>{label}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="home-grid">
        <section>
          <div className="section-heading">
            <h3>Featured projects</h3>
            <Link href="/jobs">View all</Link>
          </div>
          <div className="stack-list">
            {jobs.slice(0, 3).map((job) => (
              <Link href={`/jobs/${job.id}`} className="card compact-card" key={job.id}>
                <strong>{job.title}</strong>
                <span>{job.budget}</span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="section-heading">
            <h3>Available talent</h3>
            <Link href="/freelancers/search">Search</Link>
          </div>
          <div className="stack-list">
            {freelancers.map((freelancer) => (
              <Link
                href={`/freelancers/${freelancer.username}`}
                className="card compact-card"
                key={freelancer.username}
              >
                <strong>{freelancer.username}</strong>
                <span>{freelancer.skills.join(" · ")} · {freelancer.rate}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
