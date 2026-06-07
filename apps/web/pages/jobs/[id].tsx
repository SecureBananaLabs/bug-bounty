import { jobs } from '../../../lib/mock';

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = jobs.find((job) => job.id === params.id);

  if (!job) {
    return <div>Job not found</div>;
  }

  return (
    <div>
      <h1>{job.title}</h1>
      <p>Budget: {job.budget}</p>
    </div>
  );
}