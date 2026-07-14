export default function NotificationsPage() {
  const alerts = [
    { label: "Proposal updates", detail: "A new proposal landed on job-102." },
    { label: "Unread messages", detail: "Jordan left you 2 unread messages." },
    { label: "Billing alerts", detail: "Your payout method was verified." }
  ];

  return (
    <section className="card">
      <h2>Notifications</h2>
      <div style={{ display: "grid", gap: "0.5rem" }}>
        {alerts.map((alert) => (
          <article key={alert.label}>
            <strong>{alert.label}</strong>
            <p>{alert.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
