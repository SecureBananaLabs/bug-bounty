export default function JobDetailPage({ params }: { params: { id: string } }) {
  return (
    <section className="card">
      <h2>Job Detail</h2>
      <p>Viewing details for <strong>{params.id}</strong>.</p>
      <p>Responsibilities, milestones, and proposals would be shown here.</p>
    </section>
  );
import { notFound } from 'next/navigation';
import { jobs } from '@/lib/mock';

interface JobDetailPageProps {
  params: {
    id: string;
  };
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = params;
  
  // Find the job in mock data
  const job = jobs.find(job => job.id === id);
  
  // If job not found, show 404
  if (!job) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{job.title}</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Project Budget: {job.budget}</h2>
          </div>
          <div className="text-gray-600">
            <p className="mb-4">Project ID: {job.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
}
