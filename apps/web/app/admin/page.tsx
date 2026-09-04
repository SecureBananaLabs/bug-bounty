const moderationMetrics = [
  { label: "Open Reports", value: "18", detail: "6 high priority" },
  { label: "Disputes", value: "7", detail: "2 need payout review" },
  { label: "Profile Reviews", value: "24", detail: "9 new today" },
  { label: "SLA Health", value: "93%", detail: "Average first action" }
];

const reviewQueues = [
  { queue: "Payment disputes", count: 2, priority: "High", action: "Review evidence" },
  { queue: "Flagged messages", count: 6, priority: "High", action: "Open conversation" },
  { queue: "Profile verification", count: 9, priority: "Medium", action: "Check documents" },
  { queue: "Job quality reports", count: 3, priority: "Medium", action: "Audit listing" }
];

const trustSignals = [
  { signal: "Chargeback risk", status: "Elevated", value: "3 accounts" },
  { signal: "Identity checks", status: "Stable", value: "91% clear" },
  { signal: "Message safety", status: "Watch", value: "11 flagged terms" }
];

const platformControls = [
  { area: "Escrow release", state: "Manual review", owner: "Trust Ops" },
  { area: "New freelancer intake", state: "Throttled", owner: "Marketplace" },
  { area: "High-risk jobs", state: "Approval required", owner: "Moderation" }
];

export default function AdminPanelPage() {
  return (
    <section>
      <div className="card">
        <h2>Admin Panel</h2>
        <p className="muted">Moderation, trust, and platform controls</p>
      </div>

      <div className="grid">
        {moderationMetrics.map((metric) => (
          <article className="card" key={metric.label}>
            <p className="muted">{metric.label}</p>
            <h3>{metric.value}</h3>
            <p>{metric.detail}</p>
          </article>
        ))}
      </div>

      <section className="card">
        <h3>Review Queues</h3>
        <div className="stack">
          {reviewQueues.map((item) => (
            <div className="status-row" key={item.queue}>
              <div>
                <strong>{item.queue}</strong>
                <p className="muted">{item.count} waiting</p>
              </div>
              <span className="pill">{item.priority}</span>
              <strong>{item.action}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Trust Signals</h3>
        <div className="grid">
          {trustSignals.map((signal) => (
            <div key={signal.signal}>
              <p className="muted">{signal.signal}</p>
              <h3>{signal.status}</h3>
              <p>{signal.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Platform Controls</h3>
        <div className="stack">
          {platformControls.map((control) => (
            <div className="status-row" key={control.area}>
              <strong>{control.area}</strong>
              <span className="pill">{control.state}</span>
              <span>{control.owner}</span>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
