"use client";
import { useState, useEffect } from "react";
import { api, type AdminMetrics } from "../../../lib/api";
import { TrustScoreChart } from "../TrustScoreChart";

/** Metrics + trust-score dashboard section. Loads on mount; refresh button re-fetches. */
export function MetricsSection() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setMetrics(await api.metrics());
    } catch (e: any) {
      setError(e?.message ?? "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <section aria-label="Platform metrics dashboard">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h2>Trust & Metrics Dashboard</h2>
        <button
          onClick={load}
          disabled={loading}
          aria-label="Refresh metrics"
          className="refresh-btn"
          type="button"
        >
          ↻ Refresh
        </button>
      </div>

      {loading && (
        <div className="card" aria-label="Loading" aria-busy="true">
          Loading metrics…
        </div>
      )}
      {error && (
        <div className="card" role="alert" aria-label="Error">
          Error: {error}
        </div>
      )}

      {metrics && (
        <>
          <div className="summary-grid">
            <SummaryCard label="Total Users" value={metrics.totalUsers} ariaLabel={`${metrics.totalUsers} total users`} />
            <SummaryCard label="Active Jobs" value={metrics.activeJobs} ariaLabel={`${metrics.activeJobs} active jobs`} />
            <SummaryCard label="Open Disputes" value={metrics.openDisputes} ariaLabel={`${metrics.openDisputes} open disputes`} />
            <SummaryCard label="Flagged Listings" value={metrics.flaggedListings} ariaLabel={`${metrics.flaggedListings} flagged listings`} />
            <SummaryCard
              label="Revenue (current period)"
              value={`$${metrics.monthlyVolume.toLocaleString()}`}
              ariaLabel={`$${metrics.monthlyVolume.toLocaleString()} revenue`}
            />
          </div>

          <div className="grid">
            <TrustScoreChart distribution={metrics.trustScoreDistribution} totalUsers={metrics.totalUsers} />
          </div>
        </>
      )}
    </section>
  );
}

function SummaryCard({
  label,
  value,
  ariaLabel,
}: {
  label: string;
  value: string | number;
  ariaLabel: string;
}) {
  return (
    <div className="card summary-card" aria-label={ariaLabel}>
      <div className="stat">{value}</div>
      <div className="label">{label}</div>
    </div>
  );
}
