import Link from "next/link";
import { notFound } from "next/navigation";
import { freelancers, getFreelancerByUsername } from "../../../lib/mock";

type FreelancerPageProps = {
  params: Promise<{ username: string }>;
};

export function generateStaticParams() {
  return freelancers.map((freelancer) => ({ username: freelancer.username }));
}

export default async function FreelancerDetailPage({ params }: FreelancerPageProps) {
  const { username } = await params;
  const freelancer = getFreelancerByUsername(username);

  if (!freelancer) {
    notFound();
  }

  return (
    <section className="card">
      <p>{freelancer.username}</p>
      <h2>{freelancer.name}</h2>
      <h3>{freelancer.headline}</h3>
      <p>{freelancer.bio}</p>
      <p>
        <strong>Rate:</strong> {freelancer.rate}
      </p>
      <p>
        <strong>Skills:</strong> {freelancer.skills.join(", ")}
      </p>
      <Link href="/freelancers/search">Back to freelancer search</Link>
    </section>
  );
}
