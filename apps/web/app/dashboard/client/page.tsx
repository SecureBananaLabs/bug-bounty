export default function ClientDashboardPage() {
  const metrics = [
    { label: "Open jobs", value: "4" },
    { label: "Shortlisted", value: "12" },
    { label: "In escrow", value: "$4.2k" },
    { label: "Due this week", value: "3" }
  ];

  const jobs = [
    { title: "AI support widget", status: "Reviewing proposals", budget: "$1,500", next: "Compare 5 bids" },
    { title: "Legacy API migration", status: "Milestone active", budget: "$2,800", next: "Approve staging deploy" },
    { title: "SaaS onboarding flow", status: "Draft", budget: "$900", next: "Publish job brief" }
  ];

  const milestones = [
    { name: "Wireframe handoff", amount: "$450", due: "Today" },
    { name: "API migration phase 1", amount: "$1,200", due: "Jun 3" },
    { name: "Widget QA pass", amount: "$650", due: "Jun 6" }
  ];

  return (
    <section>
      <div className="card">
        <p className="eyebrow">Client workspace</p>
        <h2>Hiring dashboard</h2>
        <p className="muted">
          Track active job pipelines, shortlisted freelancers, and payment milestones from one place.
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
          <h3>Job pipeline</h3>
          <div className="stack">
            {jobs.map((job) => (
              <article className="row-card" key={job.title}>
                <div>
                  <strong>{job.title}</strong>
                  <p>{job.status}</p>
                </div>
                <div className="right">
                  <span>{job.budget}</span>
                  <small>{job.next}</small>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="card">
          <h3>Payment milestones</h3>
          <div className="stack">
            {milestones.map((milestone) => (
              <article className="row-card" key={milestone.name}>
                <div>
                  <strong>{milestone.name}</strong>
                  <p>{milestone.due}</p>
                </div>
                <span>{milestone.amount}</span>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="card">
        <h3>Next actions</h3>
        <div className="actions">
          <span>Review proposal shortlist</span>
          <span>Release approved milestone</span>
          <span>Invite two saved freelancers</span>
        </div>
      </section>
    </section>
  );
}
