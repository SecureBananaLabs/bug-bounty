"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { jobs } from "../../lib/mock";

const categories = ["All", ...Array.from(new Set(jobs.map((job) => job.category)))];

export default function JobsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesQuery = job.title.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === "All" || job.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [query, category]);

  const totalBudget = filteredJobs.reduce((sum, job) => sum + Number(job.budget.replace(/[^0-9.]/g, "")), 0);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h2>Job Listings</h2>
        <p>Search, filter, and jump into posting or detailed job views.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="card space-y-2">
          <span className="text-sm text-slate-500">Search title</span>
          <input
            className="w-full rounded border border-slate-300 px-3 py-2"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search jobs..."
          />
        </label>
        <label className="card space-y-2">
          <span className="text-sm text-slate-500">Category</span>
          <select
            className="w-full rounded border border-slate-300 px-3 py-2"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <article className="card space-y-2">
          <span className="text-sm text-slate-500">Summary</span>
          <p><strong>{filteredJobs.length}</strong> matching jobs</p>
          <p><strong>${totalBudget.toLocaleString()}</strong> filtered budget</p>
        </article>
      </div>

      <div className="flex justify-end">
        <Link className="rounded bg-slate-900 px-4 py-2 text-white" href="/jobs/post">Post a job</Link>
      </div>

      <div className="grid gap-4">
        {filteredJobs.map((job) => (
          <article className="card" key={job.id}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold">{job.title}</h3>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{job.category}</span>
            </div>
            <p className="text-slate-600">Budget {job.budget}</p>
            <Link className="text-slate-900 underline" href={`/jobs/${job.id}`}>View details</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
