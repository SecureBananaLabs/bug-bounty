import { freelancers } from "../../../lib/mock";
import Link from "next/link";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find((f) => f.username === params.username);

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer not found</h2>
        <p>No profile matches &quot;{params.username}&quot;.</p>
        <Link href="/freelancers/search">← Back to search</Link>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{freelancer.username}</h2>
      <p><strong>Skills:</strong> {freelancer.skills.join(" · ")}</p>
      <p><strong>Rate:</strong> {freelancer.rate}</p>
      <Link href="/freelancers/search">← Back to search</Link>
    </section>
  );
}
