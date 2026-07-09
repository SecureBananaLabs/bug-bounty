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
      <p className="text-lg text-gray-700 mb-4">
        <span className="font-semibold">Rate:</span> {freelancer.rate}
      </p>
      <div>
        <h2 className="text-xl font-semibold mb-2">Skills</h2>
        <ul className="flex flex-wrap gap-2">
          {freelancer.skills.map((skill) => (
            <li
              key={skill}
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
            >
              {skill}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

export function generateStaticParams() {
  return freelancers.map((f) => ({ username: f.username }));
}
}
