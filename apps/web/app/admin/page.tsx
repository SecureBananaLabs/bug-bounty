"use client";

import { useEffect, useState, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────

interface Metrics {
  totalUsers: number;
  activeUsers: number;
  activeJobs: number;
  openDisputes: number;
  flaggedListings: number;
  revenue: number;
  trustDistribution: { high: number; medium: number; low: number };
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
  jobs?: any[];
  disputes?: any[];
}

interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FlaggedJob {
  id: number;
  title: string;
  status: string;
  flaggedReason: string;
  createdAt: string;
}

interface Dispute {
  id: number;
  jobId: number;
  freelancerId: number;
  clientId: number;
  status: string;
  reason: string;
  createdAt: string;
  thread: { from: number; message: string; at: string }[];
  ruling?: string;
  job?: any;
}

interface AuditEntry {
  id: number;
  adminId: number;
  action: string;
  detail: any;
  timestamp: string;
}

// ── Fetch helper ──────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.data ?? data;
}

// ── Main Component ────────────────────────────────────────────────────

export default function AdminPanelPage() {
  const [tab, setTab] = useState<"dashboard" | "users" | "jobs" | "disputes" | "settings" | "audit">("dashboard");
  const [error, setError] = useState<string | null>(null);

  return (
    <section style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      <h1 style={{ marginBottom: 24 }}>Admin Panel</h1>

      {/* Tab navigation — keyboard navigable */}
      <nav role="tablist" aria-label="Admin sections" style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {(["dashboard", "users", "jobs", "disputes", "settings", "audit"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            aria-controls={`panel-${t}`}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: tab === t ? 700 : 400,
              background: tab === t ? "#2563eb" : "#e5e7eb",
              color: tab === t ? "#fff" : "#111",
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>

      {error && (
        <div role="alert" style={{ background: "#fee2e2", color: "#991b1b", padding: 12, borderRadius: 6, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div id={`panel-${tab}`} role="tabpanel">
        {tab === "dashboard" && <DashboardSection />}
        {tab === "users" && <UsersSection />}
        {tab === "jobs" && <JobsSection />}
        {tab === "disputes" && <DisputesSection />}
        {tab === "settings" && <SettingsSection />}
        {tab === "audit" && <AuditSection />}
      </div>
    </section>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────

function DashboardSection() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Metrics>("/api/admin/metrics");
      setMetrics(data);
    } catch (err: any) {
      // silently handle — will show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  if (loading) return <p aria-busy="true">Loading metrics…</p>;
  if (!metrics) return <p>No metrics available.</p>;

  const cards = [
    { label: "Total Users", value: metrics.totalUsers },
    { label: "Active Users", value: metrics.activeUsers },
    { label: "Active Jobs", value: metrics.activeJobs },
    { label: "Open Disputes", value: metrics.openDisputes },
    { label: "Flagged Listings", value: metrics.flaggedListings },
    { label: "Revenue", value: `$${metrics.revenue.toLocaleString()}` },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
        {cards.map((c) => (
          <div key={c.label} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 14, color: "#6b7280" }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{c.value}</div>
          </div>
        ))}
      </div>

      <h3>Trust Score Distribution</h3>
      <div style={{ display: "flex", gap: 16 }}>
        <span>High: {metrics.trustDistribution.high}</span>
        <span>Medium: {metrics.trustDistribution.medium}</span>
        <span>Low: {metrics.trustDistribution.low}</span>
      </div>

      <button onClick={fetchMetrics} style={{ marginTop: 16, padding: "6px 12px", cursor: "pointer" }} aria-label="Refresh metrics">
        ↻ Refresh
      </button>
    </div>
  );
}

// ── Users ─────────────────────────────────────────────────────────────

function UsersSection() {
  const [data, setData] = useState<Paginated<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (search) params.set("search", search);
      if (role) params.set("role", role);
      if (status) params.set("status", status);
      const result = await apiFetch<Paginated<User>>(`/api/admin/users?${params}`);
      setData(result);
    } catch (err: any) {
      // handle silently
    } finally {
      setLoading(false);
    }
  }, [page, search, role, status]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAction = async (userId: number, action: "suspend" | "reinstate" | "ban") => {
    try {
      await apiFetch(`/api/admin/users/${userId}/${action}`, { method: "POST" });
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const viewUser = async (userId: number) => {
    try {
      const user = await apiFetch<User>(`/api/admin/users/${userId}`);
      setSelectedUser(user);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          aria-label="Search users"
          style={{ padding: 8, border: "1px solid #d1d5db", borderRadius: 6 }}
        />
        <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} aria-label="Filter by role">
          <option value="">All roles</option>
          <option value="freelancer">Freelancer</option>
          <option value="client">Client</option>
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {loading ? (
        <p aria-busy="true">Loading users…</p>
      ) : !data || data.items.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse" }} role="table" aria-label="Users table">
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                <th style={{ textAlign: "left", padding: 8 }}>Name</th>
                <th style={{ textAlign: "left", padding: 8 }}>Email</th>
                <th style={{ textAlign: "left", padding: 8 }}>Role</th>
                <th style={{ textAlign: "left", padding: 8 }}>Status</th>
                <th style={{ textAlign: "left", padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: 8 }}>{u.name}</td>
                  <td style={{ padding: 8 }}>{u.email}</td>
                  <td style={{ padding: 8 }}>{u.role}</td>
                  <td style={{ padding: 8 }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: 12, fontSize: 12,
                      background: u.status === "active" ? "#d1fae5" : u.status === "suspended" ? "#fef3c7" : "#fee2e2",
                      color: u.status === "active" ? "#065f46" : u.status === "suspended" ? "#92400e" : "#991b1b",
                    }}>
                      {u.status}
                    </span>
                  </td>
                  <td style={{ padding: 8, display: "flex", gap: 4 }}>
                    <button onClick={() => viewUser(u.id)} aria-label={`View ${u.name}`}>View</button>
                    {u.status === "active" && <button onClick={() => handleAction(u.id, "suspend")} aria-label={`Suspend ${u.name}`}>Suspend</button>}
                    {u.status === "suspended" && <button onClick={() => handleAction(u.id, "reinstate")} aria-label={`Reinstate ${u.name}`}>Reinstate</button>}
                    {u.status !== "banned" && <button onClick={() => handleAction(u.id, "ban")} aria-label={`Ban ${u.name}`} style={{ color: "#dc2626" }}>Ban</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center" }}>
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
            <span>Page {data.page} of {data.totalPages} ({data.total} total)</span>
            <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
          </div>
        </>
      )}

      {/* User detail modal */}
      {selectedUser && (
        <div role="dialog" aria-label="User details" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, maxWidth: 500, width: "90%" }}>
            <h3>{selectedUser.name}</h3>
            <p>Email: {selectedUser.email}</p>
            <p>Role: {selectedUser.role} | Status: {selectedUser.status}</p>
            <p>Joined: {new Date(selectedUser.joinedAt).toLocaleDateString()}</p>
            {selectedUser.jobs && <p>Active Jobs: {selectedUser.jobs.length}</p>}
            {selectedUser.disputes && <p>Disputes: {selectedUser.disputes.length}</p>}
            <button onClick={() => setSelectedUser(null)} style={{ marginTop: 12 }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Jobs Moderation ───────────────────────────────────────────────────

function JobsSection() {
  const [data, setData] = useState<Paginated<FlaggedJob> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchFlagged = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiFetch<Paginated<FlaggedJob>>(`/api/admin/jobs/flagged?page=${page}&limit=10`);
      setData(result);
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchFlagged(); }, [fetchFlagged]);

  const handleModerate = async (jobId: number, action: "approved" | "rejected" | "escalated") => {
    const reason = prompt(`Reason for ${action}:`);
    if (reason === null) return;
    try {
      await apiFetch(`/api/admin/jobs/${jobId}/moderate`, {
        method: "POST",
        body: JSON.stringify({ action, reason }),
      });
      fetchFlagged();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <p aria-busy="true">Loading flagged jobs…</p>;
  if (!data || data.items.length === 0) return <p>No flagged jobs. 🎉</p>;

  return (
    <div>
      <table style={{ width: "100%", borderCollapse: "collapse" }} role="table" aria-label="Flagged jobs">
        <thead>
          <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
            <th style={{ textAlign: "left", padding: 8 }}>Title</th>
            <th style={{ textAlign: "left", padding: 8 }}>Reason</th>
            <th style={{ textAlign: "left", padding: 8 }}>Created</th>
            <th style={{ textAlign: "left", padding: 8 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((j) => (
            <tr key={j.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td style={{ padding: 8 }}>{j.title}</td>
              <td style={{ padding: 8 }}>{j.flaggedReason}</td>
              <td style={{ padding: 8 }}>{new Date(j.createdAt).toLocaleDateString()}</td>
              <td style={{ padding: 8, display: "flex", gap: 4 }}>
                <button onClick={() => handleModerate(j.id, "approved")} style={{ color: "#059669" }}>Approve</button>
                <button onClick={() => handleModerate(j.id, "rejected")} style={{ color: "#dc2626" }}>Reject</button>
                <button onClick={() => handleModerate(j.id, "escalated")}>Escalate</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center" }}>
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
        <span>Page {data.page} of {data.totalPages}</span>
        <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
      </div>
    </div>
  );
}

// ── Disputes ──────────────────────────────────────────────────────────

function DisputesSection() {
  const [data, setData] = useState<Paginated<Dispute> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (statusFilter) params.set("status", statusFilter);
      const result = await apiFetch<Paginated<Dispute>>(`/api/admin/disputes?${params}`);
      setData(result);
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchDisputes(); }, [fetchDisputes]);

  const viewDispute = async (id: number) => {
    try {
      const dispute = await apiFetch<Dispute>(`/api/admin/disputes/${id}`);
      setSelectedDispute(dispute);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResolve = async (id: number) => {
    const ruling = prompt("Enter ruling:");
    if (!ruling) return;
    try {
      await apiFetch(`/api/admin/disputes/${id}/resolve`, {
        method: "POST",
        body: JSON.stringify({ ruling }),
      });
      setSelectedDispute(null);
      fetchDisputes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} aria-label="Filter disputes by status">
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="under_review">Under Review</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {loading ? (
        <p aria-busy="true">Loading disputes…</p>
      ) : !data || data.items.length === 0 ? (
        <p>No disputes found.</p>
      ) : (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse" }} role="table" aria-label="Disputes">
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                <th style={{ textAlign: "left", padding: 8 }}>ID</th>
                <th style={{ textAlign: "left", padding: 8 }}>Reason</th>
                <th style={{ textAlign: "left", padding: 8 }}>Status</th>
                <th style={{ textAlign: "left", padding: 8 }}>Created</th>
                <th style={{ textAlign: "left", padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((d) => (
                <tr key={d.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: 8 }}>#{d.id}</td>
                  <td style={{ padding: 8 }}>{d.reason}</td>
                  <td style={{ padding: 8 }}>{d.status}</td>
                  <td style={{ padding: 8 }}>{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: 8, display: "flex", gap: 4 }}>
                    <button onClick={() => viewDispute(d.id)}>View</button>
                    {d.status !== "resolved" && <button onClick={() => handleResolve(d.id)}>Resolve</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center" }}>
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
            <span>Page {data.page} of {data.totalPages}</span>
            <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
          </div>
        </>
      )}

      {/* Dispute detail modal */}
      {selectedDispute && (
        <div role="dialog" aria-label="Dispute details" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, maxWidth: 600, width: "90%", maxHeight: "80vh", overflow: "auto" }}>
            <h3>Dispute #{selectedDispute.id}</h3>
            <p><strong>Reason:</strong> {selectedDispute.reason}</p>
            <p><strong>Status:</strong> {selectedDispute.status}</p>
            {selectedDispute.ruling && <p><strong>Ruling:</strong> {selectedDispute.ruling}</p>}

            <h4>Thread</h4>
            {selectedDispute.thread?.map((msg, i) => (
              <div key={i} style={{ borderLeft: "3px solid #e5e7eb", paddingLeft: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: "#6b7280" }}>User #{msg.from} · {new Date(msg.at).toLocaleString()}</div>
                <div>{msg.message}</div>
              </div>
            ))}

            {selectedDispute.status !== "resolved" && (
              <button onClick={() => handleResolve(selectedDispute.id)} style={{ marginTop: 12 }}>Resolve Dispute</button>
            )}
            <button onClick={() => setSelectedDispute(null)} style={{ marginTop: 12, marginLeft: 8 }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────

function SettingsSection() {
  const [settings, setSettings] = useState<{ registrationsEnabled: boolean; jobPostingsEnabled: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ registrationsEnabled: boolean; jobPostingsEnabled: boolean }>("/api/admin/settings");
      setSettings(data);
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const toggle = async (key: string, value: boolean) => {
    if (!confirm(`Are you sure you want to ${value ? "enable" : "disable"} ${key}?`)) return;
    try {
      const updated = await apiFetch<typeof settings>("/api/admin/settings", {
        method: "POST",
        body: JSON.stringify({ key, value }),
      });
      setSettings(updated);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <p aria-busy="true">Loading settings…</p>;
  if (!settings) return <p>Unable to load settings.</p>;

  return (
    <div>
      <h3>Platform Controls</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 400 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={settings.registrationsEnabled}
            onChange={(e) => toggle("registrationsEnabled", e.target.checked)}
            aria-label="Toggle new user registrations"
          />
          <span>New User Registrations</span>
          <span style={{ fontSize: 12, color: settings.registrationsEnabled ? "#059669" : "#dc2626" }}>
            {settings.registrationsEnabled ? "Enabled" : "Disabled"}
          </span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={settings.jobPostingsEnabled}
            onChange={(e) => toggle("jobPostingsEnabled", e.target.checked)}
            aria-label="Toggle new job postings"
          />
          <span>New Job Postings</span>
          <span style={{ fontSize: 12, color: settings.jobPostingsEnabled ? "#059669" : "#dc2626" }}>
            {settings.jobPostingsEnabled ? "Enabled" : "Disabled"}
          </span>
        </label>
      </div>
    </div>
  );
}

// ── Audit Log ─────────────────────────────────────────────────────────

function AuditSection() {
  const [data, setData] = useState<Paginated<AuditEntry> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (actionFilter) params.set("action", actionFilter);
      const result = await apiFetch<Paginated<AuditEntry>>(`/api/admin/audit-log?${params}`);
      setData(result);
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => { fetchAudit(); }, [fetchAudit]);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} aria-label="Filter by action type">
          <option value="">All actions</option>
          <option value="user_status_change">User Status Change</option>
          <option value="job_moderation">Job Moderation</option>
          <option value="dispute_resolution">Dispute Resolution</option>
          <option value="platform_setting">Platform Setting</option>
        </select>
      </div>

      {loading ? (
        <p aria-busy="true">Loading audit log…</p>
      ) : !data || data.items.length === 0 ? (
        <p>No audit entries yet.</p>
      ) : (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse" }} role="table" aria-label="Audit log">
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                <th style={{ textAlign: "left", padding: 8 }}>Time</th>
                <th style={{ textAlign: "left", padding: 8 }}>Admin</th>
                <th style={{ textAlign: "left", padding: 8 }}>Action</th>
                <th style={{ textAlign: "left", padding: 8 }}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((e) => (
                <tr key={e.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: 8, fontSize: 13 }}>{new Date(e.timestamp).toLocaleString()}</td>
                  <td style={{ padding: 8 }}>#{e.adminId}</td>
                  <td style={{ padding: 8 }}>
                    <code style={{ fontSize: 12, background: "#f3f4f6", padding: "2px 6px", borderRadius: 4 }}>{e.action}</code>
                  </td>
                  <td style={{ padding: 8, fontSize: 13, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {JSON.stringify(e.detail)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center" }}>
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
            <span>Page {data.page} of {data.totalPages}</span>
            <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
          </div>
        </>
      )}
    </div>
  );
}
