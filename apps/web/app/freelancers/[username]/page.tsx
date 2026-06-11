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
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{freelancer.username}</h1>
      <div className="mb-4">
        <p className="text-lg font-semibold text-green-600">{freelancer.rate}</p>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Skills</h2>
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
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return freelancers.map((freelancer) => ({
    username: freelancer.username,
  }));
}
}
