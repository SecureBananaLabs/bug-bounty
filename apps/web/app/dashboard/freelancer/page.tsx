import Link from "next/link";
import { freelancerDashboard } from "../../../lib/mock";

export default function FreelancerDashboardPage() {
  return (
    <section className="dashboard">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Freelancer workspace</p>
          <h2>Work pipeline</h2>
          <p className="muted">Manage proposal status, active client work, response priorities, and earnings.</p>
        </div>
        <div className="dashboard-actions">
          <Link className="button-link" href="/jobs">Find jobs</Link>
          <Link className="button-link secondary" href="/messaging">Messages</Link>
        </div>
      </div>

      <div className="metric-grid">
        {freelancerDashboard.metrics.map((metric) => (
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
            <h3>Proposal queue</h3>
            <Link href="/jobs">Browse jobs</Link>
          </div>
          <div className="stack">
            {freelancerDashboard.proposalQueue.map((proposal) => (
              <article className="card list-card" key={proposal.jobId}>
                <div>
                  <h4>{proposal.title}</h4>
                  <p>{proposal.nextStep}</p>
                </div>
                <dl>
                  <div>
                    <dt>Status</dt>
                    <dd>{proposal.status}</dd>
                  </div>
                </dl>
                <Link href={proposal.href}>Open job</Link>
              </article>
            ))}
          </div>
        </section>

        <aside>
          <div className="section-heading">
            <h3>Active work</h3>
            <Link href="/messaging">Contact clients</Link>
          </div>
          <div className="stack">
            {freelancerDashboard.activeWork.map((work) => (
              <article className="card compact-card" key={work.title}>
                <h4>{work.title}</h4>
                <p>{work.client}</p>
                <div className="split-row">
                  <span>{work.status}</span>
                  <span>{work.due}</span>
                </div>
                <Link href={work.href}>Continue</Link>
              </article>
            ))}
          </div>
        </aside>
      </div>

      <section>
        <div className="section-heading">
          <h3>Earnings</h3>
          <Link href="/billing">Payouts</Link>
        </div>
        <div className="grid">
          {freelancerDashboard.earnings.map((item) => (
            <article className="card compact-card" key={item.label}>
              <h4>{item.label}</h4>
              <strong>{item.amount}</strong>
              <p>{item.status}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
