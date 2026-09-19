export default function FreelancerDashboardPage() {
  const metrics = [
    { label: "Open proposals", value: "6", detail: "3 need follow-up today" },
    { label: "Accepted jobs", value: "2", detail: "$2.4k in active work" },
    { label: "Earnings", value: "$5.8k", detail: "$750 pending payout" }
  ];
  const proposals = [
    { title: "AI support widget", status: "Interview stage", next: "Send architecture notes", value: "$1,500" },
    { title: "Landing page refresh", status: "Client viewed", next: "Follow up in 4h", value: "$900" },
    { title: "Data cleanup script", status: "Draft proposal", next: "Add delivery timeline", value: "$650" }
  ];
  const activeJobs = [
    { title: "Node API migration", milestone: "Milestone 2", due: "Due Friday", amount: "$1,200" },
    { title: "SaaS onboarding audit", milestone: "Final report", due: "Due Monday", amount: "$450" }
  ];
  const payouts = [
    { label: "Ready to withdraw", status: "Available now", amount: "$310" },
    { label: "Pending approval", status: "1 milestone", amount: "$450" },
    { label: "Upcoming invoices", status: "Next 7 days", amount: "$1,650" }
  ];

  return (
    <section>
      <h2>Dashboard (Freelancer)</h2>

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
        <h3>Proposal pipeline</h3>
        {proposals.map((proposal) => (
          <div key={proposal.title} style={{ borderTop: "1px solid #2a3765", padding: "0.75rem 0" }}>
            <strong>{proposal.title}</strong>
            <p>{proposal.status} · {proposal.value} · {proposal.next}</p>
          </div>
        ))}
      </section>

      <div className="grid">
        <section className="card">
          <h3>Accepted jobs</h3>
          {activeJobs.map((job) => (
            <p key={job.title}>
              <strong>{job.title}</strong> · {job.milestone} · {job.due} · {job.amount}
            </p>
          ))}
        </section>

        <section className="card">
          <h3>Earnings queue</h3>
          {payouts.map((payout) => (
            <p key={payout.label}>
              <strong>{payout.label}</strong> · {payout.status} · {payout.amount}
            </p>
          ))}
        </section>
      </div>
    </section>
  );
}
