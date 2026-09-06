import { freelancers } from "../../../lib/mock";

interface FreelancerProfile {
  username: string;
  skills: string[];
  rate: string;
}

export default async function FreelancerProfilePage({
  params
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params;
  const freelancer: FreelancerProfile | undefined = freelancers.find(
    (f) => f.username === username
  );

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer Not Found</h2>
        <p>The profile <strong>{username}</strong> does not exist.</p>
        <p><a href="/freelancers/search">Browse all freelancers</a></p>
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
