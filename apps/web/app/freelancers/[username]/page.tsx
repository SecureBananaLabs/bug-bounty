import { freelancers } from "@/lib/mock";
import { notFound } from "next/navigation";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find(f => f.username === params.username);

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer Not Found</h2>
        <p>No freelancer found with username: <strong>{params.username}</strong></p>
        <p>Please check the username and try again.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{freelancer.username}</h2>
      <p><strong>Rate:</strong> {freelancer.rate}</p>
      <p><strong>Skills:</strong> {freelancer.skills.join(", ")}</p>
      <p>Portfolio, reviews, and active proposals appear here.</p>
    </section>
  );
}
