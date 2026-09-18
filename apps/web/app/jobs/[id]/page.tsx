export default function JobDetailPage({ params }: { params: { id: string } }) {
  return (
    <section className="card">
      <h2>Job Detail</h2>
      <p>Viewing details for <strong>{params.id}</strong>.</p>
      <p>Responsibilities, milestones, and proposals would be shown here.</p>
    </section>
  );
import { notFound } from "next/navigation";
import { jobs } from "../../../lib/mock";

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
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{job.title}</h1>
      <p className="text-lg text-gray-700 mb-2">
        <span className="font-semibold">Budget:</span> {job.budget}
      </p>
      <p className="text-sm text-gray-500">Job ID: {job.id}</p>
    </main>
  );
}

export function generateStaticParams() {
  return jobs.map((job) => ({
    id: job.id,
  }));
}

export function generateMetadata({ params }: JobDetailPageProps) {
  const job = jobs.find((j) => j.id === params.id);
  return {
    title: job ? `${job.title} — FreelanceFlow` : "Job Not Found",
  };
}
}
