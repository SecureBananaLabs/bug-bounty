"use client";

import { useEffect, useState } from "react";
import { apiGet } from "../../lib/api";

interface Metrics {
  totalUsers: number;
  activeJobs: number;
  openDisputes: number;
  flaggedListings: number;
  revenue: number;
}

export function MetricsCards() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet<Metrics>("/admin/metrics");
      setMetrics(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <div style={{ padding: 16 }}>Loading metrics...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 16 }}>
        <p className="error">Failed to load metrics: {error}</p>
        <button onClick={load} style={{ marginTop: 8 }}>
          Retry
        </button>
      </div>
    );
  }

  if (!metrics) return null;

  const cards = [
    { label: "Total Users", value: metrics.totalUsers },
    { label: "Active Jobs", value: metrics.activeJobs },
    { label: "Open Disputes", value: metrics.openDisputes },
    { label: "Flagged Listings", value: metrics.flaggedListings },
    { label: "Revenue", value: `$${metrics.revenue.toLocaleString()}` },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 12,
        marginBottom: 20,
      }}
    >
      {cards.map((card) => (
        <div
          key={card.label}
          className="card"
          style={{ textAlign: "center", padding: "1rem" }}
        >
          <div style={{ fontSize: "1.8rem", fontWeight: "bold" }}>
            {card.value}
          </div>
          <div style={{ fontSize: "0.85rem", color: "#888" }}>
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}
