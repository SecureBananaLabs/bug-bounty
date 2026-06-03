import { freelancers } from "../../../lib/mock";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find((candidate) => candidate.username === params.username);

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer not found</h2>
        <p>No mock freelancer profile exists for <strong>{params.username}</strong>.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{freelancer.name}</h2>
      <p>{freelancer.headline}</p>
      <p><strong>{freelancer.rate}</strong></p>
      <p>{freelancer.bio}</p>
      <p>{freelancer.skills.join(" | ")}</p>
      <h3>Portfolio</h3>
      <ul>
        {freelancer.portfolio.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
