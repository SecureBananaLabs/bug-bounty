"use client";

import { useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminRouteGuard } from "@/components/admin/AdminRouteGuard";

/**
 * Admin Panel — fully functional replacement for the placeholder.
 *
 * Access control:
 *  - Client-side: AdminRouteGuard verifies the JWT's admin role from the token
 *    and redirects non-admins / unauthenticated users. This is a UX guard only.
 *  - Server-side: every /api/admin/* route is protected by the adminAuth
 *    middleware, which re-verifies the JWT signature on each request and
 *    enforces role === "ADMIN". Client-side checks are never trusted alone.
 *
 * Layout:
 *  - Modular sections (metrics, users, jobs moderation, disputes, controls,
 *    audit log) each live in components/admin/sections and can be developed
 *    and tested independently.
 */
export default function AdminPanelPage() {
  useEffect(() => {
    document.title = "Admin Panel — FreelanceFlow";
  }, []);

  return (
    <AdminRouteGuard>
      <header style={{ marginBottom: "1rem" }}>
        <h1>Admin Panel</h1>
        <p style={{ color: "#8a93b8" }}>
          Freelance platform administration — users, jobs, disputes, and platform
          health.
        </p>
      </header>
      <AdminLayout />
    </AdminRouteGuard>
  );
}
