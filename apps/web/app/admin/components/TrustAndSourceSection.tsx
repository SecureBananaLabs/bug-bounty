import type { MetricState } from "../types";

type TrustAndSourceSectionProps = {
  metrics: MetricState;
  dataSource: "api" | "demo";
};

export function TrustAndSourceSection({ metrics, dataSource }: TrustAndSourceSectionProps) {
  const maxTrustBucket = Math.max(1, ...metrics.trustScoreDistribution.map((bucket) => bucket.count));

  return (
    <section className="admin-section" aria-labelledby="trust-title">
      <div className="section-heading">
        <h3 id="trust-title">Trust Distribution</h3>
        <span className={`data-source-pill source-${dataSource}`}>{dataSource === "api" ? "API data" : "Demo fallback"}</span>
      </div>
      <div className="bar-chart" role="img" aria-label="Trust score distribution">
        {metrics.trustScoreDistribution.map((bucket) => (
          <div className="bar-row" key={bucket.label}>
            <span>{bucket.label}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(bucket.count / maxTrustBucket) * 100}%` }} />
            </div>
            <strong>{bucket.count}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
