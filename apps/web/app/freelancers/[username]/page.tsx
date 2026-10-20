import { notFound } from "next/navigation";
import { freelancers } from "../../lib/mock";

export default function FreelancerProfilePage({
  params,
}: {
  params: { username: string };
}) {
  // Resolve the freelancer profile from the mock store by username.
  // Previously the page displayed params.username as-is without checking
  // whether the profile existed, so any path like /freelancers/hacker
  // would render a page with no real data instead of returning 404.
  const freelancer = freelancers.find((f) => f.username === params.username);
  if (!freelancer) {
    notFound();
  }

  return (
    <section className="card">
      <h2>Freelancer Profile</h2>
      <p>
        <strong>{freelancer.username}</strong>
      </p>
      <p>Rate: {freelancer.rate}</p>
      <p>Skills: {freelancer.skills.join(", ")}</p>
      <p>Portfolio, reviews, and active proposals appear here.</p>
    </section>
  );
}
