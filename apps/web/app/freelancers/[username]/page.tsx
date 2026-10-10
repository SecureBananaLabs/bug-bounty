import { notFound } from "next/navigation";
import { freelancers } from "../../../lib/mock";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find((profile) => profile.username === params.username);

  if (!freelancer) {
    notFound();
  }

  return (
    <section className="card">
      <h2>{freelancer.username}</h2>
      <p>Skills: <strong>{freelancer.skills.join(", ")}</strong></p>
      <p>Rate: <strong>{freelancer.rate}</strong></p>
      <p>Portfolio, reviews, and active proposals appear here.</p>
    </section>
  );
}
