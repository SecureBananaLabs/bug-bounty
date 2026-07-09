import { notFound } from 'next/navigation';
import { jobs } from '../../lib/mock';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params;
  const job = jobs.find(j => j.id === id);
  if (!job) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Job Not Found</h1>
        <p>The job with ID &quot;{id}&quot; could not be found.</p>
      </div>
    );
  }
  return (
    <div style={{ padding: '2rem' }}>
      <h2>{job.title}</h2>
      <p>Budget: ${job.budget}</p>
    </div>
  );
}
