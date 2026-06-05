export default function ForbiddenPage() {
  return (
    <section className="card" aria-labelledby="forbidden-title">
      <p className="eyebrow">403</p>
      <h2 id="forbidden-title">Admin access required</h2>
      <p>This route is limited to authenticated admins.</p>
    </section>
  );
}
