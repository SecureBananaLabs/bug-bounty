"use client";
import type { AdminMetrics } from "../../lib/api";

/**
 * Trust score distribution chart (horizontal bar chart).
 *
 * Renders a simple, accessible bar per bucket. No external charting dependency.
 */
export function TrustScoreChart({
  distribution,
  totalUsers,
}: {
  distribution: AdminMetrics["trustScoreDistribution"];
  totalUsers: number;
}) {
  const buckets = Object.entries(distribution) as [string, number][];
  const max = Math.max(...buckets.map(([, v]) => v), 1);

  return (
    <section className="card" aria-label="Trust score distribution">
      <h3>Trust Score Distribution</h3>
      <div className="trust-chart">
        {buckets.map(([label, count]) => {
          const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
          const barWidth = max > 0 ? Math.round((count / max) * 100) : 0;
          const ariaLabel = `${label}: ${count} users (${pct}%)`;
          return (
            <div key={label} className="trust-row">
              <label htmlFor={`trust-bar-${label}`} className="trust-label">
                {label}
              </label>
              <div className="trust-track" role="img" aria-label={ariaLabel}>
                <div
                  id={`trust-bar-${label}`}
                  className="trust-bar"
                  role="progressbar"
                  aria-valuenow={count}
                  aria-valuemin={0}
                  aria-valuemax={max}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <span className="trust-count" aria-label={`${count} users`}>
                {count} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
