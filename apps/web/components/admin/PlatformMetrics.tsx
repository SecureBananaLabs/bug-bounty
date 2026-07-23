"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "../../lib/admin";

type Metrics = {
  totalUsers: number;
  activeJobs: number;
  openDisputes: number;
  flaggedListings: number;
  revenue: number;
  trustScoreDistribution: Record<string, number>;
};

export function PlatformMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setMetrics(await adminFetch<Metrics>("/admin/metrics"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load metrics");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <section className="card"><p>Error: {error}</p></section>;
  if (!metrics) return <section className="card"><p>Loading metrics…</p></section>;

  const cards = [
    { label: "Total Users", value: metrics.totalUsers },
    { label: "Active Jobs", value: metrics.activeJobs },
    { label: "Open Disputes", value: metrics.openDisputes },
    { label: "Flagged Listings", value: metrics.flaggedListings },
    { label: "Revenue (period)", value: `$${metrics.revenue.toLocaleString()}` }
  ];

  const dist = metrics.trustScoreDistribution;

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Trust & Metrics</h2>
        <button className="card" style={{ cursor: "pointer" }} onClick={load}>Refresh</button>
      </div>
      <div className="grid">
        {cards.map((c) => (
          <article className="card" key={c.label}>
            <h3>{c.label}</h3>
            <p style={{ fontSize: "1.6rem", fontWeight: 700 }}>{c.value}</p>
          </article>
        ))}
      </div>
      <article className="card">
        <h3>Trust Score Distribution</h3>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {Object.entries(dist).map(([bucket, count]) => (
            <li key={bucket} style={{ display: "flex", justifyContent: "space-between", padding: "0.25rem 0" }}>
              <span>{bucket}</span>
              <span>{count}</span>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
