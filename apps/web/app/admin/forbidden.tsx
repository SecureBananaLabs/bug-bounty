export default function AdminForbiddenPage() {
  return (
    <section className="admin-forbidden" aria-labelledby="admin-forbidden-title">
      <p className="eyebrow">403</p>
      <h2 id="admin-forbidden-title">Admin access required</h2>
      <p>Sign in with an admin session before opening the operations console.</p>
    </section>
  );
}
