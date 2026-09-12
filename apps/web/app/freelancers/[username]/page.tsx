import Link from "next/link";
import { freelancers } from "../../../lib/mock";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find((profile) => profile.username === params.username);

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer Not Found</h2>
        <p>No freelancer profile matches <strong>{params.username}</strong>.</p>
        <Link href="/freelancers/search">Back to freelancer search</Link>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{freelancer.username}</h2>
      <p>{freelancer.rate}</p>
      <h3>Skills</h3>
      <ul>
        {freelancer.skills.map((skill) => (
          <li key={skill}>{skill}</li>
        ))}
      </ul>
      <Link href="/freelancers/search">Back to freelancer search</Link>
    </section>
  );
}
