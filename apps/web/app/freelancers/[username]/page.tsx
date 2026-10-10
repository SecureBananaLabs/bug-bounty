import { notFound } from "next/navigation";

import { freelancers } from "../../../lib/mock";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const profile = freelancers.find((item) => item.username === params.username);

  if (!profile) {
    notFound();
  }

  return (
    <section className="card">
      <h2>Freelancer Profile</h2>
      <p>Profile: <strong>{profile.username}</strong></p>
      <p>Rate: {profile.rate}</p>
      <p>Skills: {profile.skills.join(" · ")}</p>
      <p>Portfolio, reviews, and active proposals appear here.</p>
    </section>
  );
}
