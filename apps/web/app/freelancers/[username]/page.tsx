export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  return (
    <section className="card">
      <h2>Freelancer Profile</h2>
      <p>Profile: <strong>{params.username}</strong></p>
      <p>Portfolio, reviews, and active proposals appear here.</p>
    </section>
  );
import { notFound } from 'next/navigation';
import { freelancers } from '../../lib/mock';

interface Freelancer {
  username: string;
  skills: string[];
  rate: string;
}

export default function FreelancerProfile({ params }: { params: { username: string } }) {
  const { username } = params;
  
  // Find the freelancer by username from mock data
  const freelancer = freelancers.find((f: any) => f.username === username);
  
  // If freelancer not found, trigger 404
  if (!freelancer) {
    notFound();
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Freelancer Profile: {freelancer.username}</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {freelancer.skills.map((skill: string, index: number) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-3">Rate</h2>
            <p className="text-lg font-medium">{freelancer.rate}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
}
