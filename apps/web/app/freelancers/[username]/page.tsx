export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  return (
    <section className="card">
      <h2>Freelancer Profile</h2>
      <p>Profile: <strong>{params.username}</strong></p>
      <p>Portfolio, reviews, and active proposals appear here.</p>
    </section>
  );
import { notFound } from "next/navigation";
import { freelancers } from "../../../lib/mock";

interface FreelancerProfilePageProps {
  params: {
    username: string;
  };
}

export default function FreelancerProfilePage({ params }: FreelancerProfilePageProps) {
  const freelancer = freelancers.find((f) => f.username === params.username);

  if (!freelancer) {
    notFound();
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">{freelancer.username}</h1>
      <p className="text-lg text-gray-700 mb-4">{freelancer.rate}</p>
      <div className="flex flex-wrap gap-2">
        {freelancer.skills.map((skill) => (
          <span
            key={skill}
            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
          >
            {skill}
          </span>
        ))}
      </div>
export default function NotFound() {
  return (
    <main className="max-w-2xl mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">Freelancer Not Found</h1>
      <p className="text-gray-600">
        We couldn&apos;t find a freelancer with that username. Please check the URL or try searching.
      </p>
    </main>
  );
}
    </main>
  );
}

export function generateStaticParams() {
  return freelancers.map((freelancer) => ({
    username: freelancer.username,
  }));
}
}
