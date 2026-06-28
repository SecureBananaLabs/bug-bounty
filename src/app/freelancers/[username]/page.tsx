import { notFound } from 'next/navigation';
import { getMockFreelancerByUserName } from '@/apps/web/lib/mock';

export default async function FreelancerProfilePage({
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
      <p className="text-gray-600 mb-4">{freelancer.bio}</p>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Skills</h2>
        <ul className="list-disc list-inside space-y-1">
          {freelancer.skills.map((skill, index) => (
            <li key={index}>{skill}</li>
          ))}
        </ul>

        <div className="mt-4">
          <h2 className="text-xl font-semibold">Rate</h2>
          <p className="text-blue-600 font-bold">
            ${freelancer.hourlyRate}/hour
          </p>
        </div>
      </div>
    </div>
  );
}