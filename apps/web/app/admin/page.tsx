"use client";

import { useState, useEffect, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// --- Types ---

interface Metrics {
  totalUsers: number;
  activeJobs: number;
  openDisputes: number;
  flaggedListings: number;
  revenue: number;
  trustScoreDistribution: Record<string, number>;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  joinedAt: string;
  trustScore: number;
  activeJobs: number;
  disputes: number;
}

interface FlaggedJob {
  id: string;
  title: string;
  postedBy: string;
  flaggedAt: string;
  reason: string;
  status: string;
}

interface Dispute {
  id: string;
  freelancerId: string;
  clientId: string;
  jobId: string;
  status: string;
  openedAt: string;
  description: string;
  evidence: string[];
  transactionAmount: number;
}

interface AuditEntry {
  id: string;
  adminId: string;
  action: string;
  targetId: string;
  timestamp: string;
  details: string;
}

interface PlatformControls {
  registrationsEnabled: boolean;
  jobPostingsEnabled: boolean;
}

type Tab = "metrics" | "users" | "moderation" | "disputes" | "controls" | "audit";

// --- API helpers ---

async function apiGet(path: string, token: string) {
  const res = await fetch(`${API_BASE}/api/admin${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 403) throw new Error("403: Admin access required");
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  return json.data;
}

async function apiPost(path: string, token: string, body?: unknown) {
  const res = await fetch(`${API_BASE}/api/admin${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 403) throw new Error("403: Admin access required");
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  return json.data;
}

// --- Components ---

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "#22c55e",
    suspended: "#eab308",
    banned: "#ef4444",
    pending: "#eab308",
    approved: "#22c55e",
    rejected: "#ef4444",
    escalated: "#f97316",
    open: "#ef4444",
    under_review: "#eab308",
    resolved: "#22c55e",
  };
  const color = colors[status] || "#6b7280";
  return (
    <span
      style={{
        background: `${color}22`,
        color,
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "0.75rem",
        fontWeight: 600,
      }}
    >
      {status}
    </span>
  );
}

function LoadingState() {
  return <p style={{ color: "#6b7280", padding: "1rem" }}>Loading...</p>;
}

function ErrorState({ message }: { message: string }) {
  return (
    <div style={{ background: "#ef444422", border: "1px solid #ef4444", borderRadius: "8px", padding: "1rem", margin: "1rem 0" }}>
      <p style={{ color: "#ef4444", margin: 0 }} role="alert">{message}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p style={{ color: "#6b7280", padding: "1rem" }}>{message}</p>;
}

// --- Tab Sections ---

function MetricsTab({ token }: { token: string }) {
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const m = await apiGet("/metrics", token);
      setData(m);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { refresh(); }, [refresh]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <EmptyState message="No metrics available" />;

  const cards = [
    { label: "Total Users", value: data.totalUsers },
    { label: "Active Jobs", value: data.activeJobs },
    { label: "Open Disputes", value: data.openDisputes },
    { label: "Flagged Listings", value: data.flaggedListings },
    { label: "Revenue (Current Period)", value: `$${data.revenue.toLocaleString()}` },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button onClick={refresh} aria-label="Refresh metrics" style={btnStyle}>Refresh</button>
      </div>
      <div className="grid">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <p style={{ color: "#6b7280", fontSize: "0.8rem", margin: 0 }}>{c.label}</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.25rem 0 0" }}>{c.value}</p>
          </div>
        ))}
      </div>
      <div className="card" style={{ marginTop: "1rem" }}>
        <h3 style={{ marginTop: 0 }}>Trust Score Distribution</h3>
        {Object.entries(data.trustScoreDistribution).map(([range, count]) => (
          <div key={range} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span style={{ width: "80px", fontSize: "0.85rem" }}>{range}</span>
            <div style={{ flex: 1, background: "#1e2940", borderRadius: "4px", height: "20px" }}>
              <div style={{ width: `${(count / data.totalUsers) * 100}%`, background: "#3b82f6", height: "100%", borderRadius: "4px" }} />
            </div>
            <span style={{ fontSize: "0.85rem", width: "30px" }}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UsersTab({ token }: { token: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (filterRole) params.set("role", filterRole);
      if (filterStatus) params.set("status", filterStatus);
      const result = await apiGet(`/users?${params}`, token);
      setUsers(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [token, page, filterRole, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const action = async (userId: string, type: "suspend" | "reinstate" | "ban") => {
    const reason = type === "reinstate" ? undefined : prompt(`Reason for ${type}?`) || "";
    if (type !== "reinstate" && !reason) return;
    try {
      await apiPost(`/users/${userId}/${type}`, token, reason ? { reason } : undefined);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${type} user`);
    }
  };

  if (loading) return <LoadingState />;
  return (
    <div>
      {error && <ErrorState message={error} />}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <select value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setPage(1); }} aria-label="Filter by role" style={selectStyle}>
          <option value="">All Roles</option>
          <option value="freelancer">Freelancers</option>
          <option value="client">Clients</option>
        </select>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} aria-label="Filter by status" style={selectStyle}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
        <button onClick={load} aria-label="Refresh users" style={btnStyle}>Refresh</button>
      </div>
      {users.length === 0 ? (
        <EmptyState message="No users found" />
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Trust</th>
              <th style={thStyle}>Joined</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={tdStyle}>{u.name}</td>
                <td style={tdStyle}>{u.email}</td>
                <td style={tdStyle}>{u.role}</td>
                <td style={tdStyle}><StatusBadge status={u.status} /></td>
                <td style={tdStyle}>{u.trustScore}</td>
                <td style={tdStyle}>{u.joinedAt}</td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    {u.status === "active" && (
                      <button onClick={() => action(u.id, "suspend")} style={smallBtnStyle} aria-label={`Suspend ${u.name}`}>Suspend</button>
                    )}
                    {u.status === "suspended" && (
                      <>
                        <button onClick={() => action(u.id, "reinstate")} style={smallBtnStyle} aria-label={`Reinstate ${u.name}`}>Reinstate</button>
                        <button onClick={() => action(u.id, "ban")} style={smallBtnStyle} aria-label={`Ban ${u.name}`}>Ban</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Pagination page={page} total={total} limit={20} onPage={setPage} />
    </div>
  );
}

function ModerationTab({ token }: { token: string }) {
  const [jobs, setJobs] = useState<FlaggedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await apiGet("/jobs/flagged", token);
      setJobs(result.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load flagged jobs");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const act = async (jobId: string, type: "approve" | "reject" | "escalate") => {
    const reason = type === "reject" ? prompt("Rejection reason?") || "" : undefined;
    if (type === "reject" && !reason) return;
    try {
      await apiPost(`/jobs/${jobId}/${type}`, token, reason ? { reason } : undefined);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${type} job`);
    }
  };

  if (loading) return <LoadingState />;
  return (
    <div>
      {error && <ErrorState message={error} />}
      <button onClick={load} aria-label="Refresh moderation queue" style={btnStyle}>Refresh</button>
      {jobs.length === 0 ? (
        <EmptyState message="No flagged listings" />
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Title</th>
              <th style={thStyle}>Reason</th>
              <th style={thStyle}>Flagged</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id}>
                <td style={tdStyle}>{j.title}</td>
                <td style={tdStyle}>{j.reason}</td>
                <td style={tdStyle}>{j.flaggedAt}</td>
                <td style={tdStyle}><StatusBadge status={j.status} /></td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    <button onClick={() => act(j.id, "approve")} style={smallBtnStyle} aria-label={`Approve ${j.title}`}>Approve</button>
                    <button onClick={() => act(j.id, "reject")} style={smallBtnStyle} aria-label={`Reject ${j.title}`}>Reject</button>
                    <button onClick={() => act(j.id, "escalate")} style={smallBtnStyle} aria-label={`Escalate ${j.title}`}>Escalate</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function DisputesTab({ token }: { token: string }) {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      const result = await apiGet(`/disputes?${params}`, token);
      setDisputes(result.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load disputes");
    } finally {
      setLoading(false);
    }
  }, [token, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const resolve = async (disputeId: string) => {
    const ruling = confirm("Rule in favor of freelancer? OK=freelancer, Cancel=client") ? "freelancer" : "client";
    const refund = confirm("Trigger refund?");
    try {
      await apiPost(`/disputes/${disputeId}/resolve`, token, { ruling, triggerRefund: refund });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve dispute");
    }
  };

  const escalate = async (disputeId: string) => {
    try {
      await apiPost(`/disputes/${disputeId}/escalate`, token);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to escalate dispute");
    }
  };

  if (loading) return <LoadingState />;
  return (
    <div>
      {error && <ErrorState message={error} />}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} aria-label="Filter disputes by status" style={selectStyle}>
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="under_review">Under Review</option>
          <option value="resolved">Resolved</option>
        </select>
        <button onClick={load} aria-label="Refresh disputes" style={btnStyle}>Refresh</button>
      </div>
      {disputes.length === 0 ? (
        <EmptyState message="No disputes found" />
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Description</th>
              <th style={thStyle}>Amount</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Opened</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {disputes.map((d) => (
              <tr key={d.id}>
                <td style={tdStyle}>{d.id}</td>
                <td style={tdStyle}>{d.description.slice(0, 50)}...</td>
                <td style={tdStyle}>${d.transactionAmount}</td>
                <td style={tdStyle}><StatusBadge status={d.status} /></td>
                <td style={tdStyle}>{d.openedAt}</td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    {d.status !== "resolved" && (
                      <>
                        <button onClick={() => resolve(d.id)} style={smallBtnStyle} aria-label={`Resolve ${d.id}`}>Resolve</button>
                        <button onClick={() => escalate(d.id)} style={smallBtnStyle} aria-label={`Escalate ${d.id}`}>Escalate</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ControlsTab({ token }: { token: string }) {
  const [controls, setControls] = useState<PlatformControls | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const c = await apiGet("/controls", token);
      setControls(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load controls");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (key: string, value: boolean) => {
    setConfirming(null);
    try {
      const c = await apiPost("/controls/toggle", token, { key, value });
      setControls(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle control");
    }
  };

  if (loading) return <LoadingState />;
  if (!controls) return <EmptyState message="No controls available" />;

  const controlItems = [
    { key: "registrationsEnabled" as const, label: "New User Registrations", value: controls.registrationsEnabled },
    { key: "jobPostingsEnabled" as const, label: "New Job Postings", value: controls.jobPostingsEnabled },
  ];

  return (
    <div>
      {error && <ErrorState message={error} />}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Platform Controls</h3>
        {controlItems.map((c) => (
          <div key={c.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid #2a3765" }}>
            <div>
              <span style={{ fontWeight: 600 }}>{c.label}</span>
              <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: 0 }}>Currently: {c.value ? "Enabled" : "Disabled"}</p>
            </div>
            {confirming === c.key ? (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => toggle(c.key, !c.value)} style={smallBtnStyle} aria-label={`Confirm toggle ${c.label}`}>Confirm</button>
                <button onClick={() => setConfirming(null)} style={smallBtnStyle} aria-label={`Cancel toggle ${c.label}`}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => setConfirming(c.key)} style={smallBtnStyle} aria-label={`Toggle ${c.label}`}>
                {c.value ? "Disable" : "Enable"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditTab({ token }: { token: string }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterAction, setFilterAction] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filterAction) params.set("action", filterAction);
      const result = await apiGet(`/audit-log?${params}`, token);
      setEntries(result.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }, [token, filterAction]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState />;
  return (
    <div>
      {error && <ErrorState message={error} />}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} aria-label="Filter audit log by action" style={selectStyle}>
          <option value="">All Actions</option>
          <option value="suspend_user">Suspend User</option>
          <option value="ban_user">Ban User</option>
          <option value="reinstate_user">Reinstate User</option>
          <option value="approve_listing">Approve Listing</option>
          <option value="reject_listing">Reject Listing</option>
          <option value="escalate_listing">Escalate Listing</option>
          <option value="dispute_ruling">Dispute Ruling</option>
          <option value="toggle_control">Toggle Control</option>
        </select>
        <button onClick={load} aria-label="Refresh audit log" style={btnStyle}>Refresh</button>
      </div>
      {entries.length === 0 ? (
        <EmptyState message="No audit log entries" />
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Admin</th>
              <th style={thStyle}>Action</th>
              <th style={thStyle}>Target</th>
              <th style={thStyle}>Details</th>
              <th style={thStyle}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((a) => (
              <tr key={a.id}>
                <td style={tdStyle}>{a.adminId}</td>
                <td style={tdStyle}>{a.action}</td>
                <td style={tdStyle}>{a.targetId}</td>
                <td style={tdStyle}>{a.details}</td>
                <td style={tdStyle}>{a.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Pagination({ page, total, limit, onPage }: { page: number; total: number; limit: number; onPage: (p: number) => void }) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  return (
    <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", alignItems: "center" }}>
      <button onClick={() => onPage(page - 1)} disabled={page <= 1} style={btnStyle} aria-label="Previous page">Prev</button>
      <span>Page {page} of {pages} ({total} items)</span>
      <button onClick={() => onPage(page + 1)} disabled={page >= pages} style={btnStyle} aria-label="Next page">Next</button>
    </div>
  );
}

// --- Styles ---

const btnStyle: React.CSSProperties = {
  background: "#2a3765",
  border: "1px solid #3b4d80",
  borderRadius: "6px",
  color: "#f2f5ff",
  padding: "0.4rem 0.8rem",
  cursor: "pointer",
  fontSize: "0.85rem",
};

const smallBtnStyle: React.CSSProperties = {
  background: "#1e2940",
  border: "1px solid #2a3765",
  borderRadius: "4px",
  color: "#f2f5ff",
  padding: "0.2rem 0.5rem",
  cursor: "pointer",
  fontSize: "0.75rem",
};

const selectStyle: React.CSSProperties = {
  background: "#151c35",
  border: "1px solid #2a3765",
  borderRadius: "6px",
  color: "#f2f5ff",
  padding: "0.4rem 0.6rem",
  fontSize: "0.85rem",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "0.85rem",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "0.5rem",
  borderBottom: "1px solid #2a3765",
  color: "#6b7280",
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: "0.5rem",
  borderBottom: "1px solid #1e2940",
};

// --- Main Page ---

export default function AdminPanelPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [tab, setTab] = useState<Tab>("metrics");

  const tabs: { id: Tab; label: string }[] = [
    { id: "metrics", label: "Metrics" },
    { id: "users", label: "Users" },
    { id: "moderation", label: "Moderation" },
    { id: "disputes", label: "Disputes" },
    { id: "controls", label: "Controls" },
    { id: "audit", label: "Audit Log" },
  ];

  if (!authed) {
    return (
      <section className="card">
        <h2>Admin Panel — Login</h2>
        <p style={{ color: "#6b7280" }}>Enter your admin JWT token to access the panel.</p>
        {authError && <ErrorState message={authError} />}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setAuthError("");
            try {
              await apiGet("/metrics", token);
              setAuthed(true);
            } catch (err) {
              setAuthError(err instanceof Error ? err.message : "Authentication failed");
            }
          }}
        >
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="JWT token"
            aria-label="Admin JWT token"
            style={{ ...selectStyle, width: "100%", marginBottom: "0.5rem", padding: "0.6rem" }}
          />
          <button type="submit" style={btnStyle} aria-label="Login to admin panel">Login</button>
        </form>
      </section>
    );
  }

  return (
    <section>
      <h2>Admin Panel</h2>
      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              ...btnStyle,
              background: tab === t.id ? "#3b4d80" : "#1e2940",
              fontWeight: tab === t.id ? 700 : 400,
            }}
            aria-label={`${t.label} tab`}
            aria-selected={tab === t.id}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="card">
        {tab === "metrics" && <MetricsTab token={token} />}
        {tab === "users" && <UsersTab token={token} />}
        {tab === "moderation" && <ModerationTab token={token} />}
        {tab === "disputes" && <DisputesTab token={token} />}
        {tab === "controls" && <ControlsTab token={token} />}
        {tab === "audit" && <AuditTab token={token} />}
      </div>
    </section>
  );
}
