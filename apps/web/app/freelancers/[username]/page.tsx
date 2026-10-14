import { freelancers } from "../../../lib/mock";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find((f) => f.username === params.username);

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer Not Found</h2>
        <p>No freelancer matches the username &quot;{params.username}&quot;.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{freelancer.username}</h2>
      <p>Rate: <strong>{freelancer.rate}</strong></p>
      <p>Skills: {freelancer.skills.join(", ")}</p>
    </section>
  );
}
