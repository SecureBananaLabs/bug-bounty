import { freelancers } from "../../../lib/mock";

export default async function FreelancerProfilePage({
  params
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const freelancer = freelancers.find((entry) => entry.username === username);

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer not found</h2>
        <p>No active freelancer profile matches <strong>{username}</strong>.</p>
        <p>Return to freelancer search to choose an available profile.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <p style={{ marginTop: 0, color: "#9fb0d8" }}>Freelancer profile</p>
      <h2>{freelancer.username}</h2>
      <p><strong>Hourly rate:</strong> {freelancer.rate}</p>

      <h3>Skills</h3>
      <ul>
        {freelancer.skills.map((skill) => (
          <li key={skill}>{skill}</li>
        ))}
      </ul>

      <p>Use this profile to compare rate, skill fit, and availability before opening a proposal thread.</p>
    </section>
  );
}
