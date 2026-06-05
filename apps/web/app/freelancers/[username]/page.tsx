import { freelancers } from "../../../lib/mock";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find((item) => item.username === params.username);

  if (!freelancer) {
    return (
      <section className="card">
        <p style={{ margin: "0 0 0.35rem", color: "#f7d878", fontWeight: 700 }}>
          Profile not found
        </p>
        <h2 style={{ margin: "0 0 0.5rem" }}>No matching freelancer</h2>
        <p style={{ margin: 0, color: "#c8d2f2" }}>
          The username <strong>{params.username}</strong> does not match an active mock
          freelancer. Return to search to choose an available profile.
        </p>
      </section>
    );
  }

  const profileRows = [
    ["Username", freelancer.username],
    ["Hourly rate", freelancer.rate],
    ["Availability", "Open to discovery calls"],
  ];

  const nextSteps = [
    "Review skills against the project requirements",
    "Share the brief and expected timeline",
    "Confirm rate fit before scheduling an interview",
  ];

  return (
    <>
      <section className="card">
        <p style={{ margin: "0 0 0.35rem", color: "#93a4d7", fontWeight: 700 }}>
          Freelancer profile
        </p>
        <h2 style={{ margin: "0 0 0.5rem" }}>{freelancer.username}</h2>
        <p style={{ margin: 0, color: "#c8d2f2", maxWidth: "680px" }}>
          Review the freelancer's core skills, rate, and interview-readiness before
          starting a project conversation.
        </p>
      </section>

      <section className="grid" aria-label="Freelancer summary">
        {profileRows.map(([label, value]) => (
          <article className="card" key={label}>
            <p style={{ margin: 0, color: "#9fb0e2", fontSize: "0.88rem" }}>
              {label}
            </p>
            <strong style={{ display: "block", marginTop: "0.35rem", fontSize: "1.35rem" }}>
              {value}
            </strong>
          </article>
        ))}
      </section>

      <section className="card">
        <h3 style={{ margin: "0 0 0.75rem" }}>Skills</h3>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {freelancer.skills.map((skill) => (
            <span
              key={skill}
              style={{
                background: "#24345f",
                borderRadius: "999px",
                color: "#f2f5ff",
                fontWeight: 800,
                padding: "0.55rem 0.85rem",
              }}
            >
              {skill}
            </span>
          ))}
        </div>
      </section>

      <section className="card">
        <h3 style={{ margin: "0 0 0.75rem" }}>Client fit</h3>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {[
            ["Best for", "Focused project work with a clear brief and milestone plan"],
            ["Review signal", "Skills and rate now match the selected search card"],
            ["Profile status", "Ready for proposal and interview workflows"],
          ].map(([label, value], index) => (
            <div
              key={label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: "wrap",
                borderBottom: index === 2 ? "0" : "1px solid #2a3765",
                paddingBottom: index === 2 ? "0" : "0.75rem",
                color: "#d7def8",
              }}
            >
              <span>{label}</span>
              <strong style={{ textAlign: "right", maxWidth: "520px" }}>{value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h3 style={{ margin: "0 0 0.75rem" }}>Next steps</h3>
        <div style={{ display: "grid", gap: "0.65rem" }}>
          {nextSteps.map((step, index) => (
            <div
              key={step}
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
              <span>{step}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
