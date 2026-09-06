import { freelancers } from "@/lib/mock";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find((f) => f.username === params.username);

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer Not Found</h2>
        <p>No freelancer found with username <strong>{params.username}</strong>.</p>
        <a href="/freelancers/search">Browse freelancers</a>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{freelancer.username}</h2>
      <p>Hourly Rate: <strong>{freelancer.rate}</strong></p>
      <div>
        <h3>Skills</h3>
        <ul>
          {freelancer.skills.map((skill) => (
            <li key={skill}>{skill}</li>
          ))}
        </ul>
      </div>
      <p>Portfolio, reviews, and active proposals appear here.</p>
    </section>
  );
}
