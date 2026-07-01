"use client";

import React, { useState, useEffect } from "react";

// Mock user context login. In a real application we would use actual auth cookies/localStorage.
// Since it's a frontend stub, we'll store/provide simulated state for admin role
const MOCK_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfYWRtaW4iLCJyb2xlIjoiQURNSU4ifQ.development-signature";

interface User {
  id: string;
  fullName: string;
  email: string;
  role: "CLIENT" | "FREELANCER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "BANNED";
  isVerified: boolean;
  createdAt: string;
}

interface Job {
  id: string;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  status: string;
  clientId: string;
  createdAt: string;
}

interface Dispute {
  id: string;
  jobId: string;
  creatorId: string;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "ESCALATED";
  reason: string;
  evidence?: string;
  ruling?: string;
  createdAt: string;
}

interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  details?: string;
  createdAt: string;
}

export default function AdminPanelPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // State
  const [metrics, setMetrics] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [flaggedJobs, setFlaggedJobs] = useState<Job[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [platformControls, setPlatformControls] = useState({
    registrationEnabled: true,
    jobPostingEnabled: true,
  });

  // Table parameters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals & Action overlays
  const [dialog, setDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  const [rejectionJobId, setRejectionJobId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [disputeDecisionId, setDisputeDecisionId] = useState<string | null>(null);
  const [disputeRuling, setDisputeRuling] = useState<"RESOLVED" | "ESCALATED">("RESOLVED");
  const [refundPercent, setRefundPercent] = useState(0);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserJobs, setSelectedUserJobs] = useState<Job[]>([]);
  const [selectedUserDisputes, setSelectedUserDisputes] = useState<Dispute[]>([]);

  // Logs filters
  const [logActionFilter, setLogActionFilter] = useState("");
  const [logAdminFilter, setLogAdminFilter] = useState("");

  // Simulated API fetchers
  const API_BASE = "http://localhost:4000/api/admin";

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        "Authorization": `Bearer ${MOCK_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
  };

  const fetchDashboardMetrics = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/metrics`);
      if (res.status === 403) {
        setIsAdmin(false);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setMetrics(data.data);
        setIsAdmin(true);
      }
    } catch {
      // Fallback to client-side mocks if API is not running locally
      setIsAdmin(true);
      setMetrics({
        summary: {
          totalUsers: 5,
          activeJobs: 2,
          openDisputes: 2,
          flaggedListings: 1,
          revenue: 680.5,
        },
        trustDistribution: [
          { range: "0-20", count: 1 },
          { range: "21-40", count: 1 },
          { range: "41-60", count: 0 },
          { range: "61-80", count: 2 },
          { range: "81-100", count: 1 },
        ],
      });
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetchWithAuth(
        `${API_BASE}/users?search=${search}&role=${roleFilter}&status=${statusFilter}&page=${page}`
      );
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.users);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch {
      // Fallback
      let filtered = [
        { id: "usr_admin", email: "admin@freelanceflow.com", fullName: "Admin User", role: "ADMIN", status: "ACTIVE", isVerified: true, createdAt: "2026-01-01" },
        { id: "usr_free1", email: "maya@freelanceflow.com", fullName: "Maya Dev", role: "FREELANCER", status: "ACTIVE", isVerified: true, createdAt: "2026-02-15" },
        { id: "usr_free2", email: "jordan@freelanceflow.com", fullName: "Jordan UX", role: "FREELANCER", status: "SUSPENDED", isVerified: true, createdAt: "2026-03-20" },
        { id: "usr_client1", email: "client1@freelanceflow.com", fullName: "Banana Client", role: "CLIENT", status: "ACTIVE", isVerified: true, createdAt: "2026-04-05" },
        { id: "usr_client2", email: "client2@freelanceflow.com", fullName: "Secure Client", role: "CLIENT", status: "BANNED", isVerified: true, createdAt: "2026-05-01" },
      ] as User[];

      if (search) {
        filtered = filtered.filter(
          (u) =>
            u.fullName.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())
        );
      }
      if (roleFilter) filtered = filtered.filter((u) => u.role === roleFilter);
      if (statusFilter) filtered = filtered.filter((u) => u.status === statusFilter);

      setUsers(filtered);
      setTotalPages(1);
    }
  };

  const fetchFlaggedJobs = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/jobs/flagged`);
      const data = await res.json();
      if (data.success) setFlaggedJobs(data.data);
    } catch {
      setFlaggedJobs([
        { id: "job_2", title: "Migrate legacy API to Node.js", description: "Old API must go", budgetMin: 2000, budgetMax: 2800, status: "FLAGGED", clientId: "usr_client1", createdAt: "2026-05-12" },
      ]);
    }
  };

  const fetchDisputes = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/disputes`);
      const data = await res.json();
      if (data.success) setDisputes(data.data);
    } catch {
      setDisputes([
        { id: "dis_1", jobId: "job_1", creatorId: "usr_client1", status: "OPEN", reason: "Freelancer vanished", evidence: "No commits in 2 weeks", createdAt: "2026-05-15" },
        { id: "dis_2", jobId: "job_2", creatorId: "usr_free1", status: "UNDER_REVIEW", reason: "Client refused final payment", evidence: "Completed all milestone deliverables", createdAt: "2026-05-16" },
      ]);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/logs?action=${logActionFilter}&adminId=${logAdminFilter}`);
      const data = await res.json();
      if (data.success) setAuditLogs(data.data);
    } catch {
      setAuditLogs([
        { id: "log_1", adminId: "usr_admin", action: "SUSPEND_USER", details: "Suspended user jordan@freelanceflow.com for spam", createdAt: "2026-05-18T10:00:00Z" },
        { id: "log_2", adminId: "usr_admin", action: "DISABLE_REGISTRATION", details: "Registration disabled temporarily", createdAt: "2026-05-18T10:05:00Z" },
      ]);
    }
  };

  const fetchControls = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/controls`);
      const data = await res.json();
      if (data.success) setPlatformControls(data.data);
    } catch {}
  };

  // Perform updates
  const handleUpdateUserStatus = async (userId: string, newStatus: "ACTIVE" | "SUSPENDED" | "BANNED") => {
    setDialog({
      open: true,
      title: `Confirm status change to ${newStatus}`,
      description: `Are you sure you want to change the status of user ${userId} to ${newStatus}?`,
      onConfirm: async () => {
        try {
          await fetchWithAuth(`${API_BASE}/users/${userId}/status`, {
            method: "POST",
            body: JSON.stringify({ status: newStatus }),
          });
        } catch {}
        // Refresh local view
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)));
        setDialog(null);
      },
    });
  };

  const handleModerateJob = async (jobId: string, action: "APPROVE" | "REJECT", reason = "") => {
    const act = async () => {
      try {
        await fetchWithAuth(`${API_BASE}/jobs/${jobId}/moderate`, {
          method: "POST",
          body: JSON.stringify({ action, reason }),
        });
      } catch {}
      setFlaggedJobs((prev) => prev.filter((j) => j.id !== jobId));
      setRejectionJobId(null);
      setRejectionReason("");
    };

    if (action === "REJECT") {
      setRejectionJobId(jobId);
    } else {
      setDialog({
        open: true,
        title: "Confirm Approval",
        description: `Are you sure you want to approve this listing?`,
        onConfirm: act,
      });
    }
  };

  const handleResolveDispute = async (disputeId: string, decision: "RESOLVED" | "ESCALATED", refund: number) => {
    try {
      await fetchWithAuth(`${API_BASE}/disputes/${disputeId}/resolve`, {
        method: "POST",
        body: JSON.stringify({ decision, refundPercent: refund }),
      });
    } catch {}
    setDisputes((prev) =>
      prev.map((d) => (d.id === disputeId ? { ...d, status: decision === "ESCALATED" ? "ESCALATED" : "RESOLVED", ruling: `Resolved: ${refund}% refund` } : d))
    );
    setDisputeDecisionId(null);
  };

  const handleToggleControl = async (key: string, currentValue: boolean) => {
    const newValue = !currentValue;
    setDialog({
      open: true,
      title: "Confirm Platform Setting Change",
      description: `Are you sure you want to ${newValue ? "enable" : "disable"} ${key.replace(/([A-Z])/g, " $1").toLowerCase()}?`,
      onConfirm: async () => {
        try {
          await fetchWithAuth(`${API_BASE}/controls`, {
            method: "POST",
            body: JSON.stringify({ key, value: newValue }),
          });
        } catch {}
        setPlatformControls((prev) => ({ ...prev, [key]: newValue }));
        setDialog(null);
      },
    });
  };

  // Profile Detail viewer
  const handleViewUserProfile = (user: User) => {
    setSelectedUser(user);
    // Mock user specific listings and disputes
    setSelectedUserJobs([
      { id: "job_1", title: "Build an AI customer support widget", description: "", budgetMin: 1000, budgetMax: 1500, status: "OPEN", clientId: user.id, createdAt: "2026-05-10" },
    ].filter((j) => j.clientId === user.id));
    setSelectedUserDisputes(([
      { id: "dis_1", jobId: "job_1", creatorId: user.id, status: "OPEN" as const, reason: "Freelancer vanished", createdAt: "2026-05-15" },
    ] as Dispute[]).filter((d) => d.creatorId === user.id));
  };

  useEffect(() => {
    fetchDashboardMetrics();
    fetchUsers();
    fetchFlaggedJobs();
    fetchDisputes();
    fetchAuditLogs();
    fetchControls();
  }, [search, roleFilter, statusFilter, page, logActionFilter, logAdminFilter]);

  if (isAdmin === false) {
    return (
      <section className="card" style={{ maxWidth: 600, margin: "4rem auto", textAlign: "center" }}>
        <h2 style={{ color: "#ff4d4d" }}>403 - Forbidden</h2>
        <p>You do not have administrative privileges to access this area.</p>
      </section>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header bar */}
      <header className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0 }}>FreelanceFlow Administrative Headquarters</h2>
          <span style={{ fontSize: "0.85rem", color: "#8a9fc2" }}>Secure dashboard and systems management.</span>
        </div>
        <button
          onClick={() => {
            fetchDashboardMetrics();
            fetchUsers();
            fetchFlaggedJobs();
            fetchDisputes();
            fetchAuditLogs();
            fetchControls();
          }}
          className="card"
          style={{ padding: "0.5rem 1rem", background: "#212b50", border: "1px solid #3c4f82", cursor: "pointer", color: "#fff", marginBottom: 0 }}
        >
          🔄 Force Refresh
        </button>
      </header>

      {/* Tabs selector */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {[
          ["dashboard", "📊 Trust & Metrics"],
          ["users", "👥 User Directory"],
          ["jobs", "⚖️ Moderation Queue"],
          ["disputes", "🤝 Dispute Center"],
          ["controls", "⚙️ Platform Controls"],
          ["logs", "📜 System Logs"],
        ].map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "0.8rem 1.2rem",
              background: activeTab === tab ? "#2563eb" : "#151c35",
              color: "#fff",
              border: "1px solid #2a3765",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: activeTab === tab ? "bold" : "normal",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Dynamic Content */}
      <section className="card">
        {activeTab === "dashboard" && metrics && (
          <div>
            <h3>Trust & Performance Metrics</h3>
            <div className="grid">
              <div className="card" style={{ background: "#1c2340", textAlign: "center" }}>
                <h4>Total Users</h4>
                <p style={{ fontSize: "2rem", fontWeight: "bold", margin: 0 }}>{metrics.summary.totalUsers}</p>
              </div>
              <div className="card" style={{ background: "#1c2340", textAlign: "center" }}>
                <h4>Active Jobs</h4>
                <p style={{ fontSize: "2rem", fontWeight: "bold", margin: 0, color: "#10b981" }}>{metrics.summary.activeJobs}</p>
              </div>
              <div className="card" style={{ background: "#1c2340", textAlign: "center" }}>
                <h4>Open Disputes</h4>
                <p style={{ fontSize: "2rem", fontWeight: "bold", margin: 0, color: "#f59e0b" }}>{metrics.summary.openDisputes}</p>
              </div>
              <div className="card" style={{ background: "#1c2340", textAlign: "center" }}>
                <h4>Flagged Listings</h4>
                <p style={{ fontSize: "2rem", fontWeight: "bold", margin: 0, color: "#ef4444" }}>{metrics.summary.flaggedListings}</p>
              </div>
              <div className="card" style={{ background: "#1c2340", textAlign: "center" }}>
                <h4>Platform Revenue</h4>
                <p style={{ fontSize: "2rem", fontWeight: "bold", margin: 0, color: "#6366f1" }}>${metrics.summary.revenue.toFixed(2)}</p>
              </div>
            </div>

            <div style={{ marginTop: "2rem" }}>
              <h4>Trust Score Distribution</h4>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", height: "200px", padding: "1rem", background: "#0b1020", borderRadius: "8px" }}>
                {metrics.trustDistribution.map((group: any) => (
                  <div key={group.range} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.8rem", color: "#8a9fc2" }}>{group.count}</span>
                    <div style={{ width: "100%", background: "#2563eb", height: `${Math.max(group.count * 30, 8)}px`, borderRadius: "4px" }}></div>
                    <span style={{ fontSize: "0.75rem", color: "#8a9fc2" }}>{group.range}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div>
            <h3>User Directory</h3>
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ padding: "0.6rem", background: "#1c2340", border: "1px solid #2a3765", color: "#fff", borderRadius: "6px", flex: 1 }}
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ padding: "0.6rem", background: "#1c2340", border: "1px solid #2a3765", color: "#fff", borderRadius: "6px" }}
              >
                <option value="">All Roles</option>
                <option value="CLIENT">Client</option>
                <option value="FREELANCER">Freelancer</option>
                <option value="ADMIN">Admin</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: "0.6rem", background: "#1c2340", border: "1px solid #2a3765", color: "#fff", borderRadius: "6px" }}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="BANNED">Banned</option>
              </select>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
              <thead>
                <tr style={{ background: "#1c2340", textAlign: "left" }}>
                  <th style={{ padding: "1rem" }}>Name</th>
                  <th style={{ padding: "1rem" }}>Email</th>
                  <th style={{ padding: "1rem" }}>Role</th>
                  <th style={{ padding: "1rem" }}>Status</th>
                  <th style={{ padding: "1rem" }}>Joined</th>
                  <th style={{ padding: "1rem" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #2a3765" }}>
                    <td style={{ padding: "1rem" }}>
                      <button
                        onClick={() => handleViewUserProfile(u)}
                        style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer", textDecoration: "underline", padding: 0 }}
                      >
                        {u.fullName}
                      </button>
                    </td>
                    <td style={{ padding: "1rem" }}>{u.email}</td>
                    <td style={{ padding: "1rem" }}>{u.role}</td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{
                        padding: "0.2rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.85rem",
                        background: u.status === "ACTIVE" ? "#065f46" : u.status === "SUSPENDED" ? "#92400e" : "#991b1b",
                        color: "#fff"
                      }}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: "1rem", display: "flex", gap: "0.5rem" }}>
                      {u.status !== "ACTIVE" && (
                        <button onClick={() => handleUpdateUserStatus(u.id, "ACTIVE")} style={{ background: "#059669", color: "#fff", border: "none", borderRadius: "4px", padding: "0.3rem 0.6rem", cursor: "pointer" }}>
                          Reinstate
                        </button>
                      )}
                      {u.status === "ACTIVE" && (
                        <button onClick={() => handleUpdateUserStatus(u.id, "SUSPENDED")} style={{ background: "#d97706", color: "#fff", border: "none", borderRadius: "4px", padding: "0.3rem 0.6rem", cursor: "pointer" }}>
                          Suspend
                        </button>
                      )}
                      {u.status !== "BANNED" && (
                        <button onClick={() => handleUpdateUserStatus(u.id, "BANNED")} style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: "4px", padding: "0.3rem 0.6rem", cursor: "pointer" }}>
                          Ban
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* User Profile overlay modal */}
            {selectedUser && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
                <div className="card" style={{ maxWidth: 650, width: "90%", background: "#151c35", color: "#fff", padding: "2rem" }}>
                  <h3>Profile & Analytics: {selectedUser.fullName}</h3>
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                  <p><strong>Status:</strong> {selectedUser.status}</p>
                  <p><strong>Role:</strong> {selectedUser.role}</p>

                  <h4 style={{ marginTop: "1.5rem" }}>Active Listings/Jobs</h4>
                  {selectedUserJobs.length === 0 ? (
                    <p style={{ color: "#8a9fc2" }}>No active jobs.</p>
                  ) : (
                    selectedUserJobs.map((j) => (
                      <div key={j.id} style={{ background: "#1c2340", padding: "0.8rem", borderRadius: "6px", marginBottom: "0.5rem" }}>
                        <strong>{j.title}</strong> - {j.status}
                      </div>
                    ))
                  )}

                  <h4 style={{ marginTop: "1.5rem" }}>Dispute History</h4>
                  {selectedUserDisputes.length === 0 ? (
                    <p style={{ color: "#8a9fc2" }}>No dispute records found.</p>
                  ) : (
                    selectedUserDisputes.map((d) => (
                      <div key={d.id} style={{ background: "#1c2340", padding: "0.8rem", borderRadius: "6px", marginBottom: "0.5rem" }}>
                        <strong>Dispute {d.id}</strong>: {d.reason} ({d.status})
                      </div>
                    ))
                  )}

                  <button
                    onClick={() => setSelectedUser(null)}
                    style={{ marginTop: "1.5rem", background: "#ef4444", border: "none", borderRadius: "4px", color: "#fff", padding: "0.6rem 1.2rem", cursor: "pointer" }}
                  >
                    Close Profile Details
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "jobs" && (
          <div>
            <h3>Job Listing Moderation Queue</h3>
            {flaggedJobs.length === 0 ? (
              <p style={{ color: "#8a9fc2" }}>All listings clear. Queue is empty.</p>
            ) : (
              flaggedJobs.map((job) => (
                <div key={job.id} className="card" style={{ background: "#1c2340", display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h4 style={{ margin: 0 }}>{job.title}</h4>
                      <span style={{ fontSize: "0.85rem", color: "#8a9fc2" }}>Budget: ${job.budgetMin} - ${job.budgetMax}</span>
                    </div>
                    <span style={{ background: "#b91c1c", padding: "0.2rem 0.6rem", borderRadius: "4px", fontSize: "0.8rem" }}>FLAGGED</span>
                  </div>
                  <p>{job.description}</p>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={() => handleModerateJob(job.id, "APPROVE")} style={{ background: "#059669", color: "#fff", border: "none", borderRadius: "4px", padding: "0.5rem 1rem", cursor: "pointer" }}>
                      Approve Listing
                    </button>
                    <button onClick={() => handleModerateJob(job.id, "REJECT")} style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: "4px", padding: "0.5rem 1rem", cursor: "pointer" }}>
                      Reject & Take Down
                    </button>
                  </div>
                </div>
              ))
            )}

            {rejectionJobId && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
                <div className="card" style={{ maxWidth: 500, width: "90%", background: "#151c35", color: "#fff", padding: "2rem" }}>
                  <h3>Provide Rejection Reason</h3>
                  <textarea
                    rows={4}
                    placeholder="Provide detailed feedback on why this listing is being rejected..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    style={{ width: "100%", padding: "0.6rem", background: "#1c2340", border: "1px solid #2a3765", color: "#fff", borderRadius: "6px", marginBottom: "1rem" }}
                  />
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                    <button onClick={() => setRejectionJobId(null)} style={{ background: "#4b5563", border: "none", color: "#fff", borderRadius: "4px", padding: "0.5rem 1rem", cursor: "pointer" }}>
                      Cancel
                    </button>
                    <button onClick={() => handleModerateJob(rejectionJobId, "REJECT", rejectionReason)} style={{ background: "#dc2626", border: "none", color: "#fff", borderRadius: "4px", padding: "0.5rem 1rem", cursor: "pointer" }}>
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "disputes" && (
          <div>
            <h3>Dispute Resolution Center</h3>
            {disputes.length === 0 ? (
              <p style={{ color: "#8a9fc2" }}>No open disputes.</p>
            ) : (
              disputes.map((d) => (
                <div key={d.id} className="card" style={{ background: "#1c2340", display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h4 style={{ margin: 0 }}>Dispute #{d.id} (Job: {d.jobId})</h4>
                      <span style={{ fontSize: "0.85rem", color: "#8a9fc2" }}>Raised by: {d.creatorId} | Created: {new Date(d.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span style={{
                      padding: "0.2rem 0.6rem",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                      background: d.status === "OPEN" ? "#b45309" : d.status === "UNDER_REVIEW" ? "#2563eb" : "#059669"
                    }}>
                      {d.status}
                    </span>
                  </div>
                  <div>
                    <strong>Reason for Dispute:</strong>
                    <p style={{ margin: "0.2rem 0 0.8rem 0" }}>{d.reason}</p>
                    {d.evidence && (
                      <>
                        <strong>Provided Evidence:</strong>
                        <p style={{ margin: "0.2rem 0 0 0", color: "#a5b4fc" }}>{d.evidence}</p>
                      </>
                    )}
                  </div>
                  {d.status !== "RESOLVED" && d.status !== "ESCALATED" && (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={() => {
                          setDisputeDecisionId(d.id);
                          setDisputeRuling("RESOLVED");
                        }}
                        style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: "4px", padding: "0.5rem 1rem", cursor: "pointer" }}
                      >
                        Make Ruling & Refund
                      </button>
                      <button
                        onClick={() => handleResolveDispute(d.id, "ESCALATED", 0)}
                        style={{ background: "#d97706", color: "#fff", border: "none", borderRadius: "4px", padding: "0.5rem 1rem", cursor: "pointer" }}
                      >
                        Escalate Dispute
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}

            {disputeDecisionId && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
                <div className="card" style={{ maxWidth: 500, width: "90%", background: "#151c35", color: "#fff", padding: "2rem" }}>
                  <h3>Arbitrate & Refund</h3>
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem" }}>Refund Percentage to Dispute Creator:</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={refundPercent}
                      onChange={(e) => setRefundPercent(Number(e.target.value))}
                      style={{ width: "100%", padding: "0.6rem", background: "#1c2340", border: "1px solid #2a3765", color: "#fff", borderRadius: "6px" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                    <button onClick={() => setDisputeDecisionId(null)} style={{ background: "#4b5563", border: "none", color: "#fff", borderRadius: "4px", padding: "0.5rem 1rem", cursor: "pointer" }}>
                      Cancel
                    </button>
                    <button onClick={() => handleResolveDispute(disputeDecisionId, "RESOLVED", refundPercent)} style={{ background: "#059669", border: "none", color: "#fff", borderRadius: "4px", padding: "0.5rem 1rem", cursor: "pointer" }}>
                      Apply Decision
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "controls" && (
          <div>
            <h3>Platform System Controls</h3>
            <p style={{ color: "#8a9fc2", marginBottom: "1.5rem" }}>Toggles below take action immediately but require explicit administrator confirmation.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "#1c2340", borderRadius: "8px" }}>
                <div>
                  <h4 style={{ margin: 0 }}>New User Registrations</h4>
                  <span style={{ fontSize: "0.85rem", color: "#8a9fc2" }}>Toggle whether the platform accepts brand new accounts.</span>
                </div>
                <button
                  onClick={() => handleToggleControl("registrationEnabled", platformControls.registrationEnabled)}
                  style={{
                    padding: "0.6rem 1.2rem",
                    background: platformControls.registrationEnabled ? "#059669" : "#dc2626",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  {platformControls.registrationEnabled ? "Enabled" : "Disabled"}
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "#1c2340", borderRadius: "8px" }}>
                <div>
                  <h4 style={{ margin: 0 }}>New Job Postings</h4>
                  <span style={{ fontSize: "0.85rem", color: "#8a9fc2" }}>Toggle whether users can publish new project requirements.</span>
                </div>
                <button
                  onClick={() => handleToggleControl("jobPostingEnabled", platformControls.jobPostingEnabled)}
                  style={{
                    padding: "0.6rem 1.2rem",
                    background: platformControls.jobPostingEnabled ? "#059669" : "#dc2626",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  {platformControls.jobPostingEnabled ? "Enabled" : "Disabled"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div>
            <h3>Append-Only System Audit Logs</h3>
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
              <input
                type="text"
                placeholder="Filter by Admin ID..."
                value={logAdminFilter}
                onChange={(e) => setLogAdminFilter(e.target.value)}
                style={{ padding: "0.6rem", background: "#1c2340", border: "1px solid #2a3765", color: "#fff", borderRadius: "6px", flex: 1 }}
              />
              <input
                type="text"
                placeholder="Filter by Action (e.g. SUSPEND_USER)..."
                value={logActionFilter}
                onChange={(e) => setLogActionFilter(e.target.value)}
                style={{ padding: "0.6rem", background: "#1c2340", border: "1px solid #2a3765", color: "#fff", borderRadius: "6px", flex: 1 }}
              />
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#1c2340", textAlign: "left" }}>
                  <th style={{ padding: "1rem" }}>Timestamp</th>
                  <th style={{ padding: "1rem" }}>Admin ID</th>
                  <th style={{ padding: "1rem" }}>Action</th>
                  <th style={{ padding: "1rem" }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: "1px solid #2a3765" }}>
                    <td style={{ padding: "1rem", fontSize: "0.85rem", color: "#8a9fc2" }}>{new Date(log.createdAt).toLocaleString()}</td>
                    <td style={{ padding: "1rem" }}>{log.adminId}</td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{ background: "#312e81", color: "#c7d2fe", padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.8rem" }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Confirmation Dialog component */}
      {dialog?.open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
          <div className="card" style={{ maxWidth: 450, width: "90%", background: "#151c35", color: "#fff", padding: "2rem" }}>
            <h3>{dialog.title}</h3>
            <p style={{ color: "#8a9fc2", margin: "1rem 0" }}>{dialog.description}</p>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button onClick={() => setDialog(null)} style={{ background: "#4b5563", border: "none", color: "#fff", borderRadius: "4px", padding: "0.6rem 1.2rem", cursor: "pointer" }}>
                Cancel
              </button>
              <button
                onClick={dialog.onConfirm}
                style={{ background: "#2563eb", border: "none", color: "#fff", borderRadius: "4px", padding: "0.6rem 1.2rem", cursor: "pointer" }}
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
