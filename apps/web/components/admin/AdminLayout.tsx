"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { isAdminToken } from "../../lib/admin";

type Section = "metrics" | "users" | "jobs" | "disputes" | "controls";

const NAV: { key: Section; label: string }[] = [
  { key: "metrics", label: "Trust & Metrics" },
  { key: "users", label: "User Management" },
  { key: "jobs", label: "Job Moderation" },
  { key: "disputes", label: "Disputes" },
  { key: "controls", label: "Platform Controls" }
];

export function AdminLayout({
  active,
  onNavigate,
  children
}: {
  active: Section;
  onNavigate: (s: Section) => void;
  children: ReactNode;
}) {
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    setAuthorized(isAdminToken());
  }, []);

  if (authorized === null) return null;

  if (!authorized) {
    return (
      <section className="card">
        <h2>403 — Forbidden</h2>
        <p>You do not have administrator access to this page.</p>
        <Link href="/" className="card" style={{ display: "inline-block", padding: "0.5rem 0.8rem" }}>
          Back to home
        </Link>
      </section>
    );
  }

  return (
    <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
      <nav style={{ minWidth: 180, display: "flex", flexDirection: "column", gap: 8 }}>
        {NAV.map((item) => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className="card"
            style={{
              textAlign: "left",
              cursor: "pointer",
              borderColor: active === item.key ? "#4f7cff" : "#2a3765"
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
