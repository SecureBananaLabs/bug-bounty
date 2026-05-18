import { money } from "../format";
import type { MetricState } from "../types";

type MetricsGridProps = {
  metrics: MetricState;
  loading: boolean;
};

export function MetricsGrid({ metrics, loading }: MetricsGridProps) {
  return (
    <div className="admin-metric-grid" aria-busy={loading}>
      <Metric label="Total users" value={String(metrics.totalUsers)} />
      <Metric label="Active jobs" value={String(metrics.activeJobs)} />
      <Metric label="Open disputes" value={String(metrics.openDisputes)} tone="warning" />
      <Metric label="Flagged listings" value={String(metrics.flaggedListings)} tone="danger" />
      <Metric label="Period revenue" value={money(metrics.revenueCurrentPeriod)} tone="success" />
    </div>
  );
}

function Metric({ label, value, tone = "default" }: { label: string; value: string; tone?: string }) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
