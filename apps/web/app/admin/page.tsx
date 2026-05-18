"use client";

import { useState } from "react";
import MetricsDashboard from "./components/MetricsDashboard";
import UserManagement from "./components/UserManagement";
import JobManagement from "./components/JobManagement";
import DisputeResolution from "./components/DisputeResolution";
import AuditLog from "./components/AuditLog";
import FlagManagement from "./components/FlagManagement";
import SettingsPanel from "./components/SettingsPanel";

const TABS = [
  { key: "metrics",    label: "Metrics" },
  { key: "users",      label: "Users" },
  { key: "jobs",       label: "Jobs" },
  { key: "disputes",   label: "Disputes" },
  { key: "flags",      label: "Flags" },
  { key: "audit",      label: "Audit Log" },
  { key: "settings",   label: "Settings" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("metrics");

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.25rem" }}>
        Admin Panel
      </h1>
      <p style={{ color: "var(--muted, #6b7280)", marginBottom: "1.5rem" }}>
        Manage users, jobs, disputes, and platform settings.
      </p>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", marginBottom: "1.5rem", borderBottom: "2px solid var(--border, #e5e7eb)", paddingBottom: "0.5rem" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: "0.4rem 1rem",
              border: "none",
              borderRadius: "6px 6px 0 0",
              background: activeTab === t.key ? "var(--accent, #2563eb)" : "transparent",
              color: activeTab === t.key ? "#fff" : "var(--fg, #111827)",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "0.875rem",
              transition: "background 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="card" style={{ padding: "1.5rem" }}>
        {activeTab === "metrics"    && <MetricsDashboard />}
        {activeTab === "users"      && <UserManagement />}
        {activeTab === "jobs"       && <JobManagement />}
        {activeTab === "disputes"   && <DisputeResolution />}
        {activeTab === "flags"      && <FlagManagement />}
        {activeTab === "audit"      && <AuditLog />}
        {activeTab === "settings"   && <SettingsPanel />}
      </div>
    </div>
  );
}
