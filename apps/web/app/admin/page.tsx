const metrics = [
  { label: "Open reports", value: "18", detail: "6 high priority" },
  { label: "Trust reviews", value: "42", detail: "11 need identity checks" },
  { label: "Payout holds", value: "$4.8k", detail: "3 milestones flagged" }
];

const queues = [
  { name: "Disputed milestones", count: 3, priority: "High", action: "Review evidence" },
  { name: "Profile verification", count: 11, priority: "Medium", action: "Check documents" },
  { name: "Flagged proposals", count: 4, priority: "Medium", action: "Audit messages" }
];

const trustSignals = [
  "Two new clients exceeded normal refund volume",
  "One freelancer account changed payout method after award",
  "Three projects have deposits pending for more than 48 hours"
];

const controls = [
  { name: "New project posting", status: "Enabled", owner: "Marketplace ops" },
  { name: "Manual payout release", status: "Review required", owner: "Finance" },
  { name: "Automated identity checks", status: "Enabled", owner: "Trust team" }
];

export default function AdminPanelPage() {
  return (
    <section>
      <h2>Admin Panel</h2>

      <div className="grid">
        {metrics.map((metric) => (
          <article className="card" key={metric.label}>
            <h3>{metric.label}</h3>
            <p>{metric.value}</p>
            <p>{metric.detail}</p>
          </article>
        ))}
      </div>

      <section className="card">
        <h3>Moderation Queue</h3>
        <div className="grid">
          {queues.map((queue) => (
            <article key={queue.name}>
              <h4>{queue.name}</h4>
              <p>{queue.count} items - {queue.priority} priority</p>
              <button type="button">{queue.action}</button>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Trust Signals</h3>
        <ul>
          {trustSignals.map((signal) => (
            <li key={signal}>{signal}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h3>Platform Controls</h3>
        <div className="grid">
          {controls.map((control) => (
            <article key={control.name}>
              <h4>{control.name}</h4>
              <p>Status: {control.status}</p>
              <p>Owner: {control.owner}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
