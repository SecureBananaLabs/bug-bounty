import { notFound } from "next/navigation";
import { freelancers } from "../../../lib/mock";

export default async function FreelancerProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const freelancer = freelancers.find((entry) => entry.username === username);

  if (!freelancer) {
    notFound();
  }

  return (
    <section className="card">
      <h2>{freelancer.username}</h2>
      <p>Skills: <strong>{freelancer.skills.join(" · ")}</strong></p>
      <p>Rate: <strong>{freelancer.rate}</strong></p>
      <p>Portfolio, reviews, and active proposals for {freelancer.username} appear here.</p>
    </section>
  );
}
