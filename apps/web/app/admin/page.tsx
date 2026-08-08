"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "../../lib/adminApi";
import { isAdmin } from "../../lib/adminAuth";

export default function AdminPage() {
  const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    setIsAuthed(isAdmin());
    if (!isAdmin()) {
      setLoading(false);
      return;
    }
    adminApi
      .getMetrics()
      .then(setMetrics)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (isAuthed === false) {
    return (
      <section className="card">
        <h2>Admin Panel</h2>
        <p style={{ color: "#f87171" }}>Access Denied — you must be logged in as an admin.</p>
      </section>
    );
  }

  if (loading) {
    return (
      <section>
        <h2 style={{ marginBottom: "1rem" }}>Admin Panel</h2>
        <p style={{ color: "#94a3b8" }}>Loading metrics…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card">
        <h2>Admin Panel</h2>
        <p style={{ color: "#f87171" }}>Failed to load: {error}</p>
      </section>
    );
  }

  const cards = [
    {
      label: "Total Users",
      value: (metrics?.totalUsers as number) ?? "—",
      href: "/admin/users",
      color: "#818cf8",
    },
    {
      label: "Active Jobs",
      value: (metrics?.activeJobs as number) ?? "—",
      href: "/admin/jobs",
      color: "#34d399",
    },
    {
      label: "Open Disputes",
      value: (metrics?.openDisputes as number) ?? "—",
      href: "/admin/disputes",
      color: "#fb923c",
    },
    {
      label: "Flagged Listings",
      value: (metrics?.flaggedJobs as number) ?? "—",
      href: "/admin/jobs",
      color: "#f87171",
    },
    {
      label: "Revenue (30d)",
      value: metrics?.currentPeriodRevenue
        ? `$${(metrics.currentPeriodRevenue as number).toLocaleString()}`
        : "—",
      href: "/admin/disputes",
      color: "#fbbf24",
    },
  ];

  return (
    <section>
      <h2 style={{ marginBottom: "1.5rem" }}>Admin Panel</h2>
      <div className="grid">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="card metric-card" style={{ borderColor: card.color }}>
            <p className="metric-value" style={{ color: card.color }}>
              {card.value}
            </p>
            <p className="metric-label">{card.label}</p>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        <h3 style={{ marginBottom: "0.75rem" }}>Quick Actions</h3>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link href="/admin/users" className="card action-btn">Manage Users</Link>
          <Link href="/admin/jobs" className="card action-btn">Moderate Jobs</Link>
          <Link href="/admin/disputes" className="card action-btn">Resolve Disputes</Link>
          <Link href="/admin/audit-log" className="card action-btn">Audit Logs</Link>
          <Link href="/admin/settings" className="card action-btn">Platform Controls</Link>
        </div>
      </div>
    </section>
  );
}
