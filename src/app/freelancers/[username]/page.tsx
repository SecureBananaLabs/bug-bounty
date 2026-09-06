import { notFound } from 'next/navigation';
import { getMockFreelancerByUserName } from '@/apps/web/lib/mock';

export default async function FreelancerPage({
  params,
}: {
  params: { username: string };
}) {
  const freelancer = await getMockFreelancerByUserName(params.username);

  if (!freelancer) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{freelancer.name}</h1>
      <p className="text-gray-600 mb-4">
        {freelancer.bio}
      </p>

      <div className="space-y-4">
        {freelancer.skills.map((skill, index) => (
          <div
            key={index}
            className="bg-blue-50 border-l-4 border-blue-500 p-3"
          >
            <span className="text-blue-800 font-medium">{skill}</span>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Rate</h2>
        <p className="text-gray-700">
          ${freelancer.hourlyRate}/hour
        </p>
      </div>
    </div>
  );
}