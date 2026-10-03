export default function ClientDashboardPage() {
  const metrics = [
    { label: "Active jobs", value: "3", detail: "2 interviewing" },
    { label: "Shortlisted", value: "8", detail: "4 awaiting reply" },
    { label: "Milestones", value: "$4.2k", detail: "$900 due this week" }
  ];
  const jobs = [
    { title: "AI support widget", status: "Interviewing", budget: "$1,500", next: "Review 3 proposals" },
    { title: "Node API migration", status: "In progress", budget: "$2,800", next: "Approve milestone 2" },
    { title: "SaaS onboarding flow", status: "Draft", budget: "$900", next: "Publish brief" }
  ];
  const freelancers = [
    { name: "maya-dev", fit: "Next.js specialist", response: "2h avg response" },
    { name: "jordan-ux", fit: "Onboarding UX", response: "Available today" },
    { name: "sam-api", fit: "Node migration", response: "Milestone ready" }
  ];
  const milestones = [
    { label: "Widget prototype", status: "Ready to review", amount: "$450" },
    { label: "API migration phase 2", status: "Payment pending", amount: "$900" },
    { label: "Onboarding audit", status: "Not started", amount: "$300" }
  ];

  return (
    <section>
      <h2>Dashboard (Client)</h2>

      <div className="grid">
        {metrics.map((metric) => (
          <article className="card" key={metric.label}>
            <h3>{metric.label}</h3>
            <p style={{ fontSize: "2rem", fontWeight: 700, margin: "0.25rem 0" }}>{metric.value}</p>
            <p>{metric.detail}</p>
          </article>
        ))}
      </div>

      <section className="card">
        <h3>Project pipeline</h3>
        {jobs.map((job) => (
          <div key={job.title} style={{ borderTop: "1px solid #2a3765", padding: "0.75rem 0" }}>
            <strong>{job.title}</strong>
            <p>{job.status} · {job.budget} · {job.next}</p>
          </div>
        ))}
      </section>

      <div className="grid">
        <section className="card">
          <h3>Shortlisted freelancers</h3>
          {freelancers.map((freelancer) => (
            <p key={freelancer.name}>
              <strong>{freelancer.name}</strong> · {freelancer.fit} · {freelancer.response}
            </p>
          ))}
        </section>

        <section className="card">
          <h3>Payment milestones</h3>
          {milestones.map((milestone) => (
            <p key={milestone.label}>
              <strong>{milestone.label}</strong> · {milestone.status} · {milestone.amount}
            </p>
          ))}
        </section>
      </div>
    </section>
  );
}
