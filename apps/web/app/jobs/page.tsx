"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { jobs } from "../../lib/mock";

export default function JobsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(jobs.map((j) => j.category)))],
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((j) => {
      if (q && !j.title.toLowerCase().includes(q)) return false;
      if (category !== "All" && j.category !== category) return false;
      return true;
    });
  }, [query, category]);

  const topBudget = filtered.reduce((max, j) => Math.max(max, j.budgetValue), 0);

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Job Listings</h2>
          <p className="muted">
            Search, filter, and compare open projects before sending a proposal.
          </p>
        </div>
        <Link className="button-link" href="/jobs/post">Post job</Link>
      </div>

      <div className="toolbar">
        <label>
          <span>Search</span>
          <input
            type="search"
            placeholder="Search by title…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          <span>Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="summary-row">
        <strong>{filtered.length}</strong> <span>matching ·</span>
        <strong>{category}</strong> <span>category ·</span>
        <strong>${topBudget.toLocaleString()}</strong> <span>top budget</span>
      </div>

      <div className="grid">
        {filtered.map((job) => (
          <article className="card" key={job.id}>
            <h3>{job.title}</h3>
            <p className="muted">{job.category}</p>
            <p>{job.budget}</p>
            <Link className="text-link" href={`/jobs/${job.id}`}>
              View details
            </Link>
          </article>
        ))}
        {filtered.length === 0 && (
          <p className="empty-state">No projects match your filters.</p>
        )}
      </div>
    </section>
  );
}
