"use client";

import React, { useState, useEffect, useMemo } from "react";

// Types
interface Metrics {
  totalUsers: number;
  activeJobs: number;
  openDisputes: number;
  flaggedListings: number;
  monthlyRevenue: number;
  trustScores: {
    excellent: number;
    good: number;
    fair: number;
    flagged: number;
  };
  lastRefreshed: string;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: "client" | "freelancer";
  status: "active" | "suspended" | "banned";
  joinDate: string;
  activeJobs: number;
  disputes: number;
}

interface FlaggedJob {
  id: string;
  title: string;
  employer: string;
  employerName: string;
  flagReason: string;
  status: "pending" | "approved" | "rejected" | "escalated";
  createdAt: string;
}

interface DisputeRecord {
  id: string;
  contractTitle: string;
  clientId: string;
  clientName: string;
  freelancerId: string;
  freelancerName: string;
  amount: number;
  status: "open" | "under_review" | "resolved";
  thread: Array<{ sender: string; message: string; timestamp: string }>;
  evidence: string[];
  ruling?: { decision: string; decidedBy: string; decidedAt: string; notes?: string } | null;
}

interface AuditEntry {
  id: string;
  timestamp: string;
  adminId: string;
  actionType: string;
  details: any;
}

export default function AdminPanelPage() {
  // Auth state simulation
  const [currentRole, setCurrentRole] = useState<"admin" | "freelancer">("admin");
  const [activeTab, setActiveTab] = useState<"metrics" | "users" | "moderation" | "disputes" | "controls" | "audit">("metrics");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Data states
  const [metrics, setMetrics] = useState<Metrics>({
    totalUsers: 1420,
    activeJobs: 384,
    openDisputes: 5,
    flaggedListings: 2,
    monthlyRevenue: 142500,
    trustScores: { excellent: 68, good: 22, fair: 7, flagged: 3 },
    lastRefreshed: new Date().toLocaleTimeString()
  });

  const [users, setUsers] = useState<UserRecord[]>([
    { id: "usr_1", name: "Alex Rivers", email: "alex@example.com", role: "client", status: "active", joinDate: "2026-01-15", activeJobs: 3, disputes: 0 },
    { id: "usr_2", name: "Samantha Vance", email: "sam@example.com", role: "freelancer", status: "active", joinDate: "2026-02-01", activeJobs: 2, disputes: 1 },
    { id: "usr_3", name: "Marcus Stone", email: "marcus@example.com", role: "freelancer", status: "suspended", joinDate: "2026-02-18", activeJobs: 0, disputes: 2 },
    { id: "usr_4", name: "Elena Rostova", email: "elena@example.com", role: "client", status: "active", joinDate: "2026-03-05", activeJobs: 5, disputes: 0 },
    { id: "usr_5", name: "Devon Miles", email: "devon@example.com", role: "freelancer", status: "banned", joinDate: "2025-11-20", activeJobs: 0, disputes: 3 },
    { id: "usr_6", name: "Claire Chen", email: "claire@example.com", role: "freelancer", status: "active", joinDate: "2026-04-12", activeJobs: 1, disputes: 0 }
  ]);

  const [flaggedJobs, setFlaggedJobs] = useState<FlaggedJob[]>([
    { id: "job_flag_1", title: "Cryptocurrency high-frequency trader bot", employer: "usr_1", employerName: "Alex Rivers", flagReason: "Suspicious API access patterns reported by user", status: "pending", createdAt: "2026-10-10" },
    { id: "job_flag_2", title: "Bypass KYC identity verification scripts", employer: "usr_4", employerName: "Elena Rostova", flagReason: "Automated rule: prohibited keyword", status: "pending", createdAt: "2026-10-11" }
  ]);

  const [disputes, setDisputes] = useState<DisputeRecord[]>([
    {
      id: "disp_101",
      contractTitle: "Next.js E-Commerce Redesign",
      clientId: "usr_1",
      clientName: "Alex Rivers",
      freelancerId: "usr_2",
      freelancerName: "Samantha Vance",
      amount: 1200,
      status: "open",
      thread: [
        { sender: "client", message: "Deliverable failed target performance audit.", timestamp: "2026-10-09" },
        { sender: "freelancer", message: "Client scripts introduced subsequent regressions.", timestamp: "2026-10-10" }
      ],
      evidence: ["audit_v1.json", "diff_patch.txt"],
      ruling: null
    }
  ]);

  const [controls, setControls] = useState({
    allowRegistrations: true,
    allowJobPostings: true
  });

  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([
    { id: "aud_1", timestamp: "2026-10-12 14:00", adminId: "admin_master", actionType: "SYSTEM_BOOT", details: "Admin console initialized" }
  ]);

  // Filters & Pagination for Users
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [userStatusFilter, setUserStatusFilter] = useState<string>("all");
  const [userPage, setUserPage] = useState(1);
  const usersPerPage = 4;

  // Selected User Modal
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  // Dispute Detail Modal
  const [selectedDispute, setSelectedDispute] = useState<DisputeRecord | null>(null);

  // Toggle Confirm Modal
  const [toggleConfirm, setToggleConfirm] = useState<{ control: "allowRegistrations" | "allowJobPostings"; targetValue: boolean } | null>(null);

  const addAuditLog = (actionType: string, details: any) => {
    const newEntry: AuditEntry = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      adminId: "admin_operator",
      actionType,
      details
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Route guard check
  if (currentRole !== "admin") {
    return (
      <main style={{ maxWidth: "800px", margin: "4rem auto", textAlign: "center" }}>
        <div className="card" style={{ padding: "3rem", borderColor: "#e63946" }}>
          <h1 style={{ color: "#e63946", fontSize: "2rem" }}>403 - Forbidden</h1>
          <p style={{ color: "#a0aec0", margin: "1rem 0" }}>
            Access denied: Your account role ({currentRole}) does not possess administrative privileges.
          </p>
          <button
            onClick={() => setCurrentRole("admin")}
            style={{
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              padding: "0.6rem 1.2rem",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            Switch to Admin Session (Test Mode)
          </button>
        </div>
      </main>
    );
  }

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchRole = userRoleFilter === "all" || u.role === userRoleFilter;
      const matchStatus = userStatusFilter === "all" || u.status === userStatusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, userSearch, userRoleFilter, userStatusFilter]);

  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * usersPerPage;
    return filteredUsers.slice(start, start + usersPerPage);
  }, [filteredUsers, userPage]);

  // Actions
  const handleUserStatus = (userId: string, status: "active" | "suspended" | "banned") => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status } : u)));
    addAuditLog("USER_STATUS_CHANGE", { userId, newStatus: status });
    notify(`User ${userId} status updated to ${status}.`);
    if (selectedUser?.id === userId) {
      setSelectedUser((prev) => prev ? { ...prev, status } : null);
    }
  };

  const handleModerateJob = (jobId: string, action: "approved" | "rejected" | "escalated") => {
    setFlaggedJobs((prev) => prev.filter((j) => j.id !== jobId));
    addAuditLog("JOB_MODERATION", { jobId, action });
    notify(`Job ${jobId} has been ${action}. Automated notification dispatched to employer.`);
  };

  const handleDisputeRuling = (disputeId: string, decision: string) => {
    setDisputes((prev) =>
      prev.map((d) => (d.id === disputeId ? { ...d, status: "resolved", ruling: { decision, decidedBy: "admin", decidedAt: new Date().toLocaleTimeString() } } : d))
    );
    addAuditLog("DISPUTE_RULING", { disputeId, decision });
    notify(`Dispute ${disputeId} marked as resolved: ${decision}.`);
    setSelectedDispute(null);
  };

  const handleConfirmToggle = () => {
    if (!toggleConfirm) return;
    const { control, targetValue } = toggleConfirm;
    setControls((prev) => ({ ...prev, [control]: targetValue }));
    addAuditLog("PLATFORM_CONTROL_TOGGLE", { control, enabled: targetValue });
    notify(`Platform control [${control}] toggled to ${targetValue ? "ENABLED" : "DISABLED"}.`);
    setToggleConfirm(null);
  };

  const refreshMetrics = () => {
    setLoading(true);
    setTimeout(() => {
      setMetrics((prev) => ({
        ...prev,
        lastRefreshed: new Date().toLocaleTimeString()
      }));
      setLoading(false);
      notify("Dashboard metrics synchronized.");
    }, 400);
  };

  return (
    <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1rem" }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.8rem", color: "#f8fafc" }}>Admin Governance Panel</h1>
          <p style={{ margin: "0.2rem 0 0", color: "#94a3b8", fontSize: "0.9rem" }}>
            Operational moderation, risk intelligence, trust verification, and audit logs
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.85rem", color: "#10b981", background: "rgba(16, 185, 129, 0.15)", padding: "0.3rem 0.8rem", borderRadius: "20px" }}>
            ● Role: Administrator
          </span>
          <button
            onClick={() => setCurrentRole("freelancer")}
            style={{ fontSize: "0.8rem", background: "transparent", color: "#94a3b8", border: "1px solid #334155", borderRadius: "4px", padding: "0.3rem 0.6rem", cursor: "pointer" }}
            aria-label="Simulate unprivileged user"
          >
            Test 403 Guard
          </button>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div style={{ background: "#1e293b", borderLeft: "4px solid #3b82f6", color: "#e2e8f0", padding: "0.8rem 1.2rem", borderRadius: "6px", marginBottom: "1.2rem" }} role="status">
          {notification}
        </div>
      )}

      {/* Nav Tabs */}
      <nav style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid #1e293b", paddingBottom: "0.8rem", marginBottom: "1.5rem", overflowX: "auto" }}>
        {[
          { key: "metrics", label: "Trust & Metrics" },
          { key: "users", label: `Users (${users.length})` },
          { key: "moderation", label: `Moderation (${flaggedJobs.length})` },
          { key: "disputes", label: `Disputes (${disputes.filter((d) => d.status !== "resolved").length})` },
          { key: "controls", label: "Platform Controls" },
          { key: "audit", label: `Audit Log (${auditLogs.length})` }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              background: activeTab === tab.key ? "#2563eb" : "#0f172a",
              color: activeTab === tab.key ? "#fff" : "#94a3b8",
              border: "1px solid",
              borderColor: activeTab === tab.key ? "#3b82f6" : "#1e293b",
              borderRadius: "6px",
              padding: "0.5rem 1rem",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "0.85rem",
              whiteSpace: "nowrap"
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab 1: Trust & Metrics Dashboard */}
      {activeTab === "metrics" && (
        <section aria-labelledby="metrics-heading">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 id="metrics-heading" style={{ fontSize: "1.2rem", margin: 0 }}>System Health & Executive Summary</h2>
            <button
              onClick={refreshMetrics}
              disabled={loading}
              style={{ background: "#1e293b", color: "#38bdf8", border: "1px solid #334155", padding: "0.4rem 0.9rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem" }}
            >
              {loading ? "Refreshing..." : `⟳ Refresh (Last: ${metrics.lastRefreshed})`}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <div className="card">
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Total Users</span>
              <div style={{ fontSize: "1.6rem", fontWeight: "bold", marginTop: "0.3rem" }}>{metrics.totalUsers.toLocaleString()}</div>
            </div>
            <div className="card">
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Active Listings</span>
              <div style={{ fontSize: "1.6rem", fontWeight: "bold", marginTop: "0.3rem", color: "#38bdf8" }}>{metrics.activeJobs}</div>
            </div>
            <div className="card">
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Open Disputes</span>
              <div style={{ fontSize: "1.6rem", fontWeight: "bold", marginTop: "0.3rem", color: "#f59e0b" }}>{metrics.openDisputes}</div>
            </div>
            <div className="card">
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Flagged Content</span>
              <div style={{ fontSize: "1.6rem", fontWeight: "bold", marginTop: "0.3rem", color: "#ef4444" }}>{metrics.flaggedListings}</div>
            </div>
            <div className="card">
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Monthly GMV</span>
              <div style={{ fontSize: "1.6rem", fontWeight: "bold", marginTop: "0.3rem", color: "#10b981" }}>${metrics.monthlyRevenue.toLocaleString()}</div>
            </div>
          </div>

          {/* Trust Score Distribution */}
          <div className="card" style={{ padding: "1.2rem" }}>
            <h3 style={{ margin: "0 0 1rem", fontSize: "1rem" }}>Platform Trust Score Distribution</h3>
            <div style={{ display: "flex", height: "24px", borderRadius: "6px", overflow: "hidden", marginBottom: "0.8rem" }}>
              <div style={{ width: `${metrics.trustScores.excellent}%`, background: "#10b981" }} title={`Excellent: ${metrics.trustScores.excellent}%`} />
              <div style={{ width: `${metrics.trustScores.good}%`, background: "#3b82f6" }} title={`Good: ${metrics.trustScores.good}%`} />
              <div style={{ width: `${metrics.trustScores.fair}%`, background: "#f59e0b" }} title={`Fair: ${metrics.trustScores.fair}%`} />
              <div style={{ width: `${metrics.trustScores.flagged}%`, background: "#ef4444" }} title={`Flagged: ${metrics.trustScores.flagged}%`} />
            </div>
            <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.8rem", color: "#94a3b8" }}>
              <span><strong style={{ color: "#10b981" }}>● Excellent</strong>: {metrics.trustScores.excellent}%</span>
              <span><strong style={{ color: "#3b82f6" }}>● Good</strong>: {metrics.trustScores.good}%</span>
              <span><strong style={{ color: "#f59e0b" }}>● Fair</strong>: {metrics.trustScores.fair}%</span>
              <span><strong style={{ color: "#ef4444" }}>● Flagged</strong>: {metrics.trustScores.flagged}%</span>
            </div>
          </div>
        </section>
      )}

      {/* Tab 2: User Management */}
      {activeTab === "users" && (
        <section aria-labelledby="users-heading">
          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <input
              type="text"
              placeholder="Search user by name or email..."
              value={userSearch}
              onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
              style={{ flex: 1, minWidth: "220px", background: "#0f172a", border: "1px solid #334155", color: "#fff", padding: "0.5rem 0.8rem", borderRadius: "6px" }}
              aria-label="Search users"
            />
            <select
              value={userRoleFilter}
              onChange={(e) => { setUserRoleFilter(e.target.value); setUserPage(1); }}
              style={{ background: "#0f172a", border: "1px solid #334155", color: "#fff", padding: "0.5rem 0.8rem", borderRadius: "6px" }}
              aria-label="Filter by role"
            >
              <option value="all">All Roles</option>
              <option value="client">Clients</option>
              <option value="freelancer">Freelancers</option>
            </select>
            <select
              value={userStatusFilter}
              onChange={(e) => { setUserStatusFilter(e.target.value); setUserPage(1); }}
              style={{ background: "#0f172a", border: "1px solid #334155", color: "#fff", padding: "0.5rem 0.8rem", borderRadius: "6px" }}
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
              <thead style={{ background: "#0f172a", color: "#94a3b8", borderBottom: "1px solid #334155" }}>
                <tr>
                  <th style={{ padding: "0.8rem 1rem" }}>User</th>
                  <th style={{ padding: "0.8rem" }}>Role</th>
                  <th style={{ padding: "0.8rem" }}>Joined</th>
                  <th style={{ padding: "0.8rem" }}>Status</th>
                  <th style={{ padding: "0.8rem 1rem", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                      No matching user records found.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => (
                    <tr key={u.id} style={{ borderBottom: "1px solid #1e293b" }}>
                      <td style={{ padding: "0.8rem 1rem" }}>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div style={{ color: "#64748b", fontSize: "0.75rem" }}>{u.email}</div>
                      </td>
                      <td style={{ padding: "0.8rem", textTransform: "capitalize" }}>{u.role}</td>
                      <td style={{ padding: "0.8rem", color: "#94a3b8" }}>{u.joinDate}</td>
                      <td style={{ padding: "0.8rem" }}>
                        <span style={{
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          background: u.status === "active" ? "rgba(16, 185, 129, 0.2)" : u.status === "suspended" ? "rgba(245, 158, 11, 0.2)" : "rgba(239, 68, 68, 0.2)",
                          color: u.status === "active" ? "#10b981" : u.status === "suspended" ? "#f59e0b" : "#ef4444"
                        }}>
                          {u.status}
                        </span>
                      </td>
                      <td style={{ padding: "0.8rem 1rem", textAlign: "right" }}>
                        <button
                          onClick={() => setSelectedUser(u)}
                          style={{ background: "#334155", color: "#f8fafc", border: "none", padding: "0.3rem 0.6rem", borderRadius: "4px", marginRight: "0.4rem", cursor: "pointer", fontSize: "0.75rem" }}
                        >
                          View
                        </button>
                        {u.status === "active" && (
                          <button
                            onClick={() => handleUserStatus(u.id, "suspended")}
                            style={{ background: "#f59e0b", color: "#000", border: "none", padding: "0.3rem 0.6rem", borderRadius: "4px", marginRight: "0.4rem", cursor: "pointer", fontSize: "0.75rem" }}
                          >
                            Suspend
                          </button>
                        )}
                        {u.status === "suspended" && (
                          <button
                            onClick={() => handleUserStatus(u.id, "active")}
                            style={{ background: "#10b981", color: "#fff", border: "none", padding: "0.3rem 0.6rem", borderRadius: "4px", marginRight: "0.4rem", cursor: "pointer", fontSize: "0.75rem" }}
                          >
                            Reinstate
                          </button>
                        )}
                        {u.status !== "banned" && (
                          <button
                            onClick={() => handleUserStatus(u.id, "banned")}
                            style={{ background: "#ef4444", color: "#fff", border: "none", padding: "0.3rem 0.6rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.75rem" }}
                          >
                            Ban
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.8rem 1rem", background: "#0f172a" }}>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                Showing {paginatedUsers.length} of {filteredUsers.length} users
              </span>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  disabled={userPage <= 1}
                  onClick={() => setUserPage((p) => p - 1)}
                  style={{ background: "#1e293b", color: "#fff", border: "none", padding: "0.3rem 0.7rem", borderRadius: "4px", cursor: userPage <= 1 ? "not-allowed" : "pointer", opacity: userPage <= 1 ? 0.5 : 1 }}
                >
                  Prev
                </button>
                <span style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}>Page {userPage}</span>
                <button
                  disabled={userPage * usersPerPage >= filteredUsers.length}
                  onClick={() => setUserPage((p) => p + 1)}
                  style={{ background: "#1e293b", color: "#fff", border: "none", padding: "0.3rem 0.7rem", borderRadius: "4px", cursor: userPage * usersPerPage >= filteredUsers.length ? "not-allowed" : "pointer", opacity: userPage * usersPerPage >= filteredUsers.length ? 0.5 : 1 }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Tab 3: Moderation Queue */}
      {activeTab === "moderation" && (
        <section aria-labelledby="moderation-heading">
          <h2 id="moderation-heading" style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Flagged Content Moderation Queue</h2>
          {flaggedJobs.length === 0 ? (
            <div className="card" style={{ padding: "2rem", textAlign: "center", color: "#10b981" }}>
              ✓ All moderation queues are clear. Zero flagged items pending review.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {flaggedJobs.map((job) => (
                <div key={job.id} className="card" style={{ borderLeft: "4px solid #ef4444" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1rem" }}>{job.title}</h3>
                      <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Employer: {job.employerName} ({job.employer}) • Logged: {job.createdAt}</span>
                    </div>
                    <span style={{ background: "rgba(239, 68, 68, 0.2)", color: "#ef4444", fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "4px" }}>
                      Pending Review
                    </span>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "#fca5a5", background: "rgba(239, 68, 68, 0.1)", padding: "0.6rem", borderRadius: "4px", margin: "0.5rem 0 1rem" }}>
                    <strong>Flag Trigger</strong>: {job.flagReason}
                  </p>
                  <div style={{ display: "flex", gap: "0.6rem" }}>
                    <button
                      onClick={() => handleModerateJob(job.id, "approved")}
                      style={{ background: "#10b981", color: "#fff", border: "none", padding: "0.4rem 0.9rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}
                    >
                      Approve Listing
                    </button>
                    <button
                      onClick={() => handleModerateJob(job.id, "rejected")}
                      style={{ background: "#ef4444", color: "#fff", border: "none", padding: "0.4rem 0.9rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}
                    >
                      Reject & Notify
                    </button>
                    <button
                      onClick={() => handleModerateJob(job.id, "escalated")}
                      style={{ background: "#f59e0b", color: "#000", border: "none", padding: "0.4rem 0.9rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}
                    >
                      Escalate to Senior Admin
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Tab 4: Dispute Resolution */}
      {activeTab === "disputes" && (
        <section aria-labelledby="disputes-heading">
          <h2 id="disputes-heading" style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Arbitration & Dispute Resolution</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {disputes.map((d) => (
              <div key={d.id} className="card" style={{ borderLeft: `4px solid ${d.status === 'resolved' ? '#10b981' : '#f59e0b'}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1rem" }}>{d.contractTitle} (${d.amount.toLocaleString()})</h3>
                    <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.2rem" }}>
                      Client: <strong>{d.clientName}</strong> vs Freelancer: <strong>{d.freelancerName}</strong>
                    </div>
                  </div>
                  <span style={{
                    padding: "0.2rem 0.6rem",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    background: d.status === "resolved" ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)",
                    color: d.status === "resolved" ? "#10b981" : "#f59e0b"
                  }}>
                    {d.status.toUpperCase()}
                  </span>
                </div>

                {d.ruling ? (
                  <div style={{ background: "rgba(16, 185, 129, 0.1)", padding: "0.6rem", borderRadius: "4px", fontSize: "0.85rem", color: "#a7f3d0" }}>
                    <strong>Ruling Outcome</strong>: {d.ruling.decision} (Decided at {d.ruling.decidedAt})
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "0.6rem", marginTop: "1rem" }}>
                    <button
                      onClick={() => setSelectedDispute(d)}
                      style={{ background: "#3b82f6", color: "#fff", border: "none", padding: "0.4rem 0.9rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}
                    >
                      Inspect Thread & Rule
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tab 5: Platform Controls */}
      {activeTab === "controls" && (
        <section aria-labelledby="controls-heading">
          <h2 id="controls-heading" style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Emergency Platform Gating Controls</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong style={{ fontSize: "1rem", display: "block" }}>Allow New User Registrations</strong>
                <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                  When disabled, new freelancer and client sign-ups are halted system-wide.
                </span>
              </div>
              <button
                onClick={() => setToggleConfirm({ control: "allowRegistrations", targetValue: !controls.allowRegistrations })}
                style={{
                  background: controls.allowRegistrations ? "#10b981" : "#ef4444",
                  color: "#fff",
                  border: "none",
                  padding: "0.5rem 1.2rem",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                {controls.allowRegistrations ? "ENABLED" : "DISABLED"}
              </button>
            </div>

            <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong style={{ fontSize: "1rem", display: "block" }}>Allow New Job Postings</strong>
                <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                  When disabled, clients cannot publish new listings into the active marketplace.
                </span>
              </div>
              <button
                onClick={() => setToggleConfirm({ control: "allowJobPostings", targetValue: !controls.allowJobPostings })}
                style={{
                  background: controls.allowJobPostings ? "#10b981" : "#ef4444",
                  color: "#fff",
                  border: "none",
                  padding: "0.5rem 1.2rem",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                {controls.allowJobPostings ? "ENABLED" : "DISABLED"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Tab 6: Audit Log */}
      {activeTab === "audit" && (
        <section aria-labelledby="audit-heading">
          <h2 id="audit-heading" style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Immutable Admin Action Audit Log</h2>
          <div className="card" style={{ padding: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead style={{ background: "#0f172a", borderBottom: "1px solid #334155" }}>
                <tr>
                  <th style={{ padding: "0.8rem 1rem", textAlign: "left" }}>Timestamp</th>
                  <th style={{ padding: "0.8rem", textAlign: "left" }}>Admin</th>
                  <th style={{ padding: "0.8rem", textAlign: "left" }}>Action Type</th>
                  <th style={{ padding: "0.8rem 1rem", textAlign: "left" }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: "1px solid #1e293b" }}>
                    <td style={{ padding: "0.8rem 1rem", color: "#94a3b8" }}>{entry.timestamp}</td>
                    <td style={{ padding: "0.8rem", fontWeight: 600 }}>{entry.adminId}</td>
                    <td style={{ padding: "0.8rem" }}>
                      <span style={{ background: "#334155", padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem" }}>
                        {entry.actionType}
                      </span>
                    </td>
                    <td style={{ padding: "0.8rem 1rem", color: "#cbd5e1" }}>
                      {typeof entry.details === "object" ? JSON.stringify(entry.details) : entry.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Modal: User Profile Detail */}
      {selectedUser && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 100 }}>
          <div className="card" style={{ maxWidth: "500px", width: "100%", padding: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1rem", fontSize: "1.2rem" }}>User Governance Dossier</h3>
            <div style={{ fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div><strong>User ID</strong>: {selectedUser.id}</div>
              <div><strong>Name</strong>: {selectedUser.name}</div>
              <div><strong>Email</strong>: {selectedUser.email}</div>
              <div><strong>Role</strong>: {selectedUser.role}</div>
              <div><strong>Status</strong>: {selectedUser.status}</div>
              <div><strong>Registered</strong>: {selectedUser.joinDate}</div>
              <div><strong>Active Engagements</strong>: {selectedUser.activeJobs}</div>
              <div><strong>Historical Disputes</strong>: {selectedUser.disputes}</div>
            </div>
            <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
              <button
                onClick={() => setSelectedUser(null)}
                style={{ background: "#334155", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Dispute Arbitration */}
      {selectedDispute && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 100 }}>
          <div className="card" style={{ maxWidth: "600px", width: "100%", padding: "1.5rem" }}>
            <h3 style={{ margin: "0 0 0.8rem" }}>Arbitrate Dispute: {selectedDispute.contractTitle}</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "0 0 1rem" }}>
              Amount in Escrow: <strong>${selectedDispute.amount.toLocaleString()} USD</strong>
            </p>
            <div style={{ background: "#0f172a", padding: "0.8rem", borderRadius: "6px", marginBottom: "1rem" }}>
              <strong style={{ fontSize: "0.8rem", color: "#64748b" }}>Dispute Thread:</strong>
              {selectedDispute.thread.map((t, i) => (
                <div key={i} style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
                  <span style={{ color: t.sender === "client" ? "#38bdf8" : "#34d399", fontWeight: 600 }}>
                    {t.sender === "client" ? selectedDispute.clientName : selectedDispute.freelancerName} ({t.timestamp}):
                  </span>{" "}
                  {t.message}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => handleDisputeRuling(selectedDispute.id, `Ruled in favor of Client (${selectedDispute.clientName})`)}
                style={{ background: "#38bdf8", color: "#000", border: "none", padding: "0.5rem 0.9rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}
              >
                Rule for Client
              </button>
              <button
                onClick={() => handleDisputeRuling(selectedDispute.id, `Ruled in favor of Freelancer (${selectedDispute.freelancerName})`)}
                style={{ background: "#34d399", color: "#000", border: "none", padding: "0.5rem 0.9rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}
              >
                Rule for Freelancer
              </button>
              <button
                onClick={() => setSelectedDispute(null)}
                style={{ background: "#334155", color: "#fff", border: "none", padding: "0.5rem 0.9rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Toggle Confirmation Dialog */}
      {toggleConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 100 }}>
          <div className="card" style={{ maxWidth: "450px", width: "100%", padding: "1.5rem" }}>
            <h3 style={{ margin: "0 0 0.8rem", color: "#f59e0b" }}>Confirm Platform Gating Action</h3>
            <p style={{ fontSize: "0.9rem", color: "#cbd5e1" }}>
              Are you sure you want to change <strong>{toggleConfirm.control}</strong> to{" "}
              <strong>{toggleConfirm.targetValue ? "ENABLED" : "DISABLED"}</strong>? This impacts live operations and will be logged in the immutable audit log.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "1.2rem" }}>
              <button
                onClick={() => setToggleConfirm(null)}
                style={{ background: "#334155", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmToggle}
                style={{ background: "#f59e0b", color: "#000", border: "none", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
              >
                Confirm & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
