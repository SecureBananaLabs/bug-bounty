import { freelancers } from "../../../lib/mock";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const profile = freelancers.find(f => f.username === params.username);

  if (!profile) {
    return (
      <section className="card">
        <h2>Freelancer Profile</h2>
        <p>Profile: <strong>{params.username}</strong> not found.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Freelancer Profile</h2>
      <p>Profile: <strong>{profile.username}</strong></p>
      <p>Rate: {profile.rate}</p>
      <p>Skills: {profile.skills.join(", ")}</p>
      <p>Portfolio, reviews, and active proposals appear here.</p>
    </section>
  );
}
