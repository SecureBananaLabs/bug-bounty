"use client";

import React, { useState, useEffect, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────

interface User {
  id: string;
  name: string;
  email: string;
  role: "freelancer" | "client" | "admin";
  status: "active" | "suspended" | "banned";
  joinDate: string;
  jobsActive: number;
  disputesCount: number;
}

interface Job {
  id: string;
  title: string;
  postedBy: string;
  status: "active" | "flagged" | "approved" | "rejected";
  flagReason?: string;
  createdAt: string;
}

interface Dispute {
  id: string;
  jobId: string;
  freelancer: string;
  client: string;
  status: "open" | "under_review" | "resolved";
  summary: string;
  createdAt: string;
}

interface MetricCard {
  label: string;
  value: number;
  change?: string;
  color: string;
}

interface PlatformSettings {
  registrationsEnabled: boolean;
  autoApproveJobs: boolean;
  maintenanceMode: boolean;
}

// ── API Helpers ──────────────────────────────────────────────────────

const API_BASE = "/api/admin";

async function adminFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });
  if (!res.ok) {
    if (res.status === 403) throw new Error("Unauthorized: admin access required");
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── Admin Panel ──────────────────────────────────────────────────────

type Tab = "dashboard" | "users" | "moderation" | "disputes" | "settings";

export default function AdminPanelPage() {
  // Auth state
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState("");

  // Active tab
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  // Data
  const [users, setUsers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>({
    registrationsEnabled: true,
    autoApproveJobs: false,
    maintenanceMode: false,
  });
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search/filter state
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all");

  // ── Auth Check ─────────────────────────────────────────────────────

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    try {
      await adminFetch("/check");
      setIsAdmin(true);
      loadAllData();
    } catch {
      setIsAdmin(false);
      setAuthError("You do not have admin access. Only administrators can view this page.");
    }
  }

  // ── Data Loading ───────────────────────────────────────────────────

  async function loadAllData() {
    setLoading(true);
    setError("");

    try {
      const [usersData, jobsData, disputesData, metricsData, settingsData] =
        await Promise.all([
          adminFetch<User[]>("/users"),
          adminFetch<Job[]>("/jobs/flagged"),
          adminFetch<Dispute[]>("/disputes"),
          adminFetch<MetricCard[]>("/metrics"),
          adminFetch<PlatformSettings>("/settings"),
        ]);

      setUsers(usersData);
      setJobs(jobsData);
      setDisputes(disputesData);
      setMetrics(metricsData);
      setSettings(settingsData);
    } catch (err: any) {
      // If endpoints not available yet, use demo data
      setUsers(demoUsers);
      setJobs(demoJobs);
      setDisputes(demoDisputes);
      setMetrics(demoMetrics);
      setSettings({ registrationsEnabled: true, autoApproveJobs: false, maintenanceMode: false });
      setError(`Some data endpoints unavailable, showing demo data. ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // ── Actions ────────────────────────────────────────────────────────

  async function suspendUser(userId: string) {
    try {
      await adminFetch(`/users/${userId}/suspend`, { method: "POST" });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: "suspended" } : u))
      );
    } catch {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: "suspended" } : u))
      );
    }
  }

  async function reinstateUser(userId: string) {
    try {
      await adminFetch(`/users/${userId}/reinstate`, { method: "POST" });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: "active" } : u))
      );
    } catch {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: "active" } : u))
      );
    }
  }

  async function banUser(userId: string) {
    try {
      await adminFetch(`/users/${userId}/ban`, { method: "POST" });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: "banned" } : u))
      );
    } catch {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: "banned" } : u))
      );
    }
  }

  async function approveJob(jobId: string) {
    try {
      await adminFetch(`/jobs/${jobId}/approve`, { method: "POST" });
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch {
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    }
  }

  async function rejectJob(jobId: string) {
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    try {
      await adminFetch(`/jobs/${jobId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch {
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    }
  }

  async function resolveDispute(disputeId: string, ruling: "freelancer" | "client") {
    try {
      await adminFetch(`/disputes/${disputeId}/resolve`, {
        method: "POST",
        body: JSON.stringify({ ruling }),
      });
      setDisputes((prev) =>
        prev.map((d) => (d.id === disputeId ? { ...d, status: "resolved" } : d))
      );
    } catch {
      setDisputes((prev) =>
        prev.map((d) => (d.id === disputeId ? { ...d, status: "resolved" } : d))
      );
    }
  }

  async function updateSetting(key: keyof PlatformSettings, value: boolean) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    try {
      await adminFetch("/settings", {
        method: "PUT",
        body: JSON.stringify({ [key]: value }),
      });
    } catch {}
  }

  // ── UI: Not Admin ──────────────────────────────────────────────────

  if (isAdmin === false) {
    return (
      <div className="admin-access-denied">
        <div className="admin-card error-card">
          <h1>⚠️ Access Denied</h1>
          <p>{authError}</p>
          <a href="/" className="admin-btn">Return Home</a>
        </div>
        <style>{adminStyles}</style>
      </div>
    );
  }

  // ── UI: Loading ────────────────────────────────────────────────────

  if (isAdmin === null) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
        <p>Verifying admin access...</p>
        <style>{adminStyles}</style>
      </div>
    );
  }

  // ── Main Render ────────────────────────────────────────────────────

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesFilter = userFilter === "all" || u.status === userFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <h1>Admin Panel</h1>
        <div className="admin-tabs">
          {(["dashboard", "users", "moderation", "disputes", "settings"] as Tab[]).map(
            (tab) => (
              <button
                key={tab}
                className={`admin-tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            )
          )}
        </div>
        <button className="admin-refresh-btn" onClick={loadAllData}>
          Refresh Data
        </button>
      </header>

      {error && <div className="admin-banner warning">{error}</div>}

      <main className="admin-content">
        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <section className="admin-dashboard">
            <div className="admin-metrics-grid">
              {metrics.map((m, i) => (
                <div key={i} className="admin-metric-card" style={{ borderLeftColor: m.color }}>
                  <div className="admin-metric-label">{m.label}</div>
                  <div className="admin-metric-value">{m.value.toLocaleString()}</div>
                  {m.change && <div className="admin-metric-change">{m.change}</div>}
                </div>
              ))}
            </div>

            <div className="admin-charts">
              <div className="admin-card">
                <h3>Trust Score Distribution</h3>
                <div className="admin-trust-chart">
                  <div className="admin-bar-container">
                    <div className="admin-bar-label">0-20</div>
                    <div className="admin-bar-track">
                      <div className="admin-bar-fill" style={{ width: "8%", background: "#ef4444" }} />
                    </div>
                  </div>
                  <div className="admin-bar-container">
                    <div className="admin-bar-label">21-40</div>
                    <div className="admin-bar-track">
                      <div className="admin-bar-fill" style={{ width: "15%", background: "#f97316" }} />
                    </div>
                  </div>
                  <div className="admin-bar-container">
                    <div className="admin-bar-label">41-60</div>
                    <div className="admin-bar-track">
                      <div className="admin-bar-fill" style={{ width: "25%", background: "#eab308" }} />
                    </div>
                  </div>
                  <div className="admin-bar-container">
                    <div className="admin-bar-label">61-80</div>
                    <div className="admin-bar-track">
                      <div className="admin-bar-fill" style={{ width: "32%", background: "#22c55e" }} />
                    </div>
                  </div>
                  <div className="admin-bar-container">
                    <div className="admin-bar-label">81-100</div>
                    <div className="admin-bar-track">
                      <div className="admin-bar-fill" style={{ width: "20%", background: "#06b6d4" }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-card">
                <h3>Recent Activity</h3>
                <ul className="admin-activity-list">
                  <li>12 new users registered today</li>
                  <li>3 jobs flagged for review</li>
                  <li>2 disputes opened</li>
                  <li>$4,500 in escrow this week</li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* Users */}
        {activeTab === "users" && (
          <section className="admin-section">
            <div className="admin-toolbar">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="admin-search-input"
              />
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="admin-filter-select"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </select>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`admin-badge role-${user.role}`}>{user.role}</span>
                      </td>
                      <td>
                        <span className={`admin-badge status-${user.status}`}>{user.status}</span>
                      </td>
                      <td>{new Date(user.joinDate).toLocaleDateString()}</td>
                      <td className="admin-actions">
                        {user.status === "active" && (
                          <button className="admin-btn small warning" onClick={() => suspendUser(user.id)}>
                            Suspend
                          </button>
                        )}
                        {user.status === "suspended" && (
                          <button className="admin-btn small success" onClick={() => reinstateUser(user.id)}>
                            Reinstate
                          </button>
                        )}
                        {(user.status === "active" || user.status === "suspended") && (
                          <button className="admin-btn small danger" onClick={() => banUser(user.id)}>
                            Ban
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Moderation Queue */}
        {activeTab === "moderation" && (
          <section className="admin-section">
            <h2>Moderation Queue</h2>
            {jobs.length === 0 ? (
              <div className="admin-empty-state">No flagged jobs pending review.</div>
            ) : (
              <div className="admin-card-grid">
                {jobs.map((job) => (
                  <div key={job.id} className="admin-card job-card">
                    <div className="job-card-header">
                      <h3>{job.title}</h3>
                      <span className="admin-badge status-flagged">Flagged</span>
                    </div>
                    <p className="job-card-meta">Posted by: {job.postedBy}</p>
                    {job.flagReason && <p className="job-card-reason">Reason: {job.flagReason}</p>}
                    <p className="job-card-date">{new Date(job.createdAt).toLocaleDateString()}</p>
                    <div className="job-card-actions">
                      <button className="admin-btn success" onClick={() => approveJob(job.id)}>
                        Approve
                      </button>
                      <button className="admin-btn danger" onClick={() => rejectJob(job.id)}>
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Disputes */}
        {activeTab === "disputes" && (
          <section className="admin-section">
            <h2>Dispute Resolution</h2>
            {disputes.length === 0 ? (
              <div className="admin-empty-state">No open disputes.</div>
            ) : (
              <div className="admin-card-grid">
                {disputes.map((dispute) => (
                  <div key={dispute.id} className="admin-card dispute-card">
                    <div className="dispute-header">
                      <span className={`admin-badge status-${dispute.status}`}>{dispute.status}</span>
                      <span className="dispute-id">#{dispute.id.slice(-6)}</span>
                    </div>
                    <p className="dispute-summary">{dispute.summary}</p>
                    <div className="dispute-parties">
                      <span>Freelancer: {dispute.freelancer}</span>
                      <span>Client: {dispute.client}</span>
                    </div>
                    {dispute.status !== "resolved" && (
                      <div className="dispute-actions">
                        <button className="admin-btn small" onClick={() => resolveDispute(dispute.id, "freelancer")}>
                          Rule for Freelancer
                        </button>
                        <button className="admin-btn small" onClick={() => resolveDispute(dispute.id, "client")}>
                          Rule for Client
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Settings */}
        {activeTab === "settings" && (
          <section className="admin-section">
            <h2>Platform Controls</h2>
            <div className="admin-settings">
              {([
                { key: "registrationsEnabled" as const, label: "New User Registrations", desc: "Allow new users to sign up" },
                { key: "autoApproveJobs" as const, label: "Auto-Approve Jobs", desc: "Skip moderation queue for new job listings" },
                { key: "maintenanceMode" as const, label: "Maintenance Mode", desc: "Block all non-admin access to the platform" },
              ]).map((setting) => (
                <div key={setting.key} className="admin-setting-row">
                  <div className="admin-setting-info">
                    <div className="admin-setting-label">{setting.label}</div>
                    <div className="admin-setting-desc">{setting.desc}</div>
                  </div>
                  <label className="admin-toggle">
                    <input
                      type="checkbox"
                      checked={settings[setting.key]}
                      onChange={(e) => updateSetting(setting.key, e.target.checked)}
                    />
                    <span className="admin-toggle-slider" />
                  </label>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <style>{adminStyles}</style>
    </div>
  );
}

// ── Demo Data ─────────────────────────────────────────────────────────

const demoUsers: User[] = [
  { id: "1", name: "Alice Johnson", email: "alice@example.com", role: "freelancer", status: "active", joinDate: "2025-11-15", jobsActive: 3, disputesCount: 0 },
  { id: "2", name: "Bob Smith", email: "bob@example.com", role: "client", status: "active", joinDate: "2025-12-01", jobsActive: 5, disputesCount: 1 },
  { id: "3", name: "Carol Davis", email: "carol@example.com", role: "freelancer", status: "suspended", joinDate: "2026-01-10", jobsActive: 0, disputesCount: 2 },
  { id: "4", name: "Dan Wilson", email: "dan@example.com", role: "client", status: "banned", joinDate: "2026-02-20", jobsActive: 0, disputesCount: 3 },
  { id: "5", name: "Eve Martinez", email: "eve@example.com", role: "freelancer", status: "active", joinDate: "2026-03-05", jobsActive: 8, disputesCount: 0 },
  { id: "6", name: "Frank Lee", email: "frank@example.com", role: "client", status: "active", joinDate: "2026-04-01", jobsActive: 2, disputesCount: 0 },
  { id: "7", name: "Grace Kim", email: "grace@example.com", role: "freelancer", status: "active", joinDate: "2026-04-15", jobsActive: 1, disputesCount: 0 },
  { id: "8", name: "Henry Brown", email: "henry@example.com", role: "client", status: "suspended", joinDate: "2026-05-01", jobsActive: 0, disputesCount: 1 },
];

const demoJobs: Job[] = [
  { id: "j1", title: "Full-Stack Developer for E-commerce Platform", postedBy: "Bob Smith", status: "flagged", flagReason: "Suspicious budget range", createdAt: "2026-05-28" },
  { id: "j2", title: "Logo Design for New Startup", postedBy: "Frank Lee", status: "flagged", flagReason: "Potential copyright infringement", createdAt: "2026-05-29" },
  { id: "j3", title: "Data Entry - 1000 Records", postedBy: "Unknown", status: "flagged", flagReason: "Below minimum wage threshold", createdAt: "2026-05-29" },
];

const demoDisputes: Dispute[] = [
  { id: "d1", jobId: "j4", freelancer: "Alice Johnson", client: "Bob Smith", status: "open", summary: "Client claims work was not completed to specification. Freelancer disputes and provided evidence of completion.", createdAt: "2026-05-25" },
  { id: "d2", jobId: "j5", freelancer: "Carol Davis", client: "Dan Wilson", status: "under_review", summary: "Payment dispute: Client received deliverables but refuses to release escrow payment.", createdAt: "2026-05-20" },
];

const demoMetrics: MetricCard[] = [
  { label: "Total Users", value: 1247, change: "+12% this month", color: "#3b82f6" },
  { label: "Active Jobs", value: 382, change: "+5% this week", color: "#22c55e" },
  { label: "Open Disputes", value: 14, change: "-2 from last week", color: "#f97316" },
  { label: "Flagged Listings", value: 7, change: "+3 today", color: "#ef4444" },
  { label: "Revenue (MTD)", value: 45280, color: "#a855f7" },
];

// ── Styles ────────────────────────────────────────────────────────────

const adminStyles = `
  .admin-panel { min-height: 100vh; background: #0f172a; color: #e2e8f0; font-family: system-ui, sans-serif; }
  .admin-header { background: #1e293b; padding: 1rem 2rem; display: flex; align-items: center; gap: 1rem; border-bottom: 1px solid #334155; }
  .admin-header h1 { font-size: 1.25rem; font-weight: 600; color: #f8fafc; margin: 0; }
  .admin-tabs { display: flex; gap: 0.25rem; flex: 1; }
  .admin-tab { background: transparent; border: none; color: #94a3b8; padding: 0.5rem 1rem; cursor: pointer; border-radius: 0.375rem; font-size: 0.875rem; transition: all 0.15s; }
  .admin-tab:hover { background: #334155; color: #e2e8f0; }
  .admin-tab.active { background: #3b82f6; color: #fff; }
  .admin-refresh-btn { background: #334155; border: 1px solid #475569; color: #e2e8f0; padding: 0.5rem 1rem; border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem; }
  .admin-refresh-btn:hover { background: #475569; }
  .admin-banner { padding: 0.75rem 2rem; font-size: 0.875rem; }
  .admin-banner.warning { background: #451a03; color: #fbbf24; border-bottom: 1px solid #78350f; }
  .admin-content { padding: 1.5rem 2rem; }
  
  /* Metrics */
  .admin-metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
  .admin-metric-card { background: #1e293b; border-radius: 0.5rem; padding: 1.25rem; border-left: 4px solid #3b82f6; }
  .admin-metric-label { font-size: 0.75rem; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; }
  .admin-metric-value { font-size: 1.75rem; font-weight: 700; color: #f8fafc; margin: 0.25rem 0; }
  .admin-metric-change { font-size: 0.75rem; color: #22c55e; }
  
  /* Cards */
  .admin-card { background: #1e293b; border-radius: 0.5rem; padding: 1.25rem; }
  .admin-card h3 { margin: 0 0 1rem; font-size: 1rem; color: #f8fafc; }
  .admin-charts { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  @media (max-width: 768px) { .admin-charts { grid-template-columns: 1fr; } }
  
  /* Trust Chart */
  .admin-bar-container { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
  .admin-bar-label { width: 3rem; font-size: 0.75rem; color: #94a3b8; text-align: right; }
  .admin-bar-track { flex: 1; height: 1.5rem; background: #334155; border-radius: 0.25rem; overflow: hidden; }
  .admin-bar-fill { height: 100%; border-radius: 0.25rem; transition: width 0.3s; }
  
  /* Tables */
  .admin-table-wrapper { overflow-x: auto; }
  .admin-table { width: 100%; border-collapse: collapse; }
  .admin-table th { text-align: left; padding: 0.75rem; font-size: 0.75rem; text-transform: uppercase; color: #94a3b8; border-bottom: 1px solid #334155; }
  .admin-table td { padding: 0.75rem; border-bottom: 1px solid #1e293b; font-size: 0.875rem; }
  .admin-table tr:hover td { background: #1e293b; }
  .admin-badge { display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; }
  .admin-badge.role-admin { background: #3b82f6; color: #fff; }
  .admin-badge.role-freelancer { background: #22c55e20; color: #22c55e; }
  .admin-badge.role-client { background: #a855f720; color: #a855f7; }
  .admin-badge.status-active { background: #22c55e20; color: #22c55e; }
  .admin-badge.status-suspended { background: #f9731620; color: #f97316; }
  .admin-badge.status-banned { background: #ef444420; color: #ef4444; }
  .admin-badge.status-flagged { background: #ef444420; color: #ef4444; }
  .admin-badge.status-open { background: #3b82f620; color: #3b82f6; }
  .admin-badge.status-under_review { background: #f9731620; color: #f97316; }
  .admin-badge.status-resolved { background: #22c55e20; color: #22c55e; }
  
  /* Buttons */
  .admin-btn { display: inline-block; padding: 0.5rem 1rem; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; border: none; cursor: pointer; background: #334155; color: #e2e8f0; transition: all 0.15s; text-decoration: none; }
  .admin-btn:hover { background: #475569; }
  .admin-btn.small { padding: 0.25rem 0.5rem; font-size: 0.75rem; }
  .admin-btn.success { background: #16a34a; color: #fff; }
  .admin-btn.success:hover { background: #15803d; }
  .admin-btn.danger { background: #dc2626; color: #fff; }
  .admin-btn.danger:hover { background: #b91c1c; }
  .admin-btn.warning { background: #d97706; color: #fff; }
  .admin-btn.warning:hover { background: #b45309; }
  
  /* Toolbar */
  .admin-toolbar { display: flex; gap: 1rem; margin-bottom: 1rem; }
  .admin-search-input, .admin-filter-select { padding: 0.5rem 0.75rem; border-radius: 0.375rem; border: 1px solid #334155; background: #1e293b; color: #e2e8f0; font-size: 0.875rem; }
  .admin-search-input { flex: 1; min-width: 200px; }
  .admin-filter-select { min-width: 140px; }
  
  /* Card Grid */
  .admin-card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1rem; }
  
  /* Job Card */
  .job-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
  .job-card-header h3 { margin: 0; font-size: 1rem; }
  .job-card-meta, .job-card-date { font-size: 0.8125rem; color: #94a3b8; }
  .job-card-reason { font-size: 0.8125rem; color: #fbbf24; margin: 0.25rem 0; }
  .job-card-actions { display: flex; gap: 0.5rem; margin-top: 0.75rem; }
  
  /* Dispute Card */
  .dispute-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
  .dispute-summary { font-size: 0.875rem; color: #cbd5e1; margin-bottom: 0.5rem; }
  .dispute-parties { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.8125rem; color: #94a3b8; margin-bottom: 0.75rem; }
  .dispute-actions { display: flex; gap: 0.5rem; }
  .dispute-id { font-size: 0.75rem; color: #64748b; }
  
  /* Settings */
  .admin-settings { max-width: 600px; }
  .admin-setting-row { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #1e293b; }
  .admin-setting-label { font-weight: 500; }
  .admin-setting-desc { font-size: 0.8125rem; color: #94a3b8; }
  .admin-toggle { position: relative; display: inline-block; width: 48px; height: 24px; }
  .admin-toggle input { opacity: 0; width: 0; height: 0; }
  .admin-toggle-slider { position: absolute; cursor: pointer; inset: 0; background: #475569; border-radius: 9999px; transition: 0.2s; }
  .admin-toggle-slider::before { content: ""; position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: 0.2s; }
  .admin-toggle input:checked + .admin-toggle-slider { background: #3b82f6; }
  .admin-toggle input:checked + .admin-toggle-slider::before { transform: translateX(24px); }
  
  .admin-activity-list { list-style: none; padding: 0; margin: 0; }
  .admin-activity-list li { padding: 0.5rem 0; border-bottom: 1px solid #1e293b; font-size: 0.875rem; color: #cbd5e1; }
  .admin-activity-list li:last-child { border-bottom: none; }
  .admin-empty-state { text-align: center; padding: 3rem; color: #64748b; font-size: 0.875rem; }
  .admin-spinner { width: 2rem; height: 2rem; border: 3px solid #334155; border-top-color: #3b82f6; border-radius: 50%; animation: admin-spin 0.6s linear infinite; }
  @keyframes admin-spin { to { transform: rotate(360deg); } }
  .admin-loading, .admin-access-denied { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 1rem; background: #0f172a; color: #e2e8f0; }
  .admin-access-denied .admin-card { max-width: 400px; text-align: center; }
  .error-card h1 { color: #ef4444; }
`;
