import { notFound } from "next/navigation";
import { freelancers } from "../../../lib/mock";

export default async function FreelancerProfilePage({
  params
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const freelancer = freelancers.find((entry) => entry.username === username);

  if (!freelancer) {
    notFound();
  }

  return (
    <section className="card">
      <h2>{freelancer.name}</h2>
      <p><strong>@{freelancer.username}</strong></p>
      <p>{freelancer.headline}</p>
      <p><strong>Rate:</strong> {freelancer.rate}</p>
      <p><strong>Skills:</strong> {freelancer.skills.join(", ")}</p>
      <h3>Portfolio</h3>
      <ul>
        {freelancer.portfolio.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
