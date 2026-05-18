"use client";

import { useEffect, useReducer, useState } from "react";

// ---- Types ----

type UserStatus = "active" | "suspended" | "banned";
type JobDecision = "approved" | "rejected" | "escalated";
type DisputeRuling = "client_favor" | "freelancer_favor" | "escalated";
type DisputeStatus = "open" | "under_review" | "resolved";
type Tab = "overview" | "users" | "jobs" | "disputes" | "audit";

interface Metrics {
  totalUsers: number;
  activeJobs: number;
  openDisputes: number;
  flaggedListings: number;
  revenue: { period: string; amount: number; currency: string };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: UserStatus;
  joinDate: string;
  activeJobs: number;
  disputes: number;
}

interface FlaggedJob {
  id: string;
  title: string;
  postedBy: string;
  flagReason: string;
  status: string;
  flaggedAt: string;
}

interface Dispute {
  id: string;
  title: string;
  freelancer: string;
  client: string;
  amount: number;
  status: DisputeStatus;
  openedAt: string;
  evidence: string;
  ruling?: string;
}

interface AuditEntry {
  action: string;
  target: string;
  by: string;
  at: string;
  detail?: string;
}

// ---- Auth gate ----

const API = "http://localhost:4000";

function useAdminToken() {
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("admin_token") : null
  );
  const [error, setError] = useState("");

  function saveToken(t: string) {
    localStorage.setItem("admin_token", t);
    setToken(t);
    setError("");
  }

  async function verifyToken(t: string): Promise<boolean> {
    try {
      const r = await fetch(`${API}/api/admin/metrics`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      return r.ok;
    } catch {
      return false;
    }
  }

  return { token, saveToken, verifyToken, error, setError };
}

// ---- Fetch helpers ----

async function apiFetch<T>(path: string, token: string, opts?: RequestInit): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(opts?.headers ?? {}),
    },
  });
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP ${r.status}`);
  }
  const { data } = await r.json();
  return data as T;
}

// ---- Sub-components ----

function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card" style={{ minWidth: 140, textAlign: "center" }}>
      <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>{value}</div>
      <div style={{ fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "#2a9d8f", suspended: "#e9c46a", banned: "#e76f51",
    open: "#457b9d", under_review: "#e9c46a", resolved: "#2a9d8f",
    pending: "#e9c46a", approved: "#2a9d8f", rejected: "#e76f51", escalated: "#6a4c93",
  };
  return (
    <span style={{
      background: colors[status] ?? "#888",
      color: "#fff",
      borderRadius: 4,
      padding: "2px 8px",
      fontSize: "0.8rem",
      fontWeight: 600,
    }}>
      {status}
    </span>
  );
}

// ---- Tab: Overview ----

function OverviewTab({ token }: { token: string }) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    apiFetch<Metrics>("/api/admin/metrics", token)
      .then(setMetrics)
      .catch(e => setErr(e.message));
  }, [token]);

  if (err) return <p style={{ color: "#e76f51" }}>Error: {err}</p>;
  if (!metrics) return <p>Loading metrics…</p>;

  return (
    <div>
      <h3>Platform Overview</h3>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <MetricCard label="Total Users" value={metrics.totalUsers} />
        <MetricCard label="Active Jobs" value={metrics.activeJobs} />
        <MetricCard label="Open Disputes" value={metrics.openDisputes} />
        <MetricCard label="Flagged Listings" value={metrics.flaggedListings} />
        <MetricCard
          label="Revenue"
          value={`$${metrics.revenue.amount.toLocaleString()}`}
          sub={metrics.revenue.period}
        />
      </div>
    </div>
  );
}

// ---- Tab: Users ----

function UsersTab({ token }: { token: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState({ role: "", status: "", search: "" });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  function fetchUsers() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.role) params.set("role", filter.role);
    if (filter.status) params.set("status", filter.status);
    if (filter.search) params.set("search", filter.search);
    apiFetch<User[]>(`/api/admin/users?${params}`, token)
      .then(data => { setUsers(data); setErr(""); })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchUsers(); }, [filter, token]);

  async function setStatus(userId: string, status: UserStatus) {
    setActing(userId);
    try {
      await apiFetch(`/api/admin/users/${userId}/status`, token, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      fetchUsers();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActing(null);
    }
  }

  return (
    <div>
      <h3>User Management</h3>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          placeholder="Search name or email"
          value={filter.search}
          onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
          aria-label="Search users"
          style={{ padding: "6px 10px", borderRadius: 4, border: "1px solid #ccc" }}
        />
        <select
          value={filter.role}
          onChange={e => setFilter(f => ({ ...f, role: e.target.value }))}
          aria-label="Filter by role"
          style={{ padding: "6px 10px", borderRadius: 4, border: "1px solid #ccc" }}
        >
          <option value="">All roles</option>
          <option value="freelancer">Freelancer</option>
          <option value="client">Client</option>
        </select>
        <select
          value={filter.status}
          onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          aria-label="Filter by status"
          style={{ padding: "6px 10px", borderRadius: 4, border: "1px solid #ccc" }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {err && <p style={{ color: "#e76f51" }}>Error: {err}</p>}
      {loading ? <p>Loading users…</p> : users.length === 0 ? <p>No users match the filter.</p> : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
              <th style={{ padding: "8px 12px" }}>Name</th>
              <th style={{ padding: "8px 12px" }}>Email</th>
              <th style={{ padding: "8px 12px" }}>Role</th>
              <th style={{ padding: "8px 12px" }}>Status</th>
              <th style={{ padding: "8px 12px" }}>Joined</th>
              <th style={{ padding: "8px 12px" }}>Jobs</th>
              <th style={{ padding: "8px 12px" }}>Disputes</th>
              <th style={{ padding: "8px 12px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "8px 12px" }}>{u.name}</td>
                <td style={{ padding: "8px 12px" }}>{u.email}</td>
                <td style={{ padding: "8px 12px" }}>{u.role}</td>
                <td style={{ padding: "8px 12px" }}><StatusBadge status={u.status} /></td>
                <td style={{ padding: "8px 12px" }}>{u.joinDate}</td>
                <td style={{ padding: "8px 12px" }}>{u.activeJobs}</td>
                <td style={{ padding: "8px 12px" }}>{u.disputes}</td>
                <td style={{ padding: "8px 12px" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {u.status !== "active" && (
                      <button
                        onClick={() => setStatus(u.id, "active")}
                        disabled={acting === u.id}
                        aria-label={`Reinstate ${u.name}`}
                        style={{ fontSize: "0.75rem", padding: "3px 8px", cursor: "pointer" }}
                      >
                        Reinstate
                      </button>
                    )}
                    {u.status !== "suspended" && (
                      <button
                        onClick={() => setStatus(u.id, "suspended")}
                        disabled={acting === u.id}
                        aria-label={`Suspend ${u.name}`}
                        style={{ fontSize: "0.75rem", padding: "3px 8px", cursor: "pointer", background: "#e9c46a" }}
                      >
                        Suspend
                      </button>
                    )}
                    {u.status !== "banned" && (
                      <button
                        onClick={() => setStatus(u.id, "banned")}
                        disabled={acting === u.id}
                        aria-label={`Ban ${u.name}`}
                        style={{ fontSize: "0.75rem", padding: "3px 8px", cursor: "pointer", background: "#e76f51", color: "#fff" }}
                      >
                        Ban
                      </button>
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

// ---- Tab: Jobs ----

function JobsTab({ token }: { token: string }) {
  const [jobs, setJobs] = useState<FlaggedJob[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  function fetchJobs() {
    setLoading(true);
    const params = statusFilter ? `?status=${statusFilter}` : "";
    apiFetch<FlaggedJob[]>(`/api/admin/jobs/flagged${params}`, token)
      .then(data => { setJobs(data); setErr(""); })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchJobs(); }, [statusFilter, token]);

  async function decide(jobId: string, decision: JobDecision) {
    setActing(jobId);
    try {
      await apiFetch(`/api/admin/jobs/${jobId}/decision`, token, {
        method: "PATCH",
        body: JSON.stringify({ decision }),
      });
      fetchJobs();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActing(null);
    }
  }

  return (
    <div>
      <h3>Job Moderation Queue</h3>
      <div style={{ marginBottom: 16 }}>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          style={{ padding: "6px 10px", borderRadius: 4, border: "1px solid #ccc" }}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {err && <p style={{ color: "#e76f51" }}>Error: {err}</p>}
      {loading ? <p>Loading moderation queue…</p> : jobs.length === 0 ? <p>Queue is empty.</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {jobs.map(j => (
            <div key={j.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <strong>{j.title}</strong>
                  <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>Posted by {j.postedBy}</div>
                  <div style={{ fontSize: "0.85rem", color: "#e76f51", marginTop: 4 }}>{j.flagReason}</div>
                  <div style={{ fontSize: "0.75rem", opacity: 0.6, marginTop: 4 }}>
                    Flagged {new Date(j.flaggedAt).toLocaleDateString()}
                  </div>
                </div>
                <StatusBadge status={j.status} />
              </div>
              {(j.status === "pending" || j.status === "under_review") && (
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button
                    onClick={() => decide(j.id, "approved")}
                    disabled={acting === j.id}
                    aria-label={`Approve ${j.title}`}
                    style={{ padding: "4px 12px", cursor: "pointer", background: "#2a9d8f", color: "#fff", border: "none", borderRadius: 4 }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => decide(j.id, "rejected")}
                    disabled={acting === j.id}
                    aria-label={`Reject ${j.title}`}
                    style={{ padding: "4px 12px", cursor: "pointer", background: "#e76f51", color: "#fff", border: "none", borderRadius: 4 }}
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => decide(j.id, "escalated")}
                    disabled={acting === j.id}
                    aria-label={`Escalate ${j.title}`}
                    style={{ padding: "4px 12px", cursor: "pointer", background: "#6a4c93", color: "#fff", border: "none", borderRadius: 4 }}
                  >
                    Escalate
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Tab: Disputes ----

function DisputesTab({ token }: { token: string }) {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  function fetchDisputes() {
    setLoading(true);
    const params = statusFilter ? `?status=${statusFilter}` : "";
    apiFetch<Dispute[]>(`/api/admin/disputes${params}`, token)
      .then(data => { setDisputes(data); setErr(""); })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchDisputes(); }, [statusFilter, token]);

  async function rule(disputeId: string, ruling: DisputeRuling) {
    setActing(disputeId);
    try {
      await apiFetch(`/api/admin/disputes/${disputeId}/ruling`, token, {
        method: "PATCH",
        body: JSON.stringify({ ruling }),
      });
      fetchDisputes();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActing(null);
    }
  }

  return (
    <div>
      <h3>Dispute Resolution</h3>
      <div style={{ marginBottom: 16 }}>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          aria-label="Filter disputes by status"
          style={{ padding: "6px 10px", borderRadius: 4, border: "1px solid #ccc" }}
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="under_review">Under review</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {err && <p style={{ color: "#e76f51" }}>Error: {err}</p>}
      {loading ? <p>Loading disputes…</p> : disputes.length === 0 ? <p>No disputes match the filter.</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {disputes.map(d => (
            <div key={d.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <strong>{d.title}</strong>
                  <div style={{ fontSize: "0.85rem", marginTop: 4 }}>
                    Freelancer: {d.freelancer} vs Client: {d.client}
                  </div>
                  <div style={{ fontSize: "0.85rem" }}>Amount in escrow: <strong>${d.amount}</strong></div>
                  <div style={{ fontSize: "0.85rem", marginTop: 6, opacity: 0.85 }}>{d.evidence}</div>
                  {d.ruling && (
                    <div style={{ fontSize: "0.8rem", marginTop: 6, color: "#2a9d8f" }}>
                      Ruling: <strong>{d.ruling}</strong>
                    </div>
                  )}
                  <div style={{ fontSize: "0.75rem", opacity: 0.6, marginTop: 4 }}>
                    Opened {new Date(d.openedAt).toLocaleDateString()}
                  </div>
                </div>
                <StatusBadge status={d.status} />
              </div>
              {(d.status === "open" || d.status === "under_review") && (
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button
                    onClick={() => rule(d.id, "freelancer_favor")}
                    disabled={acting === d.id}
                    aria-label="Rule in favour of freelancer"
                    style={{ padding: "4px 12px", cursor: "pointer", background: "#2a9d8f", color: "#fff", border: "none", borderRadius: 4 }}
                  >
                    Freelancer wins
                  </button>
                  <button
                    onClick={() => rule(d.id, "client_favor")}
                    disabled={acting === d.id}
                    aria-label="Rule in favour of client"
                    style={{ padding: "4px 12px", cursor: "pointer", background: "#457b9d", color: "#fff", border: "none", borderRadius: 4 }}
                  >
                    Client wins
                  </button>
                  <button
                    onClick={() => rule(d.id, "escalated")}
                    disabled={acting === d.id}
                    aria-label="Escalate to senior admin"
                    style={{ padding: "4px 12px", cursor: "pointer", background: "#6a4c93", color: "#fff", border: "none", borderRadius: 4 }}
                  >
                    Escalate
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Tab: Audit ----

function AuditTab({ token }: { token: string }) {
  const [log, setLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    apiFetch<AuditEntry[]>("/api/admin/audit", token)
      .then(data => { setLog(data); setErr(""); })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (err) return <p style={{ color: "#e76f51" }}>Error: {err}</p>;
  if (loading) return <p>Loading audit log…</p>;
  if (log.length === 0) return <p>Audit log is empty.</p>;

  return (
    <div>
      <h3>Audit Log</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
            <th style={{ padding: "8px 12px" }}>When</th>
            <th style={{ padding: "8px 12px" }}>Action</th>
            <th style={{ padding: "8px 12px" }}>Target</th>
            <th style={{ padding: "8px 12px" }}>By</th>
            <th style={{ padding: "8px 12px" }}>Detail</th>
          </tr>
        </thead>
        <tbody>
          {log.map((entry, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "8px 12px", fontSize: "0.85rem" }}>
                {new Date(entry.at).toLocaleString()}
              </td>
              <td style={{ padding: "8px 12px" }}>
                <code style={{ fontSize: "0.8rem" }}>{entry.action}</code>
              </td>
              <td style={{ padding: "8px 12px", fontSize: "0.85rem" }}>{entry.target}</td>
              <td style={{ padding: "8px 12px", fontSize: "0.85rem" }}>{entry.by}</td>
              <td style={{ padding: "8px 12px", fontSize: "0.8rem", opacity: 0.8 }}>{entry.detail ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- Token entry form ----

function TokenForm({ onSubmit, error }: { onSubmit: (t: string) => void; error: string }) {
  const [value, setValue] = useState("");
  return (
    <section className="card">
      <h2>Admin Access</h2>
      <p>Enter a valid admin JWT to continue. This token is verified server-side on every request.</p>
      <form
        onSubmit={e => { e.preventDefault(); if (value.trim()) onSubmit(value.trim()); }}
        style={{ display: "flex", gap: 8, marginTop: 12 }}
      >
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Bearer token (admin role required)"
          aria-label="Admin JWT token"
          style={{ flex: 1, padding: "8px 12px", borderRadius: 4, border: "1px solid #ccc", fontFamily: "monospace" }}
        />
        <button type="submit" style={{ padding: "8px 16px", cursor: "pointer" }}>
          Access Admin Panel
        </button>
      </form>
      {error && <p style={{ color: "#e76f51", marginTop: 8 }}>{error}</p>}
    </section>
  );
}

// ---- Main page ----

export default function AdminPanelPage() {
  const { token, saveToken, verifyToken, error, setError } = useAdminToken();
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(!!token);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (!token) { setChecking(false); return; }
    setChecking(true);
    verifyToken(token).then(ok => {
      setVerified(ok);
      if (!ok) { localStorage.removeItem("admin_token"); setError("Token is invalid or not admin — please re-enter."); }
      setChecking(false);
    });
  }, [token]);

  async function handleTokenSubmit(t: string) {
    const ok = await verifyToken(t);
    if (ok) { saveToken(t); setVerified(true); }
    else setError("Rejected: token is invalid or does not have admin role.");
  }

  if (checking) return <p>Verifying admin credentials…</p>;
  if (!token || !verified) return <TokenForm onSubmit={handleTokenSubmit} error={error} />;

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "users", label: "Users" },
    { id: "jobs", label: "Job Queue" },
    { id: "disputes", label: "Disputes" },
    { id: "audit", label: "Audit Log" },
  ];

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Admin Panel</h2>
        <button
          onClick={() => { localStorage.removeItem("admin_token"); setVerified(false); }}
          style={{ fontSize: "0.8rem", padding: "4px 12px", cursor: "pointer", opacity: 0.7 }}
        >
          Sign out
        </button>
      </div>

      <nav role="tablist" style={{ display: "flex", gap: 4, borderBottom: "2px solid #ddd", marginBottom: 24 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "8px 16px",
              cursor: "pointer",
              border: "none",
              borderBottom: tab === t.id ? "3px solid #1a73e8" : "3px solid transparent",
              background: "transparent",
              fontWeight: tab === t.id ? 700 : 400,
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div role="tabpanel">
        {tab === "overview" && <OverviewTab token={token} />}
        {tab === "users" && <UsersTab token={token} />}
        {tab === "jobs" && <JobsTab token={token} />}
        {tab === "disputes" && <DisputesTab token={token} />}
        {tab === "audit" && <AuditTab token={token} />}
      </div>
    </section>
  );
}
