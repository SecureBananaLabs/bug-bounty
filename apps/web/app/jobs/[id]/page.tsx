import { notFound } from 'next/navigation';
import { getMockJobById } from '../../../lib/mock';

interface JobDetailPageProps {
  params: {
    id: string;
  };
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  const job = getMockJobById(params.id);

  if (!job) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{job.title}</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-4">
          <span className="text-gray-600">Budget:</span>
          <span className="ml-2 text-2xl font-semibold text-green-600">
            ${job.budget}
          </span>
        </div>
        <div className="mb-4">
          <span className="text-gray-600">Client:</span>
          <span className="ml-2">{job.clientName}</span>
        </div>
        <div className="mb-4">
          <span className="text-gray-600">Status:</span>
          <span className="ml-2 capitalize">{job.status}</span>
        </div>
        <div className="mb-4">
          <span className="text-gray-600">Posted:</span>
          <span className="ml-2">
            {new Date(job.createdAt).toLocaleDateString()}
          </span>
        </div>
        <p className="text-gray-700 mt-4">{job.description}</p>
      </div>
    </div>
  );
}
