export default function JobDetailPage({ params }: { params: { id: string } }) {
  return (
    <section className="card">
      <h2>Job Detail</h2>
      <p>Viewing details for <strong>{params.id}</strong>.</p>
      <p>Responsibilities, milestones, and proposals would be shown here.</p>
    </section>
  );
import { notFound } from "next/navigation";
import { jobs } from "@/lib/mock";

interface JobDetailPageProps {
  params: {
    id: string;
  };
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  const job = jobs.find((j) => j.id === params.id);

  if (!job) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{job.title}</h1>
      <p className="text-lg text-gray-700 mb-2">
        <span className="font-semibold">Budget:</span> {job.budget}
      </p>
      <p className="text-sm text-gray-500">
        <span className="font-semibold">Job ID:</span> {job.id}
      </p>
    </div>
  );
}

export function generateStaticParams() {
  return jobs.map((job) => ({
    id: job.id,
  }));
}
}
