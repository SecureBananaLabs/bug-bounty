import { jobs } from '../../../lib/mock';

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = jobs.find((j: { id: string }) => j.id === id);

  if (!job) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold">Job Not Found</h1>
        <p>The job with ID &quot;{id}&quot; does not exist.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">{job.title}</h1>
      <p className="text-lg text-gray-600">Budget: ${job.budget}</p>
    </div>
  );
}
