import { notFound } from 'next/navigation';
import { mockFreelancers } from '@/lib/mock';

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function FreelancerProfilePage({ params }: PageProps) {
  const { username } = await params;
  const freelancer = mockFreelancers.find(
    (f) => f.username === username
  );

  if (!freelancer) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center gap-4 mb-6">
          {freelancer.avatar && (
            <img
              src={freelancer.avatar}
              alt={freelancer.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">{freelancer.name}</h1>
            {freelancer.title && (
              <p className="text-gray-600">{freelancer.title}</p>
            )}
          </div>
        </div>

        {freelancer.bio && (
          <p className="text-gray-700 mb-4">{freelancer.bio}</p>
        )}

        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {freelancer.skills?.map((skill: string) => (
              <span
                key={skill}
                className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-lg">
          <span className="font-semibold">Hourly Rate:</span>
          <span className="text-green-600">${freelancer.hourlyRate}/hr</span>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  const freelancer = mockFreelancers.find(
    (f) => f.username === username
  );

  if (!freelancer) {
    return { title: 'Freelancer Not Found' };
  }

  return {
    title: `${freelancer.name} - FreelanceFlow`,
    description: freelancer.bio || `View ${freelancer.name}'s profile`,
  };
}
