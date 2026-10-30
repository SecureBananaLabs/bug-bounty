import Link from "next/link";

const stats = [
  { label: "Open jobs", value: "3", detail: "2 receiving proposals" },
  { label: "Shortlisted", value: "5", detail: "Across design and engineering" },
  { label: "Escrow balance", value: "$4,200", detail: "Next release due Friday" }
];

const activeJobs = [
  { id: "job-101", title: "AI customer support widget", proposals: 12, status: "Reviewing" },
  { id: "job-102", title: "Legacy API migration", proposals: 7, status: "Interviewing" },
  { id: "job-103", title: "SaaS onboarding flows", proposals: 4, status: "Drafting brief" }
];

const milestones = [
  { project: "API migration", amount: "$1,400", due: "May 31", status: "Ready to fund" },
  { project: "Support widget", amount: "$900", due: "Jun 3", status: "Awaiting review" },
  { project: "Onboarding flows", amount: "$500", due: "Jun 7", status: "Draft" }
];

export default function ClientDashboardPage() {
  return (
    <section>
      <header style={headerStyle}>
        <div>
          <h2>Client Dashboard</h2>
          <p style={mutedStyle}>Hiring pipeline, shortlist activity, and funded work.</p>
        </div>
        <Link href="/jobs/post" style={buttonStyle}>
          Post a job
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
          <h3>Active hiring</h3>
          <div style={tableStyle}>
            {activeJobs.map((job) => (
              <div key={job.id} style={rowStyle}>
                <Link href={`/jobs/${job.id}`}>
                  <strong>{job.title}</strong>
                </Link>
                <span>{job.proposals} proposals</span>
                <span>{job.status}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h3>Payment milestones</h3>
          {milestones.map((milestone) => (
            <div key={`${milestone.project}-${milestone.due}`} style={milestoneStyle}>
              <div>
                <strong>{milestone.project}</strong>
                <p style={mutedStyle}>Due {milestone.due}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <strong>{milestone.amount}</strong>
                <p style={mutedStyle}>{milestone.status}</p>
              </div>
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

const milestoneStyle = {
  display: "flex",
  justifyContent: "space-between",
  flexWrap: "wrap" as const,
  gap: "1rem",
  padding: "0.75rem 0",
  borderBottom: "1px solid #2a3765"
};
