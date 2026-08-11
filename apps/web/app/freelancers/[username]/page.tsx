import Link from "next/link";
import { freelancers } from "../../../lib/mock";

type FreelancerProfilePageProps = {
  params: Promise<{ username: string }>;
};

export default async function FreelancerProfilePage({ params }: FreelancerProfilePageProps) {
  const { username } = await params;
  const freelancer = freelancers.find((profile) => profile.username === username);

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer not found</h2>
        <p>No freelancer profile exists for <strong>{username}</strong>.</p>
        <Link href="/freelancers/search">Back to freelancer search</Link>
      </section>
    );
  }

  return (
    <section className="card">
      <p>{freelancer.title}</p>
      <h2>{freelancer.name}</h2>
      <p>{freelancer.bio}</p>
      <p>
        <strong>{freelancer.rate}</strong> · {freelancer.location} · {freelancer.availability}
      </p>
      <p>
        {freelancer.rating} rating across {freelancer.completedProjects} completed projects.
      </p>

      <h3>Core Skills</h3>
      <p>{freelancer.skills.join(" · ")}</p>

      <h3>Portfolio Highlights</h3>
      <ul>
        {freelancer.portfolio.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
