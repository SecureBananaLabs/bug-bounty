"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ──
interface User {
  id: string; fullName: string; email: string; role: string;
  status: string; createdAt: string;
}

interface Job {
  id: string; title: string; status: string; isFlagged: boolean;
  flagReason?: string; flagNote?: string; clientId: string;
}

interface Dispute {
  id: string; reason: string; description: string; status: string;
  clientId: string; freelancerId: string; jobId: string; createdAt: string;
  resolution?: string;
}

interface AuditEntry {
  id: string; action: string; targetType: string; targetId?: string;
  details?: string; adminId: string; createdAt: string;
}

interface Metrics {
  totalUsers: number; activeJobs: number; unresolvedDisputes: number;
  flaggedListings: number; currentPeriodRevenue: number;
}

interface PlatformSettings {
  registrationsOpen: boolean; jobPostingOpen: boolean;
}

// ── API helpers ──
const API = "/api/admin";

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Request failed");
  return data.data;
}

// ── Main Admin Panel ──
export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState<string>("metrics");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const m = await apiFetch("/metrics");
      const s = await apiFetch("/settings");
      setMetrics(m);
      setSettings(s);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <section className="card"><p>Loading admin panel...</p></section>;
  if (error) return <section className="card"><p style={{ color: "#ff6b6b" }}>Error: {error}</p></section>;

  return (
    <section className="card" style={{ padding: "1.5rem" }}>
      <h2 style={{ marginTop: 0 }}>Admin Panel</h2>

      {/* Tab Navigation */}
      <nav style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {["metrics", "users", "moderation", "disputes", "controls", "audit"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: 8,
              border: "1px solid #2a3765",
              background: activeTab === tab ? "#5468ff" : "transparent",
              color: activeTab === tab ? "white" : "#a0aec0",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      {activeTab === "metrics" && <MetricsDashboard metrics={metrics!} />}
      {activeTab === "users" && <UserManagement />}
      {activeTab === "moderation" && <JobModeration />}
      {activeTab === "disputes" && <DisputeResolution />}
      {activeTab === "controls" && <PlatformControls settings={settings!} onUpdate={fetchData} />}
      {activeTab === "audit" && <AuditLogViewer />}
    </section>
  );
}

// ── 1. Metrics Dashboard ──
function MetricsDashboard({ metrics }: { metrics: Metrics }) {
  return (
    <div>
      <h3>Trust & Metrics Dashboard</h3>
      <div className="grid">
        <SummaryCard title="Total Users" value={metrics.totalUsers} />
        <SummaryCard title="Active Jobs" value={metrics.activeJobs} />
        <SummaryCard title="Unresolved Disputes" value={metrics.unresolvedDisputes} color="#ff6b6b" />
        <SummaryCard title="Flagged Listings" value={metrics.flaggedListings} color="#f0ad4e" />
        <SummaryCard title="Revenue (This Period)" value={`$${(metrics.currentPeriodRevenue / 100).toLocaleString()}`} color="#48bb78" />
      </div>
      <div style={{ marginTop: "1rem", padding: "1rem", background: "#0d1425", borderRadius: 8 }}>
        <h4>Trust Score Distribution</h4>
        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
          <BarLabel label="Low" count={15} color="#ff6b6b" />
          <BarLabel label="Medium" count={120} color="#f0ad4e" />
          <BarLabel label="High" count={110} color="#48bb78" />
        </div>
      </div>
      <button onClick={() => window.location.reload()} style={refreshBtnStyle}>
        Refresh Data
      </button>
    </div>
  );
}

function SummaryCard({ title, value, color }: { title: string; value: string | number; color?: string }) {
  return (
    <div className="card" style={{ textAlign: "center" }}>
      <p style={{ color: "#a0aec0", margin: 0, fontSize: "0.85rem" }}>{title}</p>
      <p style={{ fontSize: "2rem", fontWeight: 700, color: color || "#f2f5ff", margin: "0.5rem 0 0" }}>{value}</p>
    </div>
  );
}

function BarLabel({ label, count, color }: { label: string; count: number; color: string }) {
  const max = 150;
  const pct = Math.min((count / max) * 100, 100);
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: 4 }}>
        <span>{label}</span><span>{count}</span>
      </div>
      <div style={{ height: 12, background: "#151c35", borderRadius: 6, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 6, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

// ── 2. User Management ──
function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);
      const data = await apiFetch(`/users?${params.toString()}`);
      setUsers(data.users || []);
    } catch (e: any) { setMessage(e.message); }
    finally { setLoading(false); }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const action = async (userId: string, action: string) => {
    try {
      await apiFetch(`/users/${userId}/${action}`, { method: "POST" });
      setMessage(`User ${action}d successfully`);
      fetchUsers();
    } catch (e: any) { setMessage(`Error: ${e.message}`); }
  };

  return (
    <div>
      <h3>User Management</h3>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={inputStyle} />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={selectStyle}>
          <option value="">All Roles</option>
          <option value="CLIENT">Client</option>
          <option value="FREELANCER">Freelancer</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="BANNED">Banned</option>
        </select>
      </div>
      {message && <p style={{ color: message.startsWith("Error") ? "#ff6b6b" : "#48bb78", marginBottom: "0.5rem" }}>{message}</p>}
      {loading ? <p>Loading...</p> : users.length === 0 ? <p>No users found.</p> : (
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th><th style={thStyle}>Email</th><th style={thStyle}>Role</th>
                <th style={thStyle}>Status</th><th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={tdStyle}>{u.fullName}</td>
                  <td style={tdStyle}>{u.email}</td>
                  <td style={tdStyle}><Badge text={u.role} /></td>
                  <td style={tdStyle}>
                    <span style={{ color: u.status === "ACTIVE" ? "#48bb78" : u.status === "SUSPENDED" ? "#f0ad4e" : "#ff6b6b" }}>{u.status}</span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: "0.3rem" }}>
                      {u.status !== "SUSPENDED" && u.status !== "BANNED" && (
                        <button onClick={() => action(u.id, "suspend")} style={actionBtnStyle("#f0ad4e")}>Suspend</button>
                      )}
                      {u.status === "SUSPENDED" && (
                        <button onClick={() => action(u.id, "resume")} style={actionBtnStyle("#48bb78")}>Resume</button>
                      )}
                      {u.status !== "BANNED" && (
                        <button onClick={() => action(u.id, "ban")} style={actionBtnStyle("#ff6b6b")}>Ban</button>
                      )}
                    </div>
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

// ── 3. Job Moderation ──
function JobModeration() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/jobs/queue");
      setJobs(data.jobs || []);
    } catch (e: any) { setMessage(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const action = async (jobId: string, action: string, reason?: string) => {
    try {
      await apiFetch(`/jobs/${jobId}/${action}`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      setMessage(`Job ${action}d successfully`);
      fetchJobs();
    } catch (e: any) { setMessage(`Error: ${e.message}`); }
  };

  return (
    <div>
      <h3>Job & Listing Moderation</h3>
      {message && <p style={{ color: message.startsWith("Error") ? "#ff6b6b" : "#48bb78", marginBottom: "0.5rem" }}>{message}</p>}
      {loading ? <p>Loading...</p> : jobs.length === 0 ? <p>No flagged jobs in queue.</p> : (
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Title</th><th style={thStyle}>Flag Reason</th>
                <th style={thStyle}>Note</th><th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id}>
                  <td style={tdStyle}>{j.title}</td>
                  <td style={tdStyle}><Badge text={j.flagReason || "Unknown"} color="#f0ad4e" /></td>
                  <td style={tdStyle}>{j.flagNote || "—"}</td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: "0.3rem" }}>
                      <button onClick={() => action(j.id, "approve")} style={actionBtnStyle("#48bb78")}>Approve</button>
                      <button onClick={() => action(j.id, "reject", "Violates platform policy")} style={actionBtnStyle("#ff6b6b")}>Reject</button>
                    </div>
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

// ── 4. Dispute Resolution ──
function DisputeResolution() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : "";
      const data = await apiFetch(`/disputes${params}`);
      setDisputes(data.disputes || []);
    } catch (e: any) { setMessage(e.message); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchDisputes(); }, [fetchDisputes]);

  const resolve = async (disputeId: string, favorClient: boolean) => {
    try {
      await apiFetch(`/disputes/${disputeId}/resolve`, {
        method: "POST",
        body: JSON.stringify({ favorClient, resolution: favorClient ? "Resolved in favor of client" : "Resolved in favor of freelancer" }),
      });
      setMessage("Dispute resolved");
      fetchDisputes();
      setSelectedDispute(null);
    } catch (e: any) { setMessage(`Error: ${e.message}`); }
  };

  return (
    <div>
      <h3>Dispute Resolution</h3>
      <div style={{ marginBottom: "1rem" }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="RESOLVED_CLIENT">Resolved (Client)</option>
          <option value="RESOLVED_FREELANCER">Resolved (Freelancer)</option>
          <option value="ESCALATED">Escalated</option>
        </select>
      </div>
      {message && <p style={{ color: message.startsWith("Error") ? "#ff6b6b" : "#48bb78", marginBottom: "0.5rem" }}>{message}</p>}
      {loading ? <p>Loading...</p> : disputes.length === 0 ? <p>No disputes found.</p> : (
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Reason</th><th style={thStyle}>Status</th>
                <th style={thStyle}>Job ID</th><th style={thStyle}>Created</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map((d) => (
                <tr key={d.id}>
                  <td style={tdStyle}>{d.reason}</td>
                  <td style={tdStyle}><StatusBadge status={d.status} /></td>
                  <td style={tdStyle}><code>{d.jobId.slice(0, 8)}...</code></td>
                  <td style={tdStyle}>{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td style={tdStyle}>
                    {(d.status === "OPEN" || d.status === "UNDER_REVIEW") ? (
                      <div style={{ display: "flex", gap: "0.3rem" }}>
                        <button onClick={() => resolve(d.id, true)} style={actionBtnStyle("#5468ff")}>Favor Client</button>
                        <button onClick={() => resolve(d.id, false)} style={actionBtnStyle("#48bb78")}>Favor Freelancer</button>
                        <button onClick={() => {
                          apiFetch(`/disputes/${d.id}/resolve`, { method: "POST", body: JSON.stringify({ escalated: true }) }).then(fetchDisputes);
                        }} style={actionBtnStyle("#f0ad4e")}>Escalate</button>
                      </div>
                    ) : (
                      <span style={{ color: "#a0aec0" }}>{d.resolution || d.status}</span>
                    )}
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

// ── 5. Platform Controls ──
function PlatformControls({ settings, onUpdate }: { settings: PlatformSettings; onUpdate: () => void }) {
  const [message, setMessage] = useState("");

  const toggle = async (endpoint: string, open: boolean, label: string) => {
    if (!confirm(`Are you sure you want to ${open ? "enable" : "disable"} ${label}?`)) return;
    try {
      await apiFetch(endpoint, { method: "POST", body: JSON.stringify({ open }) });
      setMessage(`${label} ${open ? "enabled" : "disabled"} successfully`);
      onUpdate();
    } catch (e: any) { setMessage(`Error: ${e.message}`); }
  };

  return (
    <div>
      <h3>Platform Controls</h3>
      {message && <p style={{ color: message.startsWith("Error") ? "#ff6b6b" : "#48bb78", marginBottom: "1rem" }}>{message}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <ToggleRow
          label="New User Registrations"
          enabled={settings.registrationsOpen}
          onToggle={(v) => toggle("/settings/registrations", v, "User registrations")}
        />
        <ToggleRow
          label="New Job Posting"
          enabled={settings.jobPostingOpen}
          onToggle={(v) => toggle("/settings/job-posting", v, "Job posting")}
        />
      </div>
    </div>
  );
}

function ToggleRow({ label, enabled, onToggle }: { label: string; enabled: boolean; onToggle: (v: boolean) => void }) {
  return (
    <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ color: enabled ? "#48bb78" : "#ff6b6b", fontSize: "0.85rem" }}>{enabled ? "Enabled" : "Disabled"}</span>
        <button onClick={() => onToggle(!enabled)} style={{
          ...actionBtnStyle(enabled ? "#ff6b6b" : "#48bb78"),
          minWidth: 80,
        }}>
          {enabled ? "Disable" : "Enable"}
        </button>
      </div>
    </div>
  );
}

// ── 6. Audit Log ──
function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [actionFilter, setActionFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = actionFilter ? `?action=${actionFilter}` : "";
      const data = await apiFetch(`/audit-log${params}`);
      setLogs(data.logs || []);
    } catch (e) {}
    finally { setLoading(false); }
  }, [actionFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const uniqueActions = [...new Set(logs.map((l) => l.action))];

  return (
    <div>
      <h3>Audit Log</h3>
      <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} style={selectStyle}>
          <option value="">All Actions</option>
          {uniqueActions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      {loading ? <p>Loading...</p> : logs.length === 0 ? <p>No audit entries found.</p> : (
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Timestamp</th><th style={thStyle}>Action</th>
                <th style={thStyle}>Target</th><th style={thStyle}>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td style={tdStyle}>{new Date(l.createdAt).toLocaleString()}</td>
                  <td style={tdStyle}><code style={{ fontSize: "0.8rem" }}>{l.action}</code></td>
                  <td style={tdStyle}>{l.targetType}{l.targetId ? ` #${l.targetId.slice(0, 8)}` : ""}</td>
                  <td style={tdStyle}>{l.details || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Shared components / helpers ──
function Badge({ text, color }: { text: string; color?: string }) {
  return (
    <span style={{
      padding: "0.15rem 0.5rem", borderRadius: 12, fontSize: "0.75rem",
      background: color ? `${color}22` : "#5468ff22",
      color: color || "#a0aec0", border: `1px solid ${color || "#5468ff"}44`,
    }}>{text}</span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    OPEN: "#f0ad4e", UNDER_REVIEW: "#5468ff", RESOLVED_CLIENT: "#48bb78",
    RESOLVED_FREELANCER: "#48bb78", ESCALATED: "#ff6b6b",
  };
  return <Badge text={status.replace(/_/g, " ")} color={colors[status] || "#a0aec0"} />;
}

// ── Shared styles ──
const inputStyle: React.CSSProperties = {
  padding: "0.5rem", borderRadius: 8, border: "1px solid #2a3765",
  background: "#0d1425", color: "#f2f5ff", fontSize: "0.85rem", minWidth: 200,
};
const selectStyle: React.CSSProperties = {
  padding: "0.5rem", borderRadius: 8, border: "1px solid #2a3765",
  background: "#0d1425", color: "#f2f5ff", fontSize: "0.85rem",
};
const tableStyle: React.CSSProperties = {
  width: "100%", borderCollapse: "collapse", fontSize: "0.85rem",
};
const thStyle: React.CSSProperties = {
  textAlign: "left", padding: "0.6rem 0.5rem", borderBottom: "2px solid #2a3765",
  color: "#a0aec0", fontWeight: 600,
};
const tdStyle: React.CSSProperties = {
  padding: "0.55rem 0.5rem", borderBottom: "1px solid #1a2340",
};
const actionBtnStyle = (color: string): React.CSSProperties => ({
  padding: "0.25rem 0.6rem", borderRadius: 6, border: "none",
  background: color, color: "white", cursor: "pointer", fontSize: "0.75rem",
  fontWeight: 500,
});
const refreshBtnStyle: React.CSSProperties = {
  marginTop: "1rem", padding: "0.5rem 1rem", borderRadius: 8, border: "none",
  background: "#5468ff", color: "white", cursor: "pointer", fontSize: "0.85rem",
};
