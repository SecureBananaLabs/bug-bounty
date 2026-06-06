export default function LandingPage() {
  const stats = [
    ["4.8k", "Verified freelancers"],
    ["92%", "Projects staffed in 72 hours"],
    ["$18M", "Milestones completed"],
  ];

  const categories = ["Engineering", "Design", "Writing", "Growth"];

  const activity = [
    ["Product dashboard", "3 senior React matches", "$8k-$12k"],
    ["Brand launch kit", "5 portfolio reviews", "$4k-$7k"],
    ["Lifecycle emails", "2 proposals due today", "$2k-$5k"],
  ];

  return (
    <>
      <section
        style={{
          display: "grid",
          gap: "1.5rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <div>
          <p style={{ margin: "0 0 0.5rem", color: "#95e6c8", fontWeight: 700 }}>
            Freelance marketplace
          </p>
          <h1 style={{ margin: "0 0 0.75rem", fontSize: "2.75rem", lineHeight: 1.05 }}>
            Hire trusted specialists for high-priority work
          </h1>
          <p style={{ margin: "0 0 1rem", color: "#c8d2f2", fontSize: "1.05rem" }}>
            Move from job brief to vetted shortlist, secure milestones, and project
            delivery without spreading decisions across disconnected tools.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <a
              href="/jobs/post"
              style={{
                background: "#95e6c8",
                borderRadius: "8px",
                color: "#07111f",
                fontWeight: 800,
                padding: "0.75rem 1rem",
              }}
            >
              Post a job
            </a>
            <a
              href="/freelancers/search"
              style={{
                border: "1px solid #465894",
                borderRadius: "8px",
                color: "#f2f5ff",
                fontWeight: 800,
                padding: "0.75rem 1rem",
              }}
            >
              Browse talent
            </a>
          </div>
        </div>

        <section className="card" aria-label="Marketplace activity preview">
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
              <p style={{ margin: 0, color: "#9fb0e2", fontSize: "0.86rem" }}>
                Live marketplace preview
              </p>
              <h2 style={{ margin: "0.25rem 0 0" }}>Hiring activity</h2>
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
              Updated today
            </span>
          </div>

          <div style={{ display: "grid", gap: "0.75rem" }}>
            {activity.map(([project, signal, budget]) => (
              <article
                key={project}
                style={{
                  border: "1px solid #2a3765",
                  borderRadius: "8px",
                  padding: "0.85rem",
                  background: "#111832",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0 }}>{project}</h3>
                    <p style={{ margin: "0.3rem 0 0", color: "#aebce7" }}>{signal}</p>
                  </div>
                  <strong style={{ color: "#f7d878" }}>{budget}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="grid" aria-label="Marketplace stats">
        {stats.map(([value, label]) => (
          <article className="card" key={label}>
            <strong style={{ display: "block", fontSize: "2rem" }}>{value}</strong>
            <p style={{ margin: "0.35rem 0 0", color: "#c8d2f2" }}>{label}</p>
          </article>
        ))}
      </section>

      <section className="grid" aria-label="Marketplace paths">
        <article className="card">
          <h2 style={{ margin: "0 0 0.5rem" }}>For clients</h2>
          <p style={{ margin: "0 0 0.9rem", color: "#c8d2f2" }}>
            Compare specialists, manage conversations, fund milestones, and track project
            decisions from a single workspace.
          </p>
          <a href="/dashboard/client" style={{ color: "#95e6c8", fontWeight: 800 }}>
            Open client dashboard
          </a>
        </article>

        <article className="card">
          <h2 style={{ margin: "0 0 0.5rem" }}>For freelancers</h2>
          <p style={{ margin: "0 0 0.9rem", color: "#c8d2f2" }}>
            Monitor proposal health, active contracts, earnings, and response priorities
            without losing sight of deadlines.
          </p>
          <a href="/dashboard/freelancer" style={{ color: "#95e6c8", fontWeight: 800 }}>
            Open freelancer dashboard
          </a>
        </article>
      </section>

      <section className="card">
        <h2 style={{ margin: "0 0 0.75rem" }}>Work categories</h2>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {categories.map((category) => (
            <span
              key={category}
              style={{
                background: "#24345f",
                borderRadius: "999px",
                color: "#f2f5ff",
                fontWeight: 800,
                padding: "0.55rem 0.85rem",
              }}
            >
              {category}
            </span>
          ))}
        </div>
      </section>
    </>
  );
}
