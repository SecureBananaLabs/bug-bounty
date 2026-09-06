import { mockFreelancers } from '@/lib/mock';
import { Card } from '@freelanceflow/ui';

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function FreelancerProfile({ params }: PageProps) {
  const { username } = await params;
  const freelancer = mockFreelancers?.find(
    (f) => f.username === username
  );

  if (!freelancer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Freelancer Not Found</h1>
          <p className="text-gray-600">
            No freelancer with the username &quot;{username}&quot; exists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <h1 className="text-2xl font-bold mb-4">{freelancer.name}</h1>
        <p className="mb-2">
          <strong>Username:</strong> @{freelancer.username}
        </p>
        <p className="mb-2">
          <strong>Skills:</strong> {freelancer.skills?.join(', ') || 'N/A'}
        </p>
        <p className="mb-2">
          <strong>Hourly Rate:</strong> ${freelancer.hourlyRate ?? 'N/A'}
        </p>
      </Card>
    </div>
  );
}
