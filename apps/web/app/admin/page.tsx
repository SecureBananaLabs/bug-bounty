"use client";

import { useState, useEffect, useCallback } from "react";
import UserManagement from "./components/UserManagement";
import JobModeration from "./components/JobModeration";
import DisputeResolution from "./components/DisputeResolution";
import MetricsDashboard from "./components/MetricsDashboard";
import PlatformControls from "./components/PlatformControls";
import AuditLog from "./components/AuditLog";

const TABS = [
  { id: "metrics", label: "Dashboard" },
  { id: "users", label: "Users" },
  { id: "jobs", label: "Moderation" },
  { id: "disputes", label: "Disputes" },
  { id: "controls", label: "Controls" },
  { id: "audit", label: "Audit Log" },
];

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState("metrics");
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/admin/metrics")
      .then((r) => {
        setAuthorized(r.ok);
      })
      .catch(() => setAuthorized(false));
  }, []);

  if (authorized === null) {
    return <div className="card" role="status" aria-label="Loading admin panel">Loading admin panel...</div>;
  }

  if (!authorized) {
    return (
      <div className="card" role="alert">
        <h2>Access Denied</h2>
        <p>You do not have administrator privileges.</p>
      </div>
    );
  }

  return (
    <div className="admin-panel" style={{ maxWidth: 1200, margin: "0 auto", padding: "1rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Admin Panel</h1>

      <nav role="tablist" aria-label="Admin sections" style={{ display: "flex", gap: "0.25rem", marginBottom: "1.5rem", borderBottom: "2px solid #374151", paddingBottom: "0.5rem" }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "0.5rem 1rem",
              border: "none",
              background: activeTab === tab.id ? "#4f46e5" : "transparent",
              color: activeTab === tab.id ? "#fff" : "#9ca3af",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "0.875rem",
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={activeTab}>
        {activeTab === "metrics" && <MetricsDashboard />}
        {activeTab === "users" && <UserManagement />}
        {activeTab === "jobs" && <JobModeration />}
        {activeTab === "disputes" && <DisputeResolution />}
        {activeTab === "controls" && <PlatformControls />}
        {activeTab === "audit" && <AuditLog />}
      </div>
    </div>
  );
}
