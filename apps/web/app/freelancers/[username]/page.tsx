import Link from "next/link";
import { freelancers } from "../../../lib/mock";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find((entry) => entry.username === params.username);

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer not found</h2>
        <p>No mock freelancer matches <strong>{params.username}</strong>.</p>
        <Link href="/freelancers/search">Back to freelancer search</Link>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{freelancer.username}</h2>
      <p><strong>Skills:</strong> {freelancer.skills.join(" · ")}</p>
      <p><strong>Rate:</strong> {freelancer.rate}</p>
      <p>Portfolio, reviews, and active proposals would be layered onto this profile view.</p>
    </section>
  );
}
