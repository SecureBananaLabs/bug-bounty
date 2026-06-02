import { freelancers } from "../../../lib/mock";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find((entry) => entry.username === params.username);

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer Profile</h2>
        <p>No freelancer profile found for <strong>{params.username}</strong>.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Freelancer Profile</h2>
      <p>Profile: <strong>{freelancer.username}</strong></p>
      <p>Skills: {freelancer.skills.join(", ")}</p>
      <p>Rate: {freelancer.rate}</p>
    </section>
  );
}
