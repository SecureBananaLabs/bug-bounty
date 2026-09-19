import Link from "next/link";
import { notFound } from "next/navigation";
import { freelancers } from "../../../lib/mock";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find((item) => item.username === params.username);

  if (!freelancer) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-slate-500">Freelancer profile</p>
        <h2 className="text-3xl font-semibold">{freelancer.username}</h2>
      </header>

      <article className="card space-y-3">
        <h3 className="text-lg font-semibold">Skills</h3>
        <div className="flex flex-wrap gap-2">
          {freelancer.skills.map((skill) => (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm" key={skill}>{skill}</span>
          ))}
        </div>
      </article>

      <article className="card space-y-3">
        <h3 className="text-lg font-semibold">Rate</h3>
        <p className="text-2xl font-semibold">{freelancer.rate}</p>
      </article>

      <div className="flex gap-3">
        <Link className="rounded bg-slate-900 px-4 py-2 text-white" href="/freelancers/search">Back to search</Link>
        <Link className="rounded border border-slate-300 px-4 py-2" href="/messaging">Open messaging</Link>
      </div>
    </section>
  );
}
