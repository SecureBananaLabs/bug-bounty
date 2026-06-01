import { freelancers } from "../../../lib/mock";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find((f) => f.username === params.username);

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer Not Found</h2>
        <p>
          No freelancer found with the username <strong>{params.username}</strong>.
        </p>
        <p style={{ marginTop: "1rem" }}>
          <a href="/freelancers/search">Browse all freelancers</a>
        </p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{freelancer.username}</h2>
      <div style={{ marginBottom: "1rem" }}>
        <strong>Rate:</strong> {freelancer.rate}
      </div>
      <div>
        <strong>Skills:</strong>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
          {freelancer.skills.map((skill) => (
            <span
              key={skill}
              style={{
                background: "var(--accent)",
                padding: "0.25rem 0.75rem",
                borderRadius: "999px",
                fontSize: "0.875rem",
              }}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
      <p style={{ marginTop: "1rem", color: "var(--muted)" }}>
        Portfolio, reviews, and active proposals appear here.
      </p>
    </section>
  );
}
