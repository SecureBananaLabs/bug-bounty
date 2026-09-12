export default function AdminForbiddenPage() {
  return (
    <section className="admin-section" role="alert" aria-labelledby="admin-forbidden-title">
      <p className="eyebrow">403</p>
      <h2 id="admin-forbidden-title">Admin access required</h2>
      <p>This route only renders for authenticated admin sessions.</p>
    </section>
  );
}
