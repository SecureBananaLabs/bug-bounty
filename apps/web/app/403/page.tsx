export default function ForbiddenPage() {
  return (
    <section className="card">
      <span className="eyebrow">403</span>
      <h2>Forbidden</h2>
      <p>Admin access is required for this area.</p>
      <p className="muted">Provide a valid admin JWT via the ff_access_token cookie or ?token= query param for preview.</p>
    </section>
  );
}
