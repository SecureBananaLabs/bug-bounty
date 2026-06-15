import { freelancers } from "../../../lib/mock";

export default async function FreelancerProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const freelancer = freelancers.find((profile) => profile.username === username);

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer not found</h2>
        <p>No mock freelancer profile matches <strong>{username}</strong>.</p>
        <p>Return to search and choose an available freelancer profile.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{freelancer.username}</h2>
      <p><strong>Hourly rate:</strong> {freelancer.rate}</p>
      <p><strong>Skills:</strong> {freelancer.skills.join(", ")}</p>
      <p>This profile is ready for project matching, portfolio review, and proposal shortlisting.</p>
    </section>
  );
}
