export default function AdminForbiddenPage() {
  return (
    <section className="admin-ops" aria-labelledby="forbidden-title">
      <div className="admin-panel">
        <p className="admin-kicker">403</p>
        <h2 id="forbidden-title">Admin access required</h2>
        <p>
          The admin console route is guarded. Set an authenticated admin session before opening this page.
        </p>
      </div>
    </section>
  );
}
