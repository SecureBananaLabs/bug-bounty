import { freelancers } from "@/lib/mock";
import Link from "next/link";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const profile = freelancers.find(f => f.username === params.username);
  if (!profile) {
    return (
      <section className="card">
        <h2>Freelancer Not Found</h2>
        <p>No freelancer found with username <strong>{params.username}</strong>.</p>
        <Link href="/freelancers/search">Browse freelancers</Link>
      </section>
    );
  }
  return (
    <section className="card">
      <h2>{profile.username}</h2>
      <p>Skills: {profile.skills.join(", ")}</p>
      <p>Rate: {profile.rate}</p>
    </section>
  );
}
