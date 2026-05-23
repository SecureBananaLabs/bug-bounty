"use client";

import { useState, useEffect } from "react";

// ── Types ──────────────────────────────────────────────────
type Metrics = {
  overview: Record<string, number>;
  trends: Record<string, number>;
  system: Record<string, string | number>;
};

type User = {
  id: string; name: string; email: string; role: string;
  status: string; joinedAt: string; flags: number;
};

type FlaggedJob = {
  id: string; title: string; postedBy: string;
  flags: number; reason: string; reportedAt: string;
};

type Dispute = {
  id: string; jobId: string; filedBy: string; against: string;
  reason: string; status: string; filedAt: string; resolvedAt?: string;
  resolution?: string; refundAmount?: number;
};

type AuditLog = {
  id: string; adminId: string; action: string;
  targetId: string; timestamp: string; details: string;
};

// ── Tab Definitions ────────────────────────────────────────
const TABS = [
  { id: "overview", label: "📊 Overview" },
  { id: "users", label: "👥 Users" },
  { id: "jobs", label: "🚩 Flagged Jobs" },
  { id: "disputes", label: "⚖️ Disputes" },
  { id: "audit", label: "📋 Audit Log" },
  { id: "settings", label: "⚙️ Settings" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ── Main Admin Panel ───────────────────────────────────────
export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [flaggedJobs, setFlaggedJobs] = useState<FlaggedJob[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  async function fetchAdminData() {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const [mRes, uRes, jRes, dRes, aRes] = await Promise.all([
        fetch("/api/admin/stats", { headers }),
        fetch("/api/admin/users", { headers }),
        fetch("/api/admin/jobs/flagged", { headers }),
        fetch("/api/admin/disputes", { headers }),
        fetch("/api/admin/audit-log", { headers }),
      ]);

      if (mRes.ok) setMetrics((await mRes.json()).data || await mRes.json());
      if (uRes.ok) setUsers(((await uRes.json()).data || await uRes.json()).users || []);
      if (jRes.ok) setFlaggedJobs(((await jRes.json()).data || await jRes.json()).jobs || []);
      if (dRes.ok) setDisputes(((await dRes.json()).data || await dRes.json()).disputes || []);
      if (aRes.ok) setAuditLog(((await aRes.json()).data || await aRes.json()).logs || []);
    } catch (err) {
      console.error("Admin data fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }

  function getToken() {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || "";
    }
    return "";
  }

  async function handleUserAction(userId: string, action: string) {
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ status: action, reason: `Admin action: ${action}` }),
    });
    fetchAdminData();
  }

  async function handleJobModerate(jobId: string, action: string) {
    await fetch(`/api/admin/jobs/${jobId}/moderate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ action, reason: `Moderated: ${action}` }),
    });
    fetchAdminData();
  }

  async function handleResolveDispute(disputeId: string, resolution: string, refundAmount: number) {
    await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ resolution, refundAmount }),
    });
    fetchAdminData();
  }

  if (loading) {
    return (
      <section className="card">
        <h2>Admin Panel</h2>
        <p>Loading dashboard data...</p>
      </section>
    );
  }

  return (
    <section className="card" style={{ maxWidth: "100%", padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ margin: 0 }}>🛡️ Admin Panel</h2>
        <span style={{ fontSize: "0.85rem", color: "var(--muted, #888)" }}>
          {metrics?.system?.uptime ? `Uptime: ${metrics.system.uptime}` : ""}
        </span>
      </div>

      {/* Tab Navigation */}
      <nav style={{ display: "flex", gap: "0.25rem", marginBottom: "1.5rem", borderBottom: "2px solid var(--border, #eee)", paddingBottom: "0.5rem", flexWrap: "wrap" }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "0.5rem 1rem",
              border: "none",
              background: activeTab === tab.id ? "var(--accent, #4f46e5)" : "transparent",
              color: activeTab === tab.id ? "white" : "var(--text, #333)",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: activeTab === tab.id ? 600 : 400,
              fontSize: "0.9rem",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab metrics={metrics} />}
      {activeTab === "users" && <UsersTab users={users} onAction={handleUserAction} />}
      {activeTab === "jobs" && <JobsTab jobs={flaggedJobs} onModerate={handleJobModerate} />}
      {activeTab === "disputes" && <DisputesTab disputes={disputes} onResolve={handleResolveDispute} />}
      {activeTab === "audit" && <AuditTab logs={auditLog} />}
      {activeTab === "settings" && <SettingsTab />}
    </section>
  );
}

// ── Overview Tab ───────────────────────────────────────────
function OverviewTab({ metrics }: { metrics: Metrics | null }) {
  if (!metrics) return <p>No metrics available</p>;

  const statCards = [
    { label: "Open Jobs", value: metrics.overview?.openJobs, color: "#4f46e5" },
    { label: "Active Freelancers", value: metrics.overview?.activeFreelancers, color: "#059669" },
    { label: "Total Clients", value: metrics.overview?.totalClients, color: "#d97706" },
    { label: "Flagged Accounts", value: metrics.overview?.flaggedAccounts, color: "#dc2626" },
    { label: "Monthly Volume", value: `$${(metrics.overview?.monthlyVolume || 0).toLocaleString()}`, color: "#7c3aed" },
    { label: "Dispute Rate", value: `${metrics.overview?.disputeRate}%`, color: "#0891b2" },
  ];

  return (
    <div>
      <h3>Platform Overview</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {statCards.map((card) => (
          <div key={card.label} style={{ padding: "1rem", borderRadius: "8px", background: "var(--card-bg, #f9fafb)", borderLeft: `4px solid ${card.color}` }}>
            <div style={{ fontSize: "0.8rem", color: "var(--muted, #888)", marginBottom: "0.25rem" }}>{card.label}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{card.value ?? "—"}</div>
          </div>
        ))}
      </div>

      <h3>Weekly Trends</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {Object.entries(metrics.trends || {}).map(([key, val]) => (
          <div key={key} style={{ padding: "0.75rem", borderRadius: "6px", background: "var(--card-bg, #f9fafb)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--muted, #888)", textTransform: "capitalize" }}>{key.replace(/([A-Z])/g, " $1")}</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>
              {key.toLowerCase().includes("revenue") ? `$${val.toLocaleString()}` : val}
            </div>
          </div>
        ))}
      </div>

      <h3>System Health</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
        {Object.entries(metrics.system || {}).map(([key, val]) => (
          <div key={key} style={{ padding: "0.5rem", fontSize: "0.85rem" }}>
            <span style={{ color: "var(--muted, #888)" }}>{key.replace(/([A-Z])/g, " $1").trim()}: </span>
            <strong>{val}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Users Tab ──────────────────────────────────────────────
function UsersTab({ users, onAction }: { users: User[]; onAction: (id: string, action: string) => void }) {
  return (
    <div>
      <h3>User Management</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border, #eee)", textAlign: "left" }}>
              <th style={{ padding: "0.5rem" }}>Name</th>
              <th style={{ padding: "0.5rem" }}>Email</th>
              <th style={{ padding: "0.5rem" }}>Role</th>
              <th style={{ padding: "0.5rem" }}>Status</th>
              <th style={{ padding: "0.5rem" }}>Flags</th>
              <th style={{ padding: "0.5rem" }}>Joined</th>
              <th style={{ padding: "0.5rem" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: "1px solid var(--border, #eee)" }}>
                <td style={{ padding: "0.5rem", fontWeight: 500 }}>{user.name}</td>
                <td style={{ padding: "0.5rem", color: "var(--muted, #888)" }}>{user.email}</td>
                <td style={{ padding: "0.5rem" }}>
                  <span style={{ padding: "0.15rem 0.5rem", borderRadius: "12px", fontSize: "0.8rem", background: user.role === "admin" ? "#7c3aed20" : user.role === "freelancer" ? "#05966920" : "#d9770620", color: user.role === "admin" ? "#7c3aed" : user.role === "freelancer" ? "#059669" : "#d97706" }}>
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: "0.5rem" }}>
                  <span style={{ padding: "0.15rem 0.5rem", borderRadius: "12px", fontSize: "0.8rem", background: user.status === "active" ? "#05966920" : user.status === "flagged" ? "#d9770620" : "#dc262620", color: user.status === "active" ? "#059669" : user.status === "flagged" ? "#d97706" : "#dc2626" }}>
                    {user.status}
                  </span>
                </td>
                <td style={{ padding: "0.5rem", color: user.flags > 0 ? "#dc2626" : "inherit" }}>{user.flags}</td>
                <td style={{ padding: "0.5rem", color: "var(--muted, #888)" }}>{user.joinedAt}</td>
                <td style={{ padding: "0.5rem", display: "flex", gap: "0.25rem" }}>
                  {user.status !== "banned" && user.role !== "admin" && (
                    <>
                      {user.status === "flagged" && (
                        <button onClick={() => onAction(user.id, "active")} style={btnSm}>✅ Unflag</button>
                      )}
                      <button onClick={() => onAction(user.id, "banned")} style={{ ...btnSm, color: "#dc2626" }}>🚫 Ban</button>
                    </>
                  )}
                  {user.status === "banned" && (
                    <button onClick={() => onAction(user.id, "active")} style={btnSm}>🔄 Unban</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Flagged Jobs Tab ───────────────────────────────────────
function JobsTab({ jobs, onModerate }: { jobs: FlaggedJob[]; onModerate: (id: string, action: string) => void }) {
  return (
    <div>
      <h3>Flagged Jobs — Moderation Queue</h3>
      {jobs.length === 0 ? (
        <p style={{ color: "#059669" }}>✅ No flagged jobs — queue is clear!</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border, #eee)", textAlign: "left" }}>
                <th style={{ padding: "0.5rem" }}>Job</th>
                <th style={{ padding: "0.5rem" }}>Posted By</th>
                <th style={{ padding: "0.5rem" }}>Flags</th>
                <th style={{ padding: "0.5rem" }}>Reason</th>
                <th style={{ padding: "0.5rem" }}>Reported</th>
                <th style={{ padding: "0.5rem" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} style={{ borderBottom: "1px solid var(--border, #eee)" }}>
                  <td style={{ padding: "0.5rem", fontWeight: 500 }}>{job.title}</td>
                  <td style={{ padding: "0.5rem" }}>{job.postedBy}</td>
                  <td style={{ padding: "0.5rem", color: "#dc2626", fontWeight: 600 }}>{job.flags}</td>
                  <td style={{ padding: "0.5rem" }}>{job.reason}</td>
                  <td style={{ padding: "0.5rem", color: "var(--muted, #888)" }}>{job.reportedAt}</td>
                  <td style={{ padding: "0.5rem", display: "flex", gap: "0.25rem" }}>
                    <button onClick={() => onModerate(job.id, "approve")} style={btnSm}>✅ Approve</button>
                    <button onClick={() => onModerate(job.id, "remove")} style={{ ...btnSm, color: "#dc2626" }}>🗑️ Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Disputes Tab ───────────────────────────────────────────
function DisputesTab({ disputes, onResolve }: { disputes: Dispute[]; onResolve: (id: string, resolution: string, amount: number) => void }) {
  const [resolutionInputs, setResolutionInputs] = useState<Record<string, { resolution: string; refund: number }>>({});

  return (
    <div>
      <h3>Dispute Resolution</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border, #eee)", textAlign: "left" }}>
              <th style={{ padding: "0.5rem" }}>ID</th>
              <th style={{ padding: "0.5rem" }}>Job</th>
              <th style={{ padding: "0.5rem" }}>Filed By</th>
              <th style={{ padding: "0.5rem" }}>Against</th>
              <th style={{ padding: "0.5rem" }}>Reason</th>
              <th style={{ padding: "0.5rem" }}>Status</th>
              <th style={{ padding: "0.5rem" }}>Filed</th>
              <th style={{ padding: "0.5rem" }}>Resolution</th>
            </tr>
          </thead>
          <tbody>
            {disputes.map((d) => (
              <tr key={d.id} style={{ borderBottom: "1px solid var(--border, #eee)" }}>
                <td style={{ padding: "0.5rem", fontFamily: "monospace" }}>{d.id}</td>
                <td style={{ padding: "0.5rem" }}>{d.jobId}</td>
                <td style={{ padding: "0.5rem" }}>{d.filedBy}</td>
                <td style={{ padding: "0.5rem" }}>{d.against}</td>
                <td style={{ padding: "0.5rem" }}>{d.reason}</td>
                <td style={{ padding: "0.5rem" }}>
                  <span style={{ padding: "0.15rem 0.5rem", borderRadius: "12px", fontSize: "0.8rem", background: d.status === "open" ? "#d9770620" : "#05966920", color: d.status === "open" ? "#d97706" : "#059669" }}>
                    {d.status}
                  </span>
                </td>
                <td style={{ padding: "0.5rem", color: "var(--muted, #888)" }}>{d.filedAt}</td>
                <td style={{ padding: "0.5rem" }}>
                  {d.status === "open" ? (
                    <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                      <input
                        placeholder="Resolution note"
                        style={{ padding: "0.25rem", width: "120px", fontSize: "0.8rem", borderRadius: "4px", border: "1px solid var(--border, #ddd)" }}
                        onChange={(e) => setResolutionInputs({ ...resolutionInputs, [d.id]: { ...resolutionInputs[d.id], resolution: e.target.value } })}
                      />
                      <input
                        type="number"
                        placeholder="$0"
                        style={{ padding: "0.25rem", width: "60px", fontSize: "0.8rem", borderRadius: "4px", border: "1px solid var(--border, #ddd)" }}
                        onChange={(e) => setResolutionInputs({ ...resolutionInputs, [d.id]: { ...resolutionInputs[d.id], refund: Number(e.target.value) } })}
                      />
                      <button
                        onClick={() => onResolve(d.id, resolutionInputs[d.id]?.resolution || "Resolved", resolutionInputs[d.id]?.refund || 0)}
                        style={btnSm}
                      >
                        Resolve
                      </button>
                    </div>
                  ) : (
                    <span style={{ color: "#059669", fontSize: "0.85rem" }}>
                      {d.resolution || "Resolved"} {d.refundAmount ? `(Refund: $${d.refundAmount})` : ""}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Audit Log Tab ──────────────────────────────────────────
function AuditTab({ logs }: { logs: AuditLog[] }) {
  return (
    <div>
      <h3>Audit Trail</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border, #eee)", textAlign: "left" }}>
              <th style={{ padding: "0.5rem" }}>Timestamp</th>
              <th style={{ padding: "0.5rem" }}>Admin</th>
              <th style={{ padding: "0.5rem" }}>Action</th>
              <th style={{ padding: "0.5rem" }}>Target</th>
              <th style={{ padding: "0.5rem" }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} style={{ borderBottom: "1px solid var(--border, #eee)" }}>
                <td style={{ padding: "0.5rem", fontFamily: "monospace", color: "var(--muted, #888)", whiteSpace: "nowrap" }}>
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td style={{ padding: "0.5rem" }}>{log.adminId}</td>
                <td style={{ padding: "0.5rem" }}>
                  <span style={{ padding: "0.15rem 0.5rem", borderRadius: "12px", fontSize: "0.75rem", background: "#4f46e520", color: "#4f46e5" }}>
                    {log.action.replace(/_/g, " ")}
                  </span>
                </td>
                <td style={{ padding: "0.5rem", fontFamily: "monospace" }}>{log.targetId}</td>
                <td style={{ padding: "0.5rem", color: "var(--muted, #888)" }}>{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Settings Tab ───────────────────────────────────────────
function SettingsTab() {
  const [config, setConfig] = useState({
    maxJobsPerClient: 10,
    requireEmailVerification: true,
    autoFlagThreshold: 3,
    maintenanceMode: false,
  });
  const [saved, setSaved] = useState(false);

  function toggle(key: string) {
    setConfig((c) => ({ ...c, [key]: !(c as any)[key] }));
  }

  function saveConfig() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <h3>Platform Configuration</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "500px" }}>
        {Object.entries(config).map(([key, val]) => (
          <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", borderRadius: "8px", background: "var(--card-bg, #f9fafb)" }}>
            <div>
              <div style={{ fontWeight: 500, textTransform: "capitalize" }}>{key.replace(/([A-Z])/g, " $1")}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--muted, #888)" }}>{
                key === "maxJobsPerClient" ? "Maximum active jobs per client" :
                key === "requireEmailVerification" ? "Require email verification for new accounts" :
                key === "autoFlagThreshold" ? "Auto-flag accounts after this many reports" :
                key === "maintenanceMode" ? "Show maintenance page to all non-admin users" : ""
              }</div>
            </div>
            {typeof val === "boolean" ? (
              <button
                onClick={() => toggle(key)}
                style={{
                  padding: "0.4rem 1rem", borderRadius: "20px", border: "none", cursor: "pointer",
                  background: val ? "#059669" : "#d1d5db", color: val ? "white" : "#6b7280",
                  fontWeight: 600, fontSize: "0.85rem", transition: "all 0.2s",
                }}
              >
                {val ? "ON" : "OFF"}
              </button>
            ) : (
              <strong>{val}</strong>
            )}
          </div>
        ))}
      </div>
      <button onClick={saveConfig} style={{ marginTop: "1rem", padding: "0.6rem 2rem", borderRadius: "8px", border: "none", background: "var(--accent, #4f46e5)", color: "white", fontWeight: 600, cursor: "pointer" }}>
        {saved ? "✅ Saved!" : "💾 Save Settings"}
      </button>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────
const btnSm: React.CSSProperties = {
  padding: "0.3rem 0.6rem",
  borderRadius: "6px",
  border: "1px solid var(--border, #ddd)",
  background: "var(--card-bg, white)",
  cursor: "pointer",
  fontSize: "0.8rem",
  fontWeight: 500,
};
