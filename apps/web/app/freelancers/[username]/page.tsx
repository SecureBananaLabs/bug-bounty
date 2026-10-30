import { freelancers } from "@/lib/mock";
import Link from "next/link";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find((f) => f.username === params.username);

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer Profile</h2>
        <p>Profile: <strong>{params.username}</strong></p>
        <p>Freelancer not found.</p>
        <Link href="/freelancers/search">Back to search</Link>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Freelancer Profile</h2>
      <p>Username: <strong>{freelancer.username}</strong></p>
      <p>Skills: {freelancer.skills.join(", ")}</p>
      <p>Hourly Rate: {freelancer.rate}</p>
      <Link href="/freelancers/search">Back to search</Link>
    </section>
  );
}
