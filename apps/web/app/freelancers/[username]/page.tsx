import Link from "next/link";
import { freelancers } from "../../../lib/mock";

export default async function FreelancerProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const freelancer = freelancers.find((entry) => entry.username === username);

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer not found</h2>
        <p>No mock freelancer profile exists for <strong>{username}</strong>.</p>
        <Link href="/freelancers/search">Back to freelancer search</Link>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Freelancer Profile</h2>
      <p>Profile: <strong>{freelancer.username}</strong></p>
      <p>Hourly rate: <strong>{freelancer.rate}</strong></p>
      <p>Skills: {freelancer.skills.join(" · ")}</p>
      <p>Portfolio, reviews, and active proposals appear here.</p>
    </section>
  );
}
