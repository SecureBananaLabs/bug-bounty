"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminGuard } from "./AdminGuard";
import { MetricsCards } from "./MetricsCards";
import { TrustScoreChart } from "./TrustScoreChart";
import { UserManagement } from "./UserManagement";
import { JobModeration } from "./JobModeration";
import { DisputeResolution } from "./DisputeResolution";
import { PlatformControls } from "./PlatformControls";
import { AuditLog } from "./AuditLog";
import { apiGet, API_BASE } from "../../lib/api";

type Tab = "overview" | "users" | "jobs" | "disputes" | "controls" | "audit";

const tabs: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "users", label: "Users" },
  { key: "jobs", label: "Jobs" },
  { key: "disputes", label: "Disputes" },
  { key: "controls", label: "Controls" },
  { key: "audit", label: "Audit Log" },
];

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verify admin access on mount
  const checkAccess = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }
      // Try fetching metrics — if 403, not admin
      const res = await fetch(`${API_BASE}/admin/metrics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) {
        setError("Forbidden: Admin access required");
      } else if (!res.ok && res.status !== 401) {
        // Allow through — the API might not be running yet in dev
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  if (loading) {
    return (
      <section className="card">
        <h2>Admin Panel</h2>
        <p>Loading...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card">
        <h2>Admin Panel</h2>
        <p className="error">{error}</p>
        <p>You must be logged in as an admin to access this page.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Admin Panel</h2>

      {/* Tab Navigation */}
      <nav
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 20,
          borderBottom: "1px solid #333",
          paddingBottom: 8,
          flexWrap: "wrap",
        }}
        role="tablist"
        aria-label="Admin panel sections"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-controls={`tabpanel-${tab.key}`}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "0.5rem 1rem",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              background: activeTab === tab.key ? "#4a90d9" : "#2a2a2a",
              color: "#fff",
              fontSize: "0.9rem",
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <div role="tabpanel" id={`tabpanel-${activeTab}`}>
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "users" && <UserManagement />}
        {activeTab === "jobs" && <JobModeration />}
        {activeTab === "disputes" && <DisputeResolution />}
        {activeTab === "controls" && <PlatformControls />}
        {activeTab === "audit" && <AuditLog />}
      </div>
    </section>
  );
}

function OverviewTab() {
  return (
    <div>
      <MetricsCards />
      <TrustScoreChart />
    </div>
  );
}
