import { notFound } from "next/navigation";
import { freelancers } from "../../../lib/mock";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find((item) => item.username === params.username);

  if (!freelancer) {
    notFound();
  }

  return (
    <section className="card">
      <p style={{ color: "#93c5fd", fontWeight: 700, margin: 0 }}>{freelancer.username}</p>
      <h2>{freelancer.name}</h2>
      <p style={{ color: "#c7d2fe", lineHeight: 1.6 }}>{freelancer.headline}</p>
      <p>
        <strong>{freelancer.rate}</strong> - {freelancer.skills.join(", ")}
      </p>
      <h3>Portfolio</h3>
      <ul>
        {freelancer.portfolio.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <a href="/freelancers/search">Back to search</a>
    </section>
  );
}
