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

export default function FreelancerProfile({ params }: { params: { username: string } }) {
  const { username } = params;
  
  const freelancer = freelancers.find(f => f.username === username);
  
  if (!freelancer) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">@{freelancer.username}</h1>
            <p className="text-lg text-gray-600">Hourly Rate: {freelancer.rate}</p>
          </div>
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {freelancer.skills.map((skill: string, index: number) => (
                <span 
                  key={index} 
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900">About</h3>
            <p className="mt-2 text-gray-600">
              Professional freelancer with expertise in {freelancer.skills.join(', ')}. 
              Available at {freelancer.rate} for new projects.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
}
