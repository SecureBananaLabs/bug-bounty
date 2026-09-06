import { freelancers } from "../../lib/mock";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find((f) => f.username === params.username);

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer Not Found</h2>
        <p>No freelancer found with username <strong>{params.username}</strong>.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Freelancer Profile</h2>
      <p>Profile: <strong>{freelancer.username}</strong></p>
      <p>Skills: <strong>{freelancer.skills.join(", ")}</strong></p>
      <p>Rate: <strong>{freelancer.rate}</strong></p>
    </section>
  );
}
