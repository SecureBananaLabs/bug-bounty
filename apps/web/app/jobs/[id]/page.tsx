import { getJobById } from "../../../lib/mock";
import { notFound } from "next/navigation";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = getJobById(params.id);

  if (!job) {
    notFound();
  }

  return (
    <section className="card p-6">
      <h2 className="text-2xl font-bold mb-4">{job.title}</h2>
      <div className="flex items-center text-gray-600 mb-6">
        <span className="font-semibold mr-2">Budget:</span>
        <span className="text-green-600 font-bold">{job.budget}</span>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Job Context</h3>
        <p className="text-gray-700 leading-relaxed">{job.context}</p>
      </div>
      <div className="mt-8">
        <p className="text-sm text-gray-500">ID: {job.id}</p>
      </div>
    </section>
  );
}
