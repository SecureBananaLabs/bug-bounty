import { notFound } from "next/navigation";
import { freelancers, getFreelancerByUsername } from "../../../lib/mock";

type FreelancerProfilePageProps = {
  params: Promise<{ username: string }>;
};

export function generateStaticParams() {
  return freelancers.map((freelancer) => ({ username: freelancer.username }));
}

export default async function FreelancerProfilePage({ params }: FreelancerProfilePageProps) {
  const { username } = await params;
  const freelancer = getFreelancerByUsername(username);

  if (!freelancer) {
    notFound();
  }

  return (
    <section className="card">
      <h2>{freelancer.displayName}</h2>
      <p>
        Profile: <strong>{freelancer.username}</strong>
      </p>
      <p>{freelancer.bio}</p>
      <p>
        <strong>Skills:</strong> {freelancer.skills.join(", ")}
      </p>
      <p>
        <strong>Rate:</strong> {freelancer.rate}
      </p>
    </section>
  );
}
