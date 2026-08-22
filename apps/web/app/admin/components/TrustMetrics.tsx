type Props = {
  distribution: Array<{ label: string; count: number }>;
};

export function TrustMetrics({ distribution }: Props) {
  const max = Math.max(1, ...distribution.map((item) => item.count));

  return (
    <section className="admin-section" id="admin-trust" aria-labelledby="admin-trust-title">
      <div className="admin-section-heading">
        <div>
          <p className="admin-eyebrow">Trust & metrics</p>
          <h2 id="admin-trust-title">Trust scores</h2>
        </div>
      </div>
      <div className="admin-bars" role="img" aria-label="Trust score distribution">
        {distribution.map((item) => (
          <div className="admin-bar-row" key={item.label}>
            <span>{item.label}</span>
            <div className="admin-bar-track">
              <div className="admin-bar-fill" style={{ width: `${(item.count / max) * 100}%` }} />
            </div>
            <strong>{item.count}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
