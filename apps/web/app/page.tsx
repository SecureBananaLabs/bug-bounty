import Link from "next/link";
import { freelancers, jobs } from "../lib/mock";

export default function LandingPage() {
  const stats = [
    { label: "Live jobs", value: "3" },
    { label: "Available freelancers", value: String(freelancers.length) },
    { label: "Open categories", value: "2" },
    { label: "Active budget", value: "$5.2k" }
  ];

  return (
    <main className="space-y-8">
      <section className="space-y-4">
        <p className="text-sm uppercase tracking-wide text-slate-500">Freelance marketplace</p>
        <h2 className="text-4xl font-semibold">Find talent, ship work, keep the money moving.</h2>
        <p className="max-w-2xl text-slate-600">
          Browse live jobs, vet freelancers, post new work, and jump straight into billing and messaging without hunting through menus.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link className="rounded bg-slate-900 px-4 py-2 text-white" href="/jobs">Browse jobs</Link>
          <Link className="rounded border border-slate-300 px-4 py-2" href="/jobs/post">Post a job</Link>
          <Link className="rounded border border-slate-300 px-4 py-2" href="/freelancers/search">Find freelancers</Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article className="card" key={stat.label}>
            <p className="text-sm text-slate-500">{stat.label}</p>
            <h3 className="text-2xl font-semibold">{stat.value}</h3>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="card">
          <h3 className="mb-3 text-xl font-semibold">Featured jobs</h3>
          <div className="space-y-3">
            {jobs.map((job) => (
              <div className="rounded border border-slate-200 p-3" key={job.id}>
                <div className="flex items-center justify-between gap-3">
                  <strong>{job.title}</strong>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{job.category}</span>
                </div>
                <p className="text-slate-600">Budget {job.budget}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <h3 className="mb-3 text-xl font-semibold">Next steps</h3>
          <ul className="space-y-2 text-slate-700">
            <li>• Post a job if you need help today.</li>
            <li>• Search freelancers to shortlist talent.</li>
            <li>• Open billing to scan invoices and payouts.</li>
            <li>• Use messaging to keep project coordination tight.</li>
          </ul>
        </article>
      </section>
    </main>
  );
}
