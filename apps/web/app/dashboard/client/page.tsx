export default function ClientDashboardPage() {
  const metrics = [
    { label: "Active jobs", value: "5", detail: "2 closing this week" },
    { label: "Shortlisted", value: "18", detail: "6 awaiting review" },
    { label: "Escrow funded", value: "$24.8k", detail: "Across 4 milestones" },
    { label: "Pending decisions", value: "7", detail: "Interviews and approvals" },
  ];

  const projects = [
    {
      role: "Product designer",
      project: "Marketplace onboarding refresh",
      stage: "Interviewing",
      budget: "$8,500",
      nextStep: "Pick final 2",
    },
    {
      role: "Full-stack engineer",
      project: "Vendor analytics dashboard",
      stage: "Trial milestone",
      budget: "$12,000",
      nextStep: "Approve scope",
    },
    {
      role: "Brand strategist",
      project: "Enterprise launch kit",
      stage: "Shortlist",
      budget: "$4,300",
      nextStep: "Review proposals",
    },
  ];

  const actions = [
    "Approve the analytics dashboard trial milestone",
    "Send interview slots to shortlisted product designers",
    "Fund the next escrow payment before Friday",
  ];

  return (
    <>
      <section className="card">
        <p style={{ margin: "0 0 0.35rem", color: "#93a4d7", fontWeight: 700 }}>
          Client workspace
        </p>
        <h2 style={{ margin: "0 0 0.5rem" }}>Hiring command center</h2>
        <p style={{ margin: 0, color: "#c8d2f2", maxWidth: "700px" }}>
          Review active roles, compare shortlisted freelancers, and keep funded work
          moving through approval.
        </p>
      </section>

      <section className="grid" aria-label="Client dashboard summary">
        {metrics.map((metric) => (
          <article className="card" key={metric.label}>
            <p style={{ margin: 0, color: "#9fb0e2", fontSize: "0.88rem" }}>
              {metric.label}
            </p>
            <strong style={{ display: "block", marginTop: "0.35rem", fontSize: "1.9rem" }}>
              {metric.value}
            </strong>
            <p style={{ margin: "0.35rem 0 0", color: "#c8d2f2" }}>{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: "1rem",
          }}
        >
          <div>
            <h3 style={{ margin: "0 0 0.25rem" }}>Hiring pipeline</h3>
            <p style={{ margin: 0, color: "#aebce7" }}>
              Roles that need client review before candidates or milestones can progress.
            </p>
          </div>
          <span
            style={{
              border: "1px solid #465894",
              borderRadius: "999px",
              padding: "0.35rem 0.75rem",
              color: "#d7def8",
              fontSize: "0.9rem",
            }}
          >
            3 priority projects
          </span>
        </div>

        <div style={{ display: "grid", gap: "0.75rem" }}>
          {projects.map((project) => (
            <article
              key={project.project}
              style={{
                border: "1px solid #2a3765",
                borderRadius: "8px",
                padding: "0.9rem",
                background: "#111832",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ minWidth: "220px", flex: "1 1 260px" }}>
                  <p
                    style={{
                      margin: "0 0 0.25rem",
                      color: "#95e6c8",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                    }}
                  >
                    {project.role}
                  </p>
                  <h4 style={{ margin: 0 }}>{project.project}</h4>
                </div>
                <div style={{ minWidth: "120px", flex: "1 1 120px" }}>
                  <p style={{ margin: 0, color: "#9fb0e2", fontSize: "0.82rem" }}>
                    Stage
                  </p>
                  <strong>{project.stage}</strong>
                </div>
                <div style={{ minWidth: "120px", flex: "1 1 120px" }}>
                  <p style={{ margin: 0, color: "#9fb0e2", fontSize: "0.82rem" }}>
                    Budget
                  </p>
                  <strong>{project.budget}</strong>
                </div>
                <div style={{ minWidth: "120px", flex: "1 1 120px" }}>
                  <p style={{ margin: 0, color: "#9fb0e2", fontSize: "0.82rem" }}>
                    Next
                  </p>
                  <strong>{project.nextStep}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid" aria-label="Client next steps">
        <article className="card">
          <h3 style={{ margin: "0 0 0.75rem" }}>Spend milestones</h3>
          <div style={{ display: "grid", gap: "0.65rem" }}>
            {["Discovery paid", "Prototype in review", "Launch escrow pending"].map(
              (milestone, index) => (
                <div
                  key={milestone}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem",
                    borderBottom: index === 2 ? "0" : "1px solid #2a3765",
                    paddingBottom: index === 2 ? "0" : "0.65rem",
                    color: "#d7def8",
                  }}
                >
                  <span>{milestone}</span>
                  <strong>{index === 0 ? "$6.2k" : index === 1 ? "$9.1k" : "$9.5k"}</strong>
                </div>
              ),
            )}
          </div>
        </article>

        <article className="card">
          <h3 style={{ margin: "0 0 0.75rem" }}>Next actions</h3>
          <div style={{ display: "grid", gap: "0.65rem" }}>
            {actions.map((action, index) => (
              <div
                key={action}
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "center",
                  color: "#d7def8",
                }}
              >
                <strong
                  style={{
                    display: "inline-grid",
                    placeItems: "center",
                    width: "2rem",
                    height: "2rem",
                    borderRadius: "999px",
                    background: "#24345f",
                    color: "#f2f5ff",
                    flex: "0 0 auto",
                  }}
                >
                  {index + 1}
                </strong>
                <span>{action}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
