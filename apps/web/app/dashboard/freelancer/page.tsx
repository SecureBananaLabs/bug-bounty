export default function FreelancerDashboardPage() {
  const metrics = [
    { label: "Open proposals", value: "14", detail: "5 viewed by clients" },
    { label: "Active contracts", value: "3", detail: "2 milestones due soon" },
    { label: "Month earnings", value: "$18.4k", detail: "$6.2k pending release" },
    { label: "Response rate", value: "96%", detail: "Median reply under 1 hour" },
  ];

  const contracts = [
    {
      client: "Northstar Labs",
      project: "Analytics dashboard rebuild",
      status: "Milestone review",
      due: "Today",
      value: "$6,200",
    },
    {
      client: "Luma Studio",
      project: "Brand system refresh",
      status: "In progress",
      due: "Jun 8",
      value: "$4,800",
    },
    {
      client: "Cedar Finance",
      project: "Landing page sprint",
      status: "Awaiting files",
      due: "Jun 10",
      value: "$3,600",
    },
  ];

  const actions = [
    "Send milestone notes to Northstar Labs",
    "Reply to two proposal follow-up questions",
    "Upload brand audit draft for Luma Studio",
  ];

  return (
    <>
      <section className="card">
        <p style={{ margin: "0 0 0.35rem", color: "#93a4d7", fontWeight: 700 }}>
          Freelancer workspace
        </p>
        <h2 style={{ margin: "0 0 0.5rem" }}>Work and earnings overview</h2>
        <p style={{ margin: 0, color: "#c8d2f2", maxWidth: "700px" }}>
          Monitor proposal momentum, active client work, milestone deadlines, and payout
          readiness from one dashboard.
        </p>
      </section>

      <section className="grid" aria-label="Freelancer dashboard summary">
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
            <h3 style={{ margin: "0 0 0.25rem" }}>Active contract pipeline</h3>
            <p style={{ margin: 0, color: "#aebce7" }}>
              Milestones and blockers that affect delivery, reviews, and payout timing.
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
            $14.6k in active work
          </span>
        </div>

        <div style={{ display: "grid", gap: "0.75rem" }}>
          {contracts.map((contract) => (
            <article
              key={contract.project}
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
                    {contract.client}
                  </p>
                  <h4 style={{ margin: 0 }}>{contract.project}</h4>
                </div>
                <div style={{ minWidth: "120px", flex: "1 1 120px" }}>
                  <p style={{ margin: 0, color: "#9fb0e2", fontSize: "0.82rem" }}>
                    Status
                  </p>
                  <strong>{contract.status}</strong>
                </div>
                <div style={{ minWidth: "120px", flex: "1 1 120px" }}>
                  <p style={{ margin: 0, color: "#9fb0e2", fontSize: "0.82rem" }}>
                    Due
                  </p>
                  <strong>{contract.due}</strong>
                </div>
                <div style={{ minWidth: "120px", flex: "1 1 120px" }}>
                  <p style={{ margin: 0, color: "#9fb0e2", fontSize: "0.82rem" }}>
                    Value
                  </p>
                  <strong>{contract.value}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid" aria-label="Freelancer priorities">
        <article className="card">
          <h3 style={{ margin: "0 0 0.75rem" }}>Proposal health</h3>
          <div style={{ display: "grid", gap: "0.65rem" }}>
            {[
              ["Viewed proposals", "5"],
              ["Interviews requested", "3"],
              ["Drafts ready to send", "4"],
            ].map(([label, value], index) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1rem",
                  borderBottom: index === 2 ? "0" : "1px solid #2a3765",
                  paddingBottom: index === 2 ? "0" : "0.65rem",
                  color: "#d7def8",
                }}
              >
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
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
