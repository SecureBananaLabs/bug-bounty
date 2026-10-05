import { notFound } from 'next/navigation';
import { mockJobs } from '@/lib/mock';

interface JobDetailPageProps {
  params: {
    id: string;
  };
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  const job = mockJobs.find(j => j.id === params.id);

  if (!job) {
    notFound();
  }

  return (
    <div>
      <h1>{job.title}</h1>
      <p>Budget: ${job.budget}</p>
    </div>
  );
}
