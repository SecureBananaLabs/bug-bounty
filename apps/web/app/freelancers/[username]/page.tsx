import { freelancers } from "../../../lib/mock";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find((profile) => profile.username === params.username);

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer not found</h2>
        <p>
          No freelancer profile exists for <strong>{params.username}</strong>.
        </p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Freelancer Profile</h2>
      <p>
        Profile: <strong>{freelancer.username}</strong>
      </p>
      <p>Skills: {freelancer.skills.join(", ")}</p>
      <p>Hourly rate: {freelancer.rate}</p>
      <p>Portfolio, reviews, and active proposals appear here.</p>
    </section>
  );
}
