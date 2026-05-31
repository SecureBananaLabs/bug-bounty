export default function AdminForbiddenPage() {
  return (
    <section className="admin-section" aria-labelledby="admin-forbidden-title">
      <p className="admin-eyebrow">403</p>
      <h2 id="admin-forbidden-title">Admin access required</h2>
      <p>Sign in with an administrator account to manage users, listings, disputes, and controls.</p>
    </section>
  );
}
