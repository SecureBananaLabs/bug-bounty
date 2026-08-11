import { notFound } from 'next/navigation';
import { mockJobs } from '../../lib/mock';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params;
  const job = mockJobs.find((j) => j.id === id);

  if (!job) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Job Not Found</h1>
        <p>The job with ID &quot;{id}&quot; could not be found.</p>
        <a href="/jobs" style={{ color: '#0070f3', textDecoration: 'underline' }}>
          Back to job listings
        </a>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>{job.title}</h1>
      <p style={{ fontSize: '1.2rem', color: '#333' }}>
        <strong>Budget:</strong> ${job.budget}
      </p>
      <p style={{ color: '#666' }}>
        <strong>Job ID:</strong> {job.id}
      </p>
      <a href="/jobs" style={{ color: '#0070f3', textDecoration: 'underline' }}>
        Back to job listings
      </a>
    </div>
  );
}
