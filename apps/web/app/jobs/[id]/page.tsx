import { notFound } from 'next/navigation';
import { getJobById } from '@/lib/mock';

interface JobDetailPageProps {
  params: {
    id: string;
  };
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  const job = getJobById(params.id);

  if (!job) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{job.title}</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-4">
          <span className="text-sm text-gray-500">Budget</span>
          <p className="text-2xl font-semibold text-green-600">${job.budget}</p>
        </div>
        <div className="mb-4">
          <span className="text-sm text-gray-500">Status</span>
          <p className="text-lg capitalize">{job.status}</p>
        </div>
        <div className="mb-4">
          <span className="text-sm text-gray-500">Description</span>
          <p className="text-gray-700 mt-1">{job.description}</p>
        </div>
        <div className="text-sm text-gray-400">
          Posted on {new Date(job.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
