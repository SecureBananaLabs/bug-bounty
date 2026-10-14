import { notFound } from 'next/navigation';
import { getMockFreelancer } from '@/apps/web/lib/mock';

export default async function FreelancerProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const freelancer = await getMockFreelancer(params.username);

  if (!freelancer) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{freelancer.name}</h1>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">About</h2>
          <p className="text-gray-600">{freelancer.bio}</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Skills</h2>
          <ul className="list-disc list-inside space-y-1">
            {freelancer.skills.map((skill, index) => (
              <li key={index} className="text-gray-700">
                {skill}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Rate</h2>
          <p className="text-2xl font-bold text-blue-600">
            ${freelancer.hourlyRate}/hour
          </p>
        </div>
      </div>
    </div>
  );
}