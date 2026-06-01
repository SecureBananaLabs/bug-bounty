import { freelancers } from "../../lib/mock";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find((f) => f.username === params.username);

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer Profile</h2>
        <p>
          No profile found for <strong>{params.username}</strong>.
        </p>
        <p>Please check the username and try again.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Freelancer Profile</h2>
      <p>
        <strong>Username:</strong> {freelancer.username}
      </p>
      <p>
        <strong>Skills:</strong> {freelancer.skills.join(", ")}
      </p>
      <p>
        <strong>Rate:</strong> {freelancer.rate}
      </p>
      <p>Portfolio, reviews, and active proposals appear here.</p>
    </section>
  );
}
