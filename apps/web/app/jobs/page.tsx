"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { jobs } from "../../lib/mock";

export default function JobsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(jobs.map((job) => job.category)))],
    []
  );

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesQuery = !normalizedQuery || job.title.toLowerCase().includes(normalizedQuery);
      const matchesCategory = category === "All" || job.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [category, query]);

  const highestBudget = filteredJobs.reduce((max, job) => Math.max(max, job.budgetValue), 0);

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Job Listings</h2>
          <p className="muted">Search, filter, and compare open projects before sending a proposal.</p>
        </div>
        <Link className="button-link" href="/jobs/post">Post job</Link>
      </div>

      <div className="toolbar" aria-label="Job filters">
        <label>
          <span>Search</span>
          <input
            type="search"
            placeholder="Search by title"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <label>
          <span>Category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="summary-row" aria-label="Job listing summary">
        <strong>{filteredJobs.length}</strong>
        <span>matching projects</span>
        <strong>{category}</strong>
        <span>category</span>
        <strong>{highestBudget ? `$${highestBudget.toLocaleString()}` : "$0"}</strong>
        <span>top budget</span>
      </div>

      <div className="grid">
        {filteredJobs.map((job) => (
          <article className="card" key={job.id}>
            <h3>{job.title}</h3>
            <p className="muted">{job.category}</p>
            <p>{job.budget}</p>
            <Link className="text-link" href={`/jobs/${job.id}`}>View details</Link>
          </article>
        ))}
      </div>

      {!filteredJobs.length && (
        <p className="empty-state">No jobs match the current filters.</p>
      )}
    </section>
  );
}
