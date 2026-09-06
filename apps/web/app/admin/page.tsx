export default function AdminPanelPage() {
  const moderation = {
    queueSize: 12,
    trustScore: 94,
    platformControls: "Publish, suspend, and review workflows"
  };

  return (
    <section className="card">
      <h2>Admin Panel</h2>
      <div style={{ display: "grid", gap: "0.5rem" }}>
        <p>Moderation queue: {moderation.queueSize} items</p>
        <p>Trust metrics: {moderation.trustScore}%</p>
        <p>Platform controls: {moderation.platformControls}</p>
      </div>
    </section>
  );
}
