import { freelancers } from "../../../lib/mock";
import { notFound } from "next/navigation";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find((f) => f.username === params.username);

  if (!freelancer) {
    notFound();
  }

  return (
    <section className="card">
      <h2>{freelancer.username}</h2>
      <h3>Skills</h3>
      <ul>
        {freelancer.skills.map((skill) => (
          <li key={skill}>{skill}</li>
        ))}
      </ul>
      <p><strong>Rate:</strong> {freelancer.rate}</p>
    </section>
  );
}
