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
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{freelancer.username}</h2>
      <p>{freelancer.skills.join(" / ")}</p>
      <p>{freelancer.rate}</p>
      <p>Portfolio, reviews, and active proposals appear here.</p>
    </section>
  );
}
