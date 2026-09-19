export default function ForbiddenPage() {
  return (
    <section className="admin-section" role="alert" aria-labelledby="forbidden-title">
      <h2 id="forbidden-title">403 - Admin access required</h2>
      <p className="quiet">This route is only available to authenticated administrators.</p>
    </section>
  );
}
