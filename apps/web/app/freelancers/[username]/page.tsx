import { freelancers } from "../../../lib/mock";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find((profile) => profile.username === params.username);

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer not found</h2>
        <p>No mock profile exists for <strong>{params.username}</strong>.</p>
        <p>Return to freelancer search to choose an available profile.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{freelancer.name}</h2>
      <p><strong>Username:</strong> {freelancer.username}</p>
      <p><strong>Rate:</strong> {freelancer.rate}</p>
      <p><strong>Skills:</strong> {freelancer.skills.join(", ")}</p>
      <p>{freelancer.summary}</p>
    </section>
  );
}
