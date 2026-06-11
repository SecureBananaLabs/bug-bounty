import { freelancers } from "../../../lib/mock";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find((profile) => profile.username === params.username);

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer not found</h2>
        <p>No mock freelancer profile exists for <strong>{params.username}</strong>.</p>
        <p>Return to freelancer search to open an available profile.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{freelancer.username}</h2>
      <p><strong>{freelancer.rate}</strong></p>
      <p>{freelancer.skills.join(" · ")}</p>
      <p>Portfolio, reviews, and active proposals for {freelancer.username} appear here.</p>
    </section>
  );
}
