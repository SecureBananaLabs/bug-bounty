import { notFound } from "next/navigation";
import { freelancers } from "../../../lib/mock";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find((f) => f.username === params.username);

  if (!freelancer) {
    notFound();
  }

  return (
    <section className="card">
      <h2>{freelancer.username}</h2>
      <p>
        <strong>Skills:</strong> {freelancer.skills.join(" · ")}
      </p>
      <p>
        <strong>Rate:</strong> {freelancer.rate}
      </p>
      <p>Portfolio, reviews, and active proposals appear here.</p>
    </section>
  );
}
