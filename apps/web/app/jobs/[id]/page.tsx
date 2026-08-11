import Link from "next/link";
import { notFound } from "next/navigation";
import { jobs } from "../../../lib/mock";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = jobs.find((item) => item.id === params.id);

  if (!job) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-slate-500">Job detail</p>
        <h2 className="text-3xl font-semibold">{job.title}</h2>
        <p className="text-slate-600">Budget {job.budget}</p>
      </header>

      <article className="card space-y-3">
        <h3 className="text-lg font-semibold">Scope</h3>
        <p>This mock listing represents a {job.category.toLowerCase()} project on the marketplace.</p>
        <ul className="grid gap-2 md:grid-cols-2 text-slate-700">
          <li>• Milestones and proposals would appear here.</li>
          <li>• Client notes and deadlines would appear here.</li>
          <li>• Messages can be handled in the messaging flow.</li>
          <li>• Payments and billing connect to the billing page.</li>
        </ul>
      </article>

      <div className="flex gap-3">
        <Link className="rounded bg-slate-900 px-4 py-2 text-white" href="/jobs">Back to jobs</Link>
        <Link className="rounded border border-slate-300 px-4 py-2" href="/messaging">Open messaging</Link>
      </div>
    </section>
  );
}
