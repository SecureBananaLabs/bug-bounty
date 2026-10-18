import Link from "next/link";
import { freelancers } from "../../../lib/mock";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find((entry) => entry.username === params.username);

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer not found</h2>
        <p>
          We could not find a freelancer profile for <strong>{params.username}</strong>.
        </p>
        <Link href="/freelancers/search">Back to freelancer search</Link>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Freelancer Profile</h2>
      <p>
        Profile: <strong>{freelancer.username}</strong>
      </p>
      <p>{freelancer.skills.join(" · ")}</p>
      <p>{freelancer.rate}</p>
      <p>Portfolio, reviews, and active proposals appear here.</p>
    </section>
  );
}
