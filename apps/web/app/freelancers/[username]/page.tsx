import { freelancers } from "../../../lib/mock";
import Link from "next/link";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const profile = freelancers.find((f) => f.username === params.username);

  if (!profile) {
    return (
      <section className="card">
        <h2>Freelancer Not Found</h2>
        <p>
          The freelancer <strong>{params.username}</strong> does not exist.
        </p>
        <Link href="/freelancers/search" style={{ color: "#6366f1" }}>
          Back to freelancer search
        </Link>
      </section>
    );
  }

  return (
    <section>
      <div className="card">
        <h2>{profile.username}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.75rem" }}>
          <div>
            <span style={{ color: "#94a3b8" }}>Skills: </span>
            {profile.skills.map((skill) => (
              <span
                key={skill}
                style={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: 6,
                  padding: "0.15rem 0.5rem",
                  marginRight: "0.4rem",
                  fontSize: "0.875rem",
                }}
              >
                {skill}
              </span>
            ))}
          </div>
          <div>
            <span style={{ color: "#94a3b8" }}>Hourly Rate: </span>
            <strong>{profile.rate}</strong>
          </div>
        </div>
      </div>
      <div className="card">
        <h3>Portfolio</h3>
        <p style={{ color: "#94a3b8" }}>Portfolio projects and work samples will appear here.</p>
      </div>
      <div className="card">
        <h3>Reviews</h3>
        <p style={{ color: "#94a3b8" }}>Client reviews and ratings will appear here.</p>
      </div>
      <div className="card">
        <h3>Active Proposals</h3>
        <p style={{ color: "#94a3b8" }}>Currently active proposals will appear here.</p>
      </div>
    </section>
  );
}
