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
    <main className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{freelancer.username}</h1>
        <p className="text-xl text-green-600 font-semibold mb-6">{freelancer.rate}</p>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {freelancer.skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </main>
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
    <main className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{freelancer.username}</h1>
        <p className="text-xl text-green-600 font-semibold mb-6">{freelancer.rate}</p>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {freelancer.skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export function generateStaticParams() {
  return freelancers.map((freelancer) => ({
    username: freelancer.username,
  }));
}

export const dynamicParams = true;
}

export function generateStaticParams() {
  return freelancers.map((freelancer) => ({
    username: freelancer.username,
  }));
}

export const dynamicParams = true;
}
