import { notFound } from "next/navigation";
import { findFreelancerByUsername, freelancers } from "../../../lib/mock";

export function generateStaticParams() {
  return freelancers.map((freelancer) => ({ username: freelancer.username }));
}

type FreelancerProfilePageProps = {
  params: Promise<{ username: string }>;
};

export default async function FreelancerProfilePage({ params }: FreelancerProfilePageProps) {
  const { username } = await params;
  const freelancer = findFreelancerByUsername(username);

  if (!freelancer) {
    notFound();
  }

  return (
    <section className="card">
      <h2>{freelancer.username}</h2>
      <p>{freelancer.summary}</p>
      <p>{freelancer.skills.join(" · ")}</p>
      <p>
        Rate: <strong>{freelancer.rate}</strong>
      </p>
    </section>
  );
}
