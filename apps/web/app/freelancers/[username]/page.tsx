export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  return (
    <section className="card">
      <h2>Freelancer Profile</h2>
      <p>Profile: <strong>{params.username}</strong></p>
      <p>Portfolio, reviews, and active proposals appear here.</p>
    </section>
  );
import { freelancers } from '../../../lib/mock';
import { notFound } from 'next/navigation';

export default function FreelancerProfile({ params }: { params: { username: string } }) {
  const { username } = params;
  
  // Find the freelancer by username
  const freelancer = freelancers.find(f => f.username === username);
  
  // If freelancer not found, show 404
  if (!freelancer) {
    return notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/3">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-64 flex items-center justify-center">
                <span className="text-gray-500">Profile Image</span>
              </div>
              <div className="mt-4 text-center">
                <h1 className="text-2xl font-bold">@{freelancer.username}</h1>
                <p className="text-lg text-gray-600 mt-2">{freelancer.rate} • {freelancer.skills?.join(', ')}</p>
              </div>
            </div>
            <div className="md:w-2/3">
              <h2 className="text-3xl font-bold mb-6">About</h2>
              <p className="text-gray-700 mb-6">
                Experienced freelancer with skills in {freelancer.skills?.join(', ')} with a rate of {freelancer.rate}.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Skills:</h3>
                <ul className="list-disc pl-5">
                  {freelancer.skills?.map((skill: string) => (
                    <li key={skill} className="text-gray-700">{skill}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
}
