export default function ForbiddenAdminPage() {
  return (
    <section className="admin-forbidden" aria-labelledby="admin-forbidden-title">
      <p className="admin-kicker">403</p>
      <h1 id="admin-forbidden-title">Admin access required</h1>
      <p>This page is restricted to authenticated administrators.</p>
    </section>
  );
}
