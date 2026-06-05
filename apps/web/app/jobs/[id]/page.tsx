import { jobs } from "../../../lib/mock";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = jobs.find((item) => item.id === params.id);

  if (!job) {
    return (
      <section className="card">
        <p style={{ margin: "0 0 0.35rem", color: "#f7d878", fontWeight: 700 }}>
          Job not found
        </p>
        <h2 style={{ margin: "0 0 0.5rem" }}>No matching project</h2>
        <p style={{ margin: 0, color: "#c8d2f2" }}>
          The job id <strong>{params.id}</strong> does not match an active mock listing.
          Return to the jobs board to choose an available project.
        </p>
      </section>
    );
  }

  const details = [
    { label: "Budget", value: job.budget },
    { label: "Status", value: "Open for proposals" },
    { label: "Timeline", value: "Kickoff this week" },
  ];

  const nextSteps = [
    "Review the project goals and required skills",
    "Prepare a proposal with relevant portfolio examples",
    "Confirm budget fit before starting a client conversation",
  ];

  return (
    <>
      <section className="card">
        <p style={{ margin: "0 0 0.35rem", color: "#93a4d7", fontWeight: 700 }}>
          Project brief
        </p>
        <h2 style={{ margin: "0 0 0.5rem" }}>{job.title}</h2>
        <p style={{ margin: 0, color: "#c8d2f2", maxWidth: "680px" }}>
          Review the active listing, proposal expectations, and engagement details before
          deciding whether to apply.
        </p>
      </section>

      <section className="grid" aria-label="Job summary">
        {details.map((detail) => (
          <article className="card" key={detail.label}>
            <p style={{ margin: 0, color: "#9fb0e2", fontSize: "0.88rem" }}>
              {detail.label}
            </p>
            <strong style={{ display: "block", marginTop: "0.35rem", fontSize: "1.35rem" }}>
              {detail.value}
            </strong>
          </article>
        ))}
      </section>

      <section className="card">
        <h3 style={{ margin: "0 0 0.75rem" }}>Project context</h3>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {[
            ["Listing id", job.id],
            ["Ideal proposal", "Specific timeline, related work, and milestone breakdown"],
            ["Client priority", "Clear scope, fast communication, and budget alignment"],
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
