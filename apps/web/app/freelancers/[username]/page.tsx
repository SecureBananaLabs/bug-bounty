import { freelancers } from "../../../lib/mock";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find((f) => f.username === params.username);

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer Not Found</h2>
        <p>No profile for <strong>{params.username}</strong> exists.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{freelancer.username}</h2>
      <p><strong>Rate:</strong> {freelancer.rate}</p>
      <p><strong>Skills:</strong> {freelancer.skills.join(", ")}</p>
      <p>Portfolio, reviews, and active proposals appear here.</p>
    </section>
  );
}
