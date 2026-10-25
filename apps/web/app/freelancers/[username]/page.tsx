import { notFound } from "next/navigation";
import { freelancers } from "../../../lib/mock";

type FreelancerProfilePageProps = {
  params: Promise<{ username: string }>;
};

export function generateStaticParams() {
  return freelancers.map((freelancer) => ({
    username: freelancer.username
  }));
}

export default async function FreelancerProfilePage({ params }: FreelancerProfilePageProps) {
  const { username } = await params;
  const freelancer = freelancers.find((profile) => profile.username === username);

  if (!freelancer) {
    notFound();
  }

  return (
    <section className="card">
      <h2>{freelancer.username}</h2>
      <p>{freelancer.skills.join(" · ")}</p>
      <p>{freelancer.rate}</p>
    </section>
  );
}
