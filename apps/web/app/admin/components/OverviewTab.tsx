"use client";

import { useState } from "react";

// ---------------------------------------------------------------------------
// Mock data – mirrors the shape returned by GET /admin/metrics and
// GET /admin/trust-scores.  In production these would be fetched via
// `fetch("/api/admin/metrics")` etc.
// ---------------------------------------------------------------------------

const MOCK_METRICS = {
  openJobs: 42,
  activeFreelancers: 185,
  flaggedAccounts: 3,
  totalUsers: 1240,
  openDisputes: 7,
  flaggedJobs: 3,
  monthlyVolume: 128900
};

const MOCK_TRUST_DISTRIBUTION: Record<string, number> = {
  "0-20": 12,
  "21-40": 34,
  "41-60": 98,
  "61-80": 320,
  "81-100": 776
};

export function OverviewTab() {
  const [metrics] = useState(MOCK_METRICS);
  const [trust] = useState(MOCK_TRUST_DISTRIBUTION);

  const cards: { label: string; value: string | number }[] = [
    { label: "Total Users", value: metrics.totalUsers },
    { label: "Open Jobs", value: metrics.openJobs },
    { label: "Active Freelancers", value: metrics.activeFreelancers },
    { label: "Flagged Accounts", value: metrics.flaggedAccounts },
    { label: "Open Disputes", value: metrics.openDisputes },
    { label: "Flagged Jobs", value: metrics.flaggedJobs },
    { label: "Monthly Volume", value: `$${metrics.monthlyVolume.toLocaleString()}` }
  ];

  const maxBucket = Math.max(...Object.values(trust), 1);

  return (
    <div>
      {/* ---- KPI Cards ---- */}
      <h3>Dashboard KPIs</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
        {cards.map((c) => (
          <div key={c.label} className="card" style={{ padding: 16 }}>
            <small style={{ color: "#666" }}>{c.label}</small>
            <p style={{ fontSize: "1.5rem", fontWeight: 700, margin: "4px 0 0" }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* ---- Trust Score Distribution ---- */}
      <h3>Trust Score Distribution</h3>
      <div className="card" style={{ padding: 16 }}>
        {Object.entries(trust).map(([range, count]) => (
          <div key={range} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ width: 60, fontSize: 13, color: "#555" }}>{range}</span>
            <div
              style={{
                flex: 1,
                background: "#eee",
                borderRadius: 4,
                height: 20,
                overflow: "hidden"
              }}
            >
              <div
                style={{
                  width: `${(count / maxBucket) * 100}%`,
                  background: "#0070f3",
                  height: "100%",
                  borderRadius: 4,
                  transition: "width 0.3s"
                }}
                role="progressbar"
                aria-valuenow={count}
                aria-valuemin={0}
                aria-valuemax={maxBucket}
                aria-label={`${range}: ${count} users`}
              />
            </div>
            <span style={{ width: 40, textAlign: "right", fontSize: 13 }}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
