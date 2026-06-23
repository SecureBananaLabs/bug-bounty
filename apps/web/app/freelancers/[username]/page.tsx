import { freelancers } from "../../../lib/mock";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find((f) => f.username === params.username);

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer Not Found</h2>
        <p>No freelancer with username <strong>{params.username}</strong> was found.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Freelancer Profile</h2>
      <p>Username: <strong>{freelancer.username}</strong></p>
      <p>Rate: {freelancer.rate}</p>
      <p>Skills: {freelancer.skills.join(", ")}</p>
    </section>
  );
}
