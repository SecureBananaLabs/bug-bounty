export const jobs = [
  { id: "job-101", title: "Build an AI customer support widget", budget: "$1,500" },
  { id: "job-102", title: "Migrate legacy API to Node.js", budget: "$2,800" },
  { id: "job-103", title: "Design SaaS onboarding flows", budget: "$900" }
];
import { jobs } from '@/lib/mock';
import { notFound } from 'next/navigation';

export default function JobDetail({ params }: { params: { id: string } }) {
  const job = jobs.find(job => job.id === params.id);
  
  if (!job) {
    return notFound();
  }

  return (
    <div>
      <h1>Job Details</h1>
      <h2>{job.title}</h2>
      <p>Budget: {job.budget}</p>
      <p>ID: {params.id}</p>
    </div>
  );
}