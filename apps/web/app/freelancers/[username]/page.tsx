import { freelancers } from "../../../lib/mock";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find((f) => f.username === params.username);

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer Not Found</h2>
        <p>No freelancer found for <strong>{params.username}</strong>.</p>
        <p><a href="/freelancers/search">Browse freelancers</a></p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{freelancer.username}</h2>
      <p><strong>Skills:</strong> {freelancer.skills.join(", ")}</p>
      <p><strong>Rate:</strong> {freelancer.rate}</p>
    </section>
  );
}