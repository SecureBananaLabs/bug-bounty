import Link from "next/link";
import { clientDashboard } from "../../../lib/mock";

export default function ClientDashboardPage() {
  return (
    <section className="dashboard">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Client command center</p>
          <h2>Hiring overview</h2>
          <p className="muted">Track active hiring work, proposal flow, shortlist decisions, and payment milestones.</p>
        </div>
        <div className="dashboard-actions">
          <Link className="button-link" href="/jobs/post">Post job</Link>
          <Link className="button-link secondary" href="/freelancers/search">Find talent</Link>
        </div>
      </div>

      <div className="metric-grid">
        {clientDashboard.metrics.map((metric) => (
          <article className="card metric-card" key={metric.label}>
            <p className="metric-label">{metric.label}</p>
            <strong>{metric.value}</strong>
            <span>{metric.detail}</span>
          </article>
        ))}
      </div>

      <div className="dashboard-grid wide-left">
        <section>
          <div className="section-heading">
            <h3>Active jobs</h3>
            <Link href="/jobs">View all jobs</Link>
          </div>
          <div className="stack">
            {clientDashboard.activeJobs.map((job) => (
              <article className="card list-card" key={job.id}>
                <div>
                  <h4>{job.title}</h4>
                  <p>{job.nextStep}</p>
                </div>
                <dl>
                  <div>
                    <dt>Status</dt>
                    <dd>{job.status}</dd>
                  </div>
                  <div>
                    <dt>Proposals</dt>
                    <dd>{job.proposals}</dd>
                  </div>
                  <div>
                    <dt>Budget</dt>
                    <dd>{job.budget}</dd>
                  </div>
                </dl>
                <Link href={`/jobs/${job.id}`}>Open job</Link>
              </article>
            ))}
          </div>
        </section>

        <aside>
          <div className="section-heading">
            <h3>Shortlist</h3>
            <Link href="/freelancers/search">Search</Link>
          </div>
          <div className="stack">
            {clientDashboard.shortlistedFreelancers.map((freelancer) => (
              <article className="card compact-card" key={freelancer.username}>
                <h4>{freelancer.username}</h4>
                <p>{freelancer.skills.join(" · ")}</p>
                <div className="split-row">
                  <span>{freelancer.rate}</span>
                  <span>{freelancer.match}</span>
                </div>
                <Link href={`/freelancers/${freelancer.username}`}>Open profile</Link>
              </article>
            ))}
          </div>
        </aside>
      </div>

      <section>
        <div className="section-heading">
          <h3>Payment milestones</h3>
          <Link href="/billing">Billing</Link>
        </div>
        <div className="grid">
          {clientDashboard.paymentMilestones.map((milestone) => (
            <article className="card compact-card" key={milestone.label}>
              <h4>{milestone.label}</h4>
              <strong>{milestone.amount}</strong>
              <p>{milestone.status}</p>
              <Link href={milestone.href}>Review</Link>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
