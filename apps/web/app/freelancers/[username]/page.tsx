import { freelancers, Freelancer } from '@/lib/mock';
import { notFound } from 'next/navigation';
import { Card } from '@freelanceflow/ui';

interface Props {
  params: Promise<{ username: string }>;
}

export default async function FreelancerProfilePage({ params }: Props) {
  const { username } = await params;
  const freelancer: Freelancer | undefined = freelancers.find(
    (f) => f.username === username
  );

  if (!freelancer) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <h1 className="text-3xl font-bold mb-2">{freelancer.name}</h1>
        <p className="text-gray-600 mb-4">@{freelancer.username}</p>
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {freelancer.skills.map((skill) => (
              <span
                key={skill}
                className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Hourly Rate</h2>
          <p className="text-lg text-green-700">${freelancer.hourlyRate}/hr</p>
        </div>
      </Card>
    </div>
  );
}
