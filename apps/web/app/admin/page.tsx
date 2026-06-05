export default function AdminPanelPage() {
  const metrics = [
    { label: "Open reports", value: "23", detail: "8 need review today" },
    { label: "Trust checks", value: "41", detail: "12 freelancer verifications" },
    { label: "Disputes", value: "6", detail: "2 payment escalations" },
    { label: "Platform health", value: "99.9%", detail: "All core queues online" },
  ];

  const queue = [
    {
      type: "Profile review",
      subject: "Portfolio verification flagged for mismatch",
      severity: "Medium",
      owner: "Trust",
      action: "Review evidence",
    },
    {
      type: "Payment dispute",
      subject: "Milestone release paused after scope complaint",
      severity: "High",
      owner: "Ops",
      action: "Escalate case",
    },
    {
      type: "Listing moderation",
      subject: "Job post contains off-platform payment language",
      severity: "High",
      owner: "Safety",
      action: "Hide listing",
    },
  ];

  const checklist = [
    "Triage high-severity payment and listing reports first",
    "Confirm trust-review evidence before profile restrictions",
    "Check queue health after moderation rule updates",
  ];

  return (
    <>
      <section className="card">
        <p style={{ margin: "0 0 0.35rem", color: "#93a4d7", fontWeight: 700 }}>
          Admin operations
        </p>
        <h2 style={{ margin: "0 0 0.5rem" }}>Moderation and trust overview</h2>
        <p style={{ margin: 0, color: "#c8d2f2", maxWidth: "720px" }}>
          Monitor reports, profile reviews, disputes, and queue health from one focused
          operations surface.
        </p>
      </section>

      <section className="grid" aria-label="Admin metrics">
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
            <h3 style={{ margin: "0 0 0.25rem" }}>Priority queue</h3>
            <p style={{ margin: 0, color: "#aebce7" }}>
              Cases that need moderator action before users can continue safely.
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
            3 urgent workflows
          </span>
        </div>

        <div style={{ display: "grid", gap: "0.75rem" }}>
          {queue.map((item) => (
            <article
              key={item.subject}
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
                <div style={{ minWidth: "240px", flex: "1 1 320px" }}>
                  <p
                    style={{
                      margin: "0 0 0.25rem",
                      color: "#95e6c8",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                    }}
                  >
                    {item.type}
                  </p>
                  <h4 style={{ margin: 0 }}>{item.subject}</h4>
                </div>
                <div style={{ minWidth: "110px", flex: "1 1 110px" }}>
                  <p style={{ margin: 0, color: "#9fb0e2", fontSize: "0.82rem" }}>
                    Severity
                  </p>
                  <strong style={{ color: item.severity === "High" ? "#f7d878" : "#d7def8" }}>
                    {item.severity}
                  </strong>
                </div>
                <div style={{ minWidth: "110px", flex: "1 1 110px" }}>
                  <p style={{ margin: 0, color: "#9fb0e2", fontSize: "0.82rem" }}>
                    Team
                  </p>
                  <strong>{item.owner}</strong>
                </div>
                <div style={{ minWidth: "130px", flex: "1 1 130px" }}>
                  <p style={{ margin: 0, color: "#9fb0e2", fontSize: "0.82rem" }}>
                    Next
                  </p>
                  <strong>{item.action}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid" aria-label="Admin follow-up">
        <article className="card">
          <h3 style={{ margin: "0 0 0.75rem" }}>Queue health</h3>
          <div style={{ display: "grid", gap: "0.65rem" }}>
            {[
              ["Moderation SLA", "94% on time"],
              ["Verification backlog", "12 pending"],
              ["Escalation handoff", "2 awaiting owner"],
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
          <h3 style={{ margin: "0 0 0.75rem" }}>Escalation checklist</h3>
          <div style={{ display: "grid", gap: "0.65rem" }}>
            {checklist.map((item, index) => (
              <div
                key={item}
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
                <span>{item}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
