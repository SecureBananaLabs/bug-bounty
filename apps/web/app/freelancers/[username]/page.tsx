import { freelancers } from "../../../lib/mock";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find((item) => item.username === params.username);

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer Not Found</h2>
        <p>No freelancer profile exists for <strong>{params.username}</strong>.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{freelancer.username}</h2>
      <p><strong>Skills:</strong> {freelancer.skills.join(" / ")}</p>
      <p><strong>Rate:</strong> {freelancer.rate}</p>
      <p>Portfolio, reviews, and active proposals appear here.</p>
    </section>
  );
}
