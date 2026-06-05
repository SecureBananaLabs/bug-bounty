export default function PostJobPage() {
  const briefSections = [
    {
      title: "Project basics",
      fields: [
        ["Working title", "AI customer support widget"],
        ["Category", "Engineering"],
        ["Engagement type", "Fixed milestone project"],
      ],
    },
    {
      title: "Budget and timeline",
      fields: [
        ["Budget range", "$1,500 - $3,000"],
        ["Target kickoff", "Within 7 days"],
        ["First milestone", "Prototype review"],
      ],
    },
    {
      title: "Required skills",
      fields: [
        ["Frontend", "Next.js, TypeScript"],
        ["Backend", "API integration"],
        ["Collaboration", "Async updates and weekly demos"],
      ],
    },
  ];

  const checklist = [
    "Describe the business outcome, not only the deliverable",
    "Set a budget range before inviting freelancers",
    "List must-have skills separately from nice-to-have skills",
    "Define the first milestone so proposals are comparable",
  ];

  return (
    <>
      <section className="card">
        <p style={{ margin: "0 0 0.35rem", color: "#93a4d7", fontWeight: 700 }}>
          Post a job
        </p>
        <h2 style={{ margin: "0 0 0.5rem" }}>Project brief workflow</h2>
        <p style={{ margin: 0, color: "#c8d2f2", maxWidth: "700px" }}>
          Prepare a clear project brief with scope, budget, skills, and milestone details
          before sending it to freelancers.
        </p>
      </section>

      <section className="grid" aria-label="Project brief sections">
        {briefSections.map((section) => (
          <article className="card" key={section.title}>
            <h3 style={{ margin: "0 0 0.75rem" }}>{section.title}</h3>
            <div style={{ display: "grid", gap: "0.65rem" }}>
              {section.fields.map(([label, value], index) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem",
                    alignItems: "center",
                    borderBottom: index === section.fields.length - 1 ? "0" : "1px solid #2a3765",
                    paddingBottom: index === section.fields.length - 1 ? "0" : "0.65rem",
                  }}
                >
                  <span style={{ color: "#d7def8" }}>{label}</span>
                  <strong style={{ textAlign: "right" }}>{value}</strong>
                </div>
              ))}
            </div>
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
            <h3 style={{ margin: "0 0 0.25rem" }}>Milestone preview</h3>
            <p style={{ margin: 0, color: "#aebce7" }}>
              A structured first milestone helps freelancers estimate effort accurately.
            </p>
          </div>
          <span
            style={{
              border: "1px solid #465894",
              borderRadius: "999px",
              color: "#d7def8",
              fontSize: "0.9rem",
              padding: "0.35rem 0.75rem",
            }}
          >
            Draft quality: strong
          </span>
        </div>

        <div style={{ display: "grid", gap: "0.75rem" }}>
          {[
            ["Discovery", "Confirm requirements, users, integrations, and success metrics"],
            ["Prototype", "Deliver clickable UI and API contract for review"],
            ["Launch prep", "Finalize handoff notes, QA checklist, and rollout plan"],
          ].map(([phase, detail]) => (
            <article
              key={phase}
              style={{
                border: "1px solid #2a3765",
                borderRadius: "8px",
                padding: "0.85rem",
                background: "#111832",
              }}
            >
              <h4 style={{ margin: "0 0 0.3rem" }}>{phase}</h4>
              <p style={{ margin: 0, color: "#c8d2f2" }}>{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <h3 style={{ margin: "0 0 0.75rem" }}>Review checklist</h3>
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
      </section>
    </>
  );
}
