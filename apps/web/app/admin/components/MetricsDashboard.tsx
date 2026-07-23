"use client";

import { useState, useEffect } from "react";

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/metrics");
      if (!res.ok) throw new Error("Failed to load metrics");
      const data = await res.json();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  if (loading) return <div role="status">Loading metrics...</div>;
  if (error) return <div role="alert" style={{ color: "red" }}>{error}</div>;
  if (!metrics) return null;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <SummaryCard label="Total Users" value={metrics.totalUsers} />
        <SummaryCard label="Active Jobs" value={metrics.activeJobs} />
        <SummaryCard label="Open Disputes" value={metrics.openDisputes} />
        <SummaryCard label="Flagged Listings" value={metrics.flaggedListings} />
        <SummaryCard label="Revenue" value={`$${(metrics.revenue / 100).toLocaleString()}`} />
      </div>

      <div className="card" style={{ padding: "1rem" }}>
        <h3 style={{ marginBottom: "0.75rem" }}>Trust Score Distribution</h3>
        {metrics.trustDistribution && Object.entries(metrics.trustDistribution).map(([range, count]: [string, any]) => (
          <div key={range} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span style={{ width: 80, fontSize: "0.875rem" }}>{range}</span>
            <div style={{ flex: 1, background: "#374151", borderRadius: 4, height: 20, overflow: "hidden" }}>
              <div style={{ width: `${(count / metrics.totalUsers) * 100}%`, background: "#4f46e5", height: "100%", borderRadius: 4, minWidth: count > 0 ? 8 : 0 }} />
            </div>
            <span style={{ fontSize: "0.875rem", minWidth: 30 }}>{count}</span>
          </div>
        ))}
      </div>

      <button onClick={fetchMetrics} style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: "#374151", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }} aria-label="Refresh metrics">
        Refresh
      </button>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card" style={{ padding: "1rem", textAlign: "center" }}>
      <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.25rem" }}>{label}</div>
      <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{value}</div>
    </div>
  );
}
