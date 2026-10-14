export default function FreelancerDashboardPage() {
  const metrics = [
    { label: "Active proposals", value: "7" },
    { label: "Accepted jobs", value: "3" },
    { label: "Pending payout", value: "$2.1k" },
    { label: "Response rate", value: "94%" }
  ];

  const proposals = [
    { title: "AI support widget", client: "Northstar Labs", state: "Interview requested" },
    { title: "API migration", client: "Cedar Systems", state: "Proposal viewed" },
    { title: "Onboarding flow", client: "BrightPath", state: "Draft saved" }
  ];

  const work = [
    { title: "Analytics dashboard", milestone: "Charts pass", due: "Today" },
    { title: "Checkout QA", milestone: "Regression report", due: "Jun 2" },
    { title: "Brand refresh", milestone: "Final files", due: "Jun 5" }
  ];

  return (
    <section>
      <div className="card">
        <p className="eyebrow">Freelancer workspace</p>
        <h2>Work dashboard</h2>
        <p className="muted">
          Manage proposals, accepted jobs, earnings, and response metrics without leaving the dashboard.
        </p>
      </div>

      <div className="grid">
        {metrics.map((metric) => (
          <article className="card metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </div>

      <div className="dashboard-columns">
        <section className="card">
          <h3>Proposal activity</h3>
          <div className="stack">
            {proposals.map((proposal) => (
              <article className="row-card" key={proposal.title}>
                <div>
                  <strong>{proposal.title}</strong>
                  <p>{proposal.client}</p>
                </div>
                <span>{proposal.state}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="card">
          <h3>Accepted work</h3>
          <div className="stack">
            {work.map((item) => (
              <article className="row-card" key={item.title}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.milestone}</p>
                </div>
                <span>{item.due}</span>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="card">
        <h3>Next actions</h3>
        <div className="actions">
          <span>Send interview reply</span>
          <span>Upload milestone proof</span>
          <span>Refresh availability</span>
        </div>
      </section>
    </section>
  );
}
