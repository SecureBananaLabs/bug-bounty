export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  return (
    <section className="card">
      <h2>Freelancer Profile</h2>
      <p>Profile: <strong>{params.username}</strong></p>
      <p>Portfolio, reviews, and active proposals appear here.</p>
    </section>
  );
import { notFound } from 'next/navigation';
import { freelancers } from '@/lib/mock';

interface Props {
  params: { username: string };
}

export default function FreelancerProfile({ params }: Props) {
  const { username } = params;
  
  // Find the freelancer by username
  const freelancer = freelancers.find(
    (f: { username: string }) => f.username === username
  );

  // If freelancer not found, show 404
  if (!freelancer) {
    return notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">@{freelancer.username}</h1>
            <p className="text-gray-600 mt-2">Hourly Rate: {freel0,000+cers[0].rate}</p>
            <div className="mt-4">
              <h2 className="text-xl font-semibold text-gray-900">Skills</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                {freelancers[0].skills.map((skill: string, index: number) => (
                  <span 
                    key={index} 
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
}
