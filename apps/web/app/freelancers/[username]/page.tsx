import { freelancers } from "../../../lib/mock";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find((f) => f.username === params.username);

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer Not Found</h2>
        <p>No freelancer with username &quot;<strong>{params.username}</strong>&quot; exists.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Freelancer Profile</h2>
      <h3>{freelancer.username}</h3>
      <p>Skills: {freelancer.skills.join(" · ")}</p>
      <p>Rate: {freelancer.rate}</p>
      <p>Portfolio, reviews, and active proposals appear here.</p>
    </section>
  );
}
