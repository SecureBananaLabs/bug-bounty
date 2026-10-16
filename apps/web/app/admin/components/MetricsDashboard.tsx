"use client";

import { useEffect, useState } from "react";

interface Metrics {
  totalUsers: number;
  activeUsers: number;
  flaggedUsers: number;
  suspendedUsers: number;
  totalJobs: number;
  pendingJobs: number;
  approvedJobs: number;
  openDisputes: number;
  recentAuditEntries: number;
}

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/metrics", { credentials: "include" })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setMetrics(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;
  if (!metrics) return <p>Failed to load metrics.</p>;

  const cards: { label: string; value: number; color?: string }[] = [
    { label: "Total Users", value: metrics.totalUsers },
    { label: "Active Users", value: metrics.activeUsers, color: "#16a34a" },
    { label: "Flagged Users", value: metrics.flaggedUsers, color: "#f59e0b" },
    { label: "Suspended Users", value: metrics.suspendedUsers, color: "#dc2626" },
    { label: "Total Jobs", value: metrics.totalJobs },
    { label: "Pending Jobs", value: metrics.pendingJobs, color: "#f59e0b" },
    { label: "Approved Jobs", value: metrics.approvedJobs, color: "#16a34a" },
    { label: "Open Disputes", value: metrics.openDisputes, color: "#dc2626" },
    { label: "Audit Entries", value: metrics.recentAuditEntries },
  ];

  return (
    <section>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>
        Platform Overview
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
        {cards.map((c) => (
          <div
            key={c.label}
            className="card"
            style={{ padding: "1rem", textAlign: "center" }}
          >
            <div style={{ fontSize: "2rem", fontWeight: 700, color: c.color ?? "var(--fg, #111)" }}>
              {c.value}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--muted, #6b7280)", marginTop: "0.25rem" }}>
              {c.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Skeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="card" style={{ padding: "1rem", height: 80, background: "var(--skeleton, #f3f4f6)" }} />
      ))}
    </div>
  );
}
