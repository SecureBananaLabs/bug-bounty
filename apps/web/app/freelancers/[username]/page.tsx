import Link from "next/link";
import { freelancers } from "../../../lib/mock";

export default async function FreelancerProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const freelancer = freelancers.find((profile) => profile.username === username);

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer not found</h2>
        <p>No mock freelancer exists for <strong>{username}</strong>.</p>
        <Link href="/freelancers/search">Back to freelancer search</Link>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{freelancer.name}</h2>
      <p><strong>{freelancer.headline}</strong></p>
      <p>{freelancer.bio}</p>
      <p><strong>Rate:</strong> {freelancer.rate}</p>
      <p><strong>Skills:</strong> {freelancer.skills.join(", ")}</p>
      <h3>Portfolio</h3>
      <ul>
        {freelancer.portfolio.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <Link href="/freelancers/search">Back to freelancer search</Link>
    </section>
  );
}
