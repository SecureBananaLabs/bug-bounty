import { freelancers } from "../../../lib/mock";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find((f) => f.username === params.username);

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer Not Found</h2>
        <p>No freelancer profile matches <strong>{params.username}</strong>.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{freelancer.username}</h2>
      <p>Skills: {freelancer.skills.join(" · ")}</p>
      <p>Rate: {freelancer.rate}</p>
    </section>
  );
}
