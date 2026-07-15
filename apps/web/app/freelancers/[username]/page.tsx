import Link from "next/link";
import { freelancers } from "../../../lib/mock";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find((candidate) => candidate.username === params.username);

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer not found</h2>
        <p>No mock freelancer exists for <strong>{params.username}</strong>.</p>
        <Link href="/freelancers/search">Back to freelancer search</Link>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{freelancer.username}</h2>
      <p><strong>Rate:</strong> {freelancer.rate}</p>
      <p><strong>Skills:</strong> {freelancer.skills.join(", ")}</p>
      <p>Portfolio, reviews, and active proposals appear here.</p>
      <Link href="/freelancers/search">Back to freelancer search</Link>
    </section>
  );
}
