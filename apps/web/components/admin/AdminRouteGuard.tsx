"use client";
import { getAdminFromToken, ApiError } from "../../lib/api";
import { useEffect, useState } from "react";

/**
 * Route guard for the admin panel.
 *
 * SECURITY: the server-side adminAuth middleware is the authoritative
 * authorization check. Every API route is guarded server-side and re-verifies
 * the JWT on each request. This hook is a client-side convenience that redirects
 * non-admins and unauthenticated users away from the panel — it is NOT a
 * security boundary.
 */
export function useAdminSession() {
  const [admin, setAdmin] = useState<{ sub: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const profile = getAdminFromToken();
    setAdmin(profile);
    setLoading(false);
  }, []);

  return { admin, loading, isAuthenticated: !!admin, isAdmin: admin?.role === "admin" };
}

/**
 * Client-side redirect guard.
 *
 * - No token         => redirect to /admin/login
 * - Token but not admin => show 403 (server-side would return 403 too)
 */
export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated, isAdmin } = useAdminSession();

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!isAuthenticated) {
    if (typeof window !== "undefined") {
      window.location.assign("/admin/login");
    }
    return null;
  }

  if (!isAdmin) {
    return (
      <section className="card" role="alert" aria-label="Forbidden">
        <h2>403 — Forbidden</h2>
        <p>You must be an admin to access this page.</p>
      </section>
    );
  }

  return <>{children}</>;
}

export function LoadingSkeleton() {
  return (
    <section className="card" aria-label="Loading">
      <p>Loading admin panel…</p>
    </section>
  );
}

export { ApiError };
