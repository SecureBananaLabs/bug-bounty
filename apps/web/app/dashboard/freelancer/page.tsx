import Link from "next/link";

const stats = [
  { label: "Active projects", value: "2", detail: "1 milestone due this week" },
  { label: "Proposal win rate", value: "38%", detail: "Up 6% this month" },
  { label: "Available balance", value: "$2,150", detail: "Next payout on Jun 1" }
];

const proposals = [
  { jobId: "job-101", role: "AI support widget", client: "Northstar Labs", status: "Client reviewing" },
  { jobId: "job-103", role: "SaaS onboarding flows", client: "BrightDesk", status: "Interview scheduled" },
  { jobId: "job-102", role: "Node.js API migration", client: "Atlas Ops", status: "Draft proposal" }
];

const earnings = [
  { label: "API migration milestone", amount: "$1,250", status: "Pending approval" },
  { label: "Design sprint deposit", amount: "$600", status: "In escrow" },
  { label: "Retainer payout", amount: "$300", status: "Scheduled" }
];

export default function FreelancerDashboardPage() {
  return (
    <section>
      <header style={headerStyle}>
        <div>
          <h2>Freelancer Dashboard</h2>
          <p style={mutedStyle}>Proposal pipeline, committed work, and earnings status.</p>
        </div>
        <Link href="/freelancers/search" style={buttonStyle}>
          View profile
        </Link>
      </header>

      <div className="grid">
        {stats.map((stat) => (
          <article className="card" key={stat.label}>
            <p style={labelStyle}>{stat.label}</p>
            <strong style={valueStyle}>{stat.value}</strong>
            <p style={mutedStyle}>{stat.detail}</p>
          </article>
        ))}
      </div>

      <div className="grid" style={wideGridStyle}>
        <section className="card">
          <h3>Proposal queue</h3>
          <div style={tableStyle}>
            {proposals.map((proposal) => (
              <div key={`${proposal.jobId}-${proposal.client}`} style={rowStyle}>
                <Link href={`/jobs/${proposal.jobId}`}>
                  <strong>{proposal.role}</strong>
                </Link>
                <span>{proposal.client}</span>
                <span>{proposal.status}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h3>Earnings</h3>
          {earnings.map((item) => (
            <div key={item.label} style={earningStyle}>
              <div>
                <strong>{item.label}</strong>
                <p style={mutedStyle}>{item.status}</p>
              </div>
              <strong>{item.amount}</strong>
            </div>
          ))}
        </section>
      </div>
    </section>
  );
}

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "1rem",
  flexWrap: "wrap" as const,
  marginBottom: "1rem"
};

const buttonStyle = {
  padding: "0.75rem 1rem",
  borderRadius: 8,
  border: "1px solid #6b7cff",
  background: "#4358d8",
  color: "#fff"
};

const labelStyle = {
  color: "#9ea8c9",
  margin: 0
};

const valueStyle = {
  display: "block",
  fontSize: "2rem",
  margin: "0.4rem 0"
};

const mutedStyle = {
  color: "#9ea8c9",
  margin: "0.35rem 0 0"
};

const wideGridStyle = {
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))"
};

const tableStyle = {
  display: "grid",
  gap: "0.75rem"
};

const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  flexWrap: "wrap" as const,
  gap: "0.75rem",
  alignItems: "center",
  padding: "0.75rem 0",
  borderBottom: "1px solid #2a3765"
};

const earningStyle = {
  display: "flex",
  justifyContent: "space-between",
  flexWrap: "wrap" as const,
  gap: "1rem",
  padding: "0.75rem 0",
  borderBottom: "1px solid #2a3765"
};
