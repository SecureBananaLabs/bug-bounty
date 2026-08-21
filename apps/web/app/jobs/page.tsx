"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { jobs } from "../../lib/mock";

const categories = ["All", ...Array.from(new Set(jobs.map((job) => job.category)))];

export default function JobsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesCategory = category === "All" || job.category === category;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        job.title.toLowerCase().includes(normalizedQuery) ||
        job.skills.some((skill) => skill.toLowerCase().includes(normalizedQuery));

      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  const totalBudget = filteredJobs.reduce((sum, job) => sum + job.budgetValue, 0);

  return (
    <section className="listing-stack">
      <div className="listing-header">
        <div>
          <h2>Job Listings</h2>
          <p>Search active projects by title, category, or required skills.</p>
        </div>
        <Link href="/jobs/post" className="primary-link">Post a job</Link>
      </div>

      <div className="toolbar">
        <label>
          <span>Search</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="API, AI, UX..."
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

      <div className="summary-row" aria-label="Filtered job summary">
        <div className="summary-card">
          <strong>{filteredJobs.length}</strong>
          <span>Matching jobs</span>
        </div>
        <div className="summary-card">
          <strong>${totalBudget.toLocaleString()}</strong>
          <span>Visible budget</span>
        </div>
        <div className="summary-card">
          <strong>{category}</strong>
          <span>Active filter</span>
        </div>
      </div>

      <div className="grid">
        {filteredJobs.map((job) => (
          <article className="card job-card" key={job.id}>
            <div>
              <p className="eyebrow">{job.category}</p>
              <h3>{job.title}</h3>
              <p>{job.budget}</p>
            </div>
            <div className="tag-row">
              {job.skills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
            <Link href={`/jobs/${job.id}`}>View details</Link>
          </article>
        ))}
      </div>

      {filteredJobs.length === 0 ? (
        <div className="card empty-state">
          <h3>No jobs match this search</h3>
          <p>Try another category or search term.</p>
        </div>
      ) : null}
    </section>
  );
}
