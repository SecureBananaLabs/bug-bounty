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

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  // Find the job in mock data
  const job = jobs.find(job => job.id === id);
  
  // If job not found, trigger 404
  if (!job) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Job Details</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">{job.title}</h2>
            <div className="flex items-center gap-4 text-lg text-gray-600">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                Budget: {job.budget}
              </span>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-xl font-medium text-gray-800 mb-4">Job Description</h3>
            <p className="text-gray-600">
              This is a placeholder for the detailed job description that would normally be displayed here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
}
