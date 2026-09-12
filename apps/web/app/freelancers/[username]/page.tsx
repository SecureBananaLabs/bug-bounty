import Link from "next/link";
import { freelancers } from "../../../lib/mock";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find((entry) => entry.username === params.username);

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer not found</h2>
        <p>No mock freelancer matches <strong>{params.username}</strong>.</p>
        <p>Use the seeded search results to open an available profile.</p>
        <Link href="/freelancers/search">Back to freelancer search</Link>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{freelancer.name}</h2>
      <p><strong>Username:</strong> {freelancer.username}</p>
      <p><strong>Rate:</strong> {freelancer.rate}</p>
      <p>{freelancer.headline}</p>
      <div>
        <h3>Skills</h3>
        <ul>
          {freelancer.skills.map((skill) => (
            <li key={skill}>{skill}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
