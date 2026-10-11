export default function Forbidden() {
  return (
    <section className="admin-denied" role="alert" aria-labelledby="admin-denied-title">
      <p className="eyebrow">403</p>
      <h2 id="admin-denied-title">Admin access required</h2>
      <p>This route is limited to authenticated admins.</p>
    </section>
  );
}
