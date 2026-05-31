import Link from "next/link";
import { freelancers } from "../../../lib/mock";

type FreelancerProfilePageProps = {
  params: Promise<{ username: string }>;
};

export function generateStaticParams() {
  return freelancers.map((freelancer) => ({ username: freelancer.username }));
}

export default async function FreelancerProfilePage({ params }: FreelancerProfilePageProps) {
  const { username } = await params;
  const freelancer = freelancers.find((item) => item.username === username);

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer Not Found</h2>
        <p>No mock freelancer exists for <strong>{username}</strong>.</p>
        <Link href="/freelancers/search">Back to search</Link>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{freelancer.username}</h2>
      <p><strong>Skills:</strong> {freelancer.skills.join(" · ")}</p>
      <p><strong>Rate:</strong> {freelancer.rate}</p>
      <p>Portfolio, reviews, and active proposals appear here.</p>
      <Link href="/freelancers/search">Back to search</Link>
    </section>
  );
}
