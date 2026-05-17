import { use as reactUse } from "react";

export default function FreelancerProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = reactUse(params);
  return (
    <section className="card">
      <h2>Freelancer Profile</h2>
      <p>Profile: <strong>{username}</strong></p>
      <p>Portfolio, reviews, and active proposals appear here.</p>
    </section>
  );
}
