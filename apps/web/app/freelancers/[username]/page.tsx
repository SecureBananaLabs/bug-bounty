import { freelancers } from "../../../lib/mock";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find((f) => f.username === params.username);

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer Not Found</h2>
        <p>No freelancer found with username &quot;{params.username}&quot;.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Freelancer Profile</h2>
      <p>Username: <strong>{freelancer.username}</strong></p>
      <p>Skills: {freelancer.skills.join(", ")}</p>
      <p>Rate: {freelancer.rate}</p>
      <p>Portfolio, reviews, and active proposals appear here.</p>
    </section>
  );
}
