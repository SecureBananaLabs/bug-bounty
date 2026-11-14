"use client";

import { useState, useEffect, useCallback } from "react";
import "./admin.css";

const API = "http://localhost:4000";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function useAdminData(fetchFn: () => Promise<any>, deps: React.DependencyList) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}

function apiGet(path: string): Promise<any> {
  return fetch(`${API}${path}`, { headers: { ...authHeaders() } }).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json().then((d) => d.data ?? d);
  });
}

function apiPost(path: string, body?: any): Promise<any> {
  return fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  }).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json().then((d) => d.data ?? d);
  });
}

function apiPut(path: string, body?: any): Promise<any> {
  return fetch(`${API}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  }).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json().then((d) => d.data ?? d);
  });
}

function Badge({ variant, children }: { variant: string; children?: React.ReactNode }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function Pagination({ page, total, perPage, onPage }: { page: number; total: number; perPage: number; onPage: (p: number) => void }) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;
  return (
    <div className="pagination">
      <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>← Prev</button>
      <span>Page {page} of {pages} ({total} total)</span>
      <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next →</button>
    </div>
  );
}

function Loading({ children }: { children?: React.ReactNode }) {
  return <div className="loading-state">{children || "Loading..."}</div>;
}

function Empty({ message }: { message?: string }) {
  return <div className="empty-state">{message || "No data"}</div>;
}

function MetricsDashboard() {
  const { data, loading } = useAdminData(() => apiGet("/api/admin/metrics"), []);

  if (loading) return <Loading />;
  if (!data) return <Empty message="Failed to load metrics" />;

  return (
    <div>
      <div className="stats-grid">
        <StatCard value={data.totalUsers} label="Total Users" />
        <StatCard value={data.activeUsers} label="Active Users" />
        <StatCard value={data.openJobs} label="Open Jobs" />
        <StatCard value={data.openDisputes} label="Open Disputes" />
        <StatCard value={data.flaggedJobs} label="Flagged Listings" />
        <StatCard value={`$${data.revenue.toLocaleString()}`} label="Revenue (Period)" />
      </div>

      {data.trustDistribution && (
        <div className="card">
          <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem" }}>Trust Score Distribution</h3>
          <div className="trust-chart">
            {data.trustDistribution.map((bin, i) => (
              <div
                key={i}
                className="trust-bar"
                style={{ height: `${Math.max(4, (bin.count / Math.max(...data.trustDistribution.map((b) => b.count), 1)) * 100)}px` }}
              >
                <span className="bar-label">{bin.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UserManagement() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [actionMsg, setActionMsg] = useState("");

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (role) params.set("role", role);
  if (status) params.set("status", status);
  params.set("page", String(page));
  params.set("perPage", "10");

  const { data, loading, reload } = useAdminData(
    () => apiGet(`/api/admin/users?${params}`),
    [search, role, status, page],
  );

  async function handleAction(userId, action) {
    try {
      await apiPost(`/api/admin/users/${userId}/${action}`);
      setActionMsg(`${action} successful`);
      reload();
      setTimeout(() => setActionMsg(""), 3000);
    } catch (e) {
      setActionMsg(`Error: ${e.message}`);
    }
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <input className="search-input" placeholder="Search users..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <select className="filter-select" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
            <option value="">All roles</option>
            <option value="freelancer">Freelancer</option>
            <option value="client">Client</option>
            <option value="admin">Admin</option>
          </select>
          <select className="filter-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
        </div>
        {actionMsg && <span style={{ color: actionMsg.startsWith("Error") ? "#df4c4c" : "#4cdf8b", fontSize: "0.85rem" }}>{actionMsg}</span>}
      </div>

      {loading ? <Loading /> : !data?.users?.length ? <Empty message="No users found" /> : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Trust</th>
                <th>Jobs</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.name}</td>
                  <td style={{ color: "#8b98c7" }}>{u.email}</td>
                  <td><Badge variant={u.role === "admin" ? "active" : "open"}>{u.role}</Badge></td>
                  <td><Badge variant={u.status === "active" ? "active" : u.status === "suspended" ? "suspended" : "banned"}>{u.status}</Badge></td>
                  <td>{u.trustScore}%</td>
                  <td>{u.jobsActive}</td>
                  <td>
                    {u.status === "active" && u.role !== "admin" && (
                      <>
                        <button className="btn btn-danger btn-sm" onClick={() => handleAction(u.id, "suspend")}>Suspend</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleAction(u.id, "ban")}>Ban</button>
                      </>
                    )}
                    {u.status === "suspended" && (
                      <button className="btn btn-success btn-sm" onClick={() => handleAction(u.id, "reinstate")}>Reinstate</button>
                    )}
                    {u.status === "banned" && (
                      <button className="btn btn-success btn-sm" onClick={() => handleAction(u.id, "reinstate")}>Unban</button>
                    )}
                    {u.role === "admin" && <span style={{ color: "#5a6a9a", fontSize: "0.8rem" }}>Protected</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={data.page} total={data.total} perPage={data.perPage} onPage={setPage} />
        </>
      )}
    </div>
  );
}

function JobModeration() {
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [msg, setMsg] = useState("");

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("perPage", "10");
  if (filterStatus) params.set("status", filterStatus);

  const { data, loading, reload } = useAdminData(
    () => apiGet(`/api/admin/moderation?${params}`),
    [page, filterStatus],
  );

  async function handleApprove(jobId) {
    try {
      await apiPost(`/api/admin/moderation/${jobId}/approve`);
      setMsg("Job approved");
      reload();
      setTimeout(() => setMsg(""), 3000);
    } catch (e) { setMsg(`Error: ${e.message}`); }
  }

  async function handleReject(jobId) {
    try {
      await apiPost(`/api/admin/moderation/${jobId}/reject`, { reason: rejectReason || "Violates platform policies" });
      setMsg("Job rejected");
      setRejectId(null);
      setRejectReason("");
      reload();
      setTimeout(() => setMsg(""), 3000);
    } catch (e) { setMsg(`Error: ${e.message}`); }
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <select className="filter-select" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="pending">Pending</option>
            <option value="">All</option>
          </select>
        </div>
        {msg && <span style={{ color: msg.startsWith("Error") ? "#df4c4c" : "#4cdf8b", fontSize: "0.85rem" }}>{msg}</span>}
      </div>

      {loading ? <Loading /> : !data?.items?.length ? <Empty message="No flagged listings" /> : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Budget</th>
                <th>Flag Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((job) => (
                <tr key={job.id}>
                  <td style={{ fontWeight: 500 }}>{job.title}</td>
                  <td>${job.budget?.toLocaleString()}</td>
                  <td><Badge variant="flagged">{job.flagReason}</Badge></td>
                  <td>
                    <button className="btn btn-success btn-sm" onClick={() => handleApprove(job.id)}>Approve</button>
                    <button className="btn btn-danger btn-sm" onClick={() => setRejectId(job.id)}>Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={data.page} total={data.total} perPage={data.perPage} onPage={setPage} />
        </>
      )}

      {rejectId && (
        <div className="modal-overlay" onClick={() => setRejectId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reject Listing</h3>
            <textarea placeholder="Reason for rejection..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setRejectId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleReject(rejectId)}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DisputeResolution() {
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<any>(null);
  const [ruling, setRuling] = useState({ ruling: "", party: "freelancer" });
  const [msg, setMsg] = useState("");

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("perPage", "10");
  if (filter) params.set("status", filter);

  const { data, loading, reload } = useAdminData(
    () => apiGet(`/api/admin/disputes?${params}`),
    [page, filter],
  );

  async function openDetail(id) {
    try {
      const d = await apiGet(`/api/admin/disputes/${id}`);
      setDetail(d);
    } catch (e) { setMsg(`Error: ${e.message}`); }
  }

  async function handleRule() {
    if (!ruling.ruling) return;
    try {
      await apiPost(`/api/admin/disputes/${detail.id}/rule`, ruling);
      setMsg("Ruling applied");
      setDetail(null);
      setRuling({ ruling: "", party: "freelancer" });
      reload();
      setTimeout(() => setMsg(""), 3000);
    } catch (e) { setMsg(`Error: ${e.message}`); }
  }

  if (detail) {
    return (
      <div>
        <button className="btn btn-ghost" onClick={() => setDetail(null)}>← Back to disputes</button>
        <div className="dispute-card" style={{ marginTop: "1rem" }}>
          <div className="section-header">
            <h3>Dispute #{detail.id}</h3>
            <Badge variant={detail.status === "resolved" ? "resolved" : detail.status === "under_review" ? "review" : "open"}>{detail.status}</Badge>
          </div>
          <p style={{ color: "#8b98c7", margin: "0.5rem 0" }}>{detail.reason}</p>
          <p style={{ fontSize: "0.85rem" }}>Amount: ${detail.amount} — Opened: {new Date(detail.openedAt).toLocaleDateString()}</p>
          {detail.resolution && <p style={{ color: "#4cdf8b", fontSize: "0.85rem" }}>Resolution: {detail.resolution}</p>}

          <h4 style={{ margin: "1rem 0 0.5rem", fontSize: "0.9rem" }}>Messages</h4>
          {detail.messages?.map((m, i) => (
            <div key={i} className="msg-bubble">
              <div className="msg-from">{m.from === "freelancer" ? "Freelancer" : "Client"}</div>
              <div>{m.text}</div>
            </div>
          ))}

          <h4 style={{ margin: "1rem 0 0.5rem", fontSize: "0.9rem" }}>Evidence</h4>
          <ul style={{ color: "#8b98c7", fontSize: "0.85rem" }}>
            {detail.evidence?.map((e, i) => <li key={i}>{e}</li>)}
          </ul>

          {detail.status !== "resolved" && (
            <div style={{ marginTop: "1rem", padding: "1rem", background: "#1f2a4a", borderRadius: "8px" }}>
              <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.9rem" }}>Issue Ruling</h4>
              <select className="filter-select" value={ruling.party} onChange={(e) => setRuling({ ...ruling, party: e.target.value })}>
                <option value="freelancer">Rule for Freelancer</option>
                <option value="client">Rule for Client</option>
              </select>
              <textarea
                style={{ marginTop: "0.5rem" }}
                placeholder="Ruling details..."
                value={ruling.ruling}
                onChange={(e) => setRuling({ ...ruling, ruling: e.target.value })}
              />
              <button className="btn btn-primary" onClick={handleRule}>Apply Ruling</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <select className="filter-select" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
          <option value="">All disputes</option>
          <option value="open">Open</option>
          <option value="under_review">Under Review</option>
          <option value="resolved">Resolved</option>
        </select>
        {msg && <span style={{ color: msg.startsWith("Error") ? "#df4c4c" : "#4cdf8b", fontSize: "0.85rem" }}>{msg}</span>}
      </div>

      {loading ? <Loading /> : !data?.disputes?.length ? <Empty message="No disputes" /> : (
        <>
          {data.disputes.map((d) => (
            <div key={d.id} className="dispute-card" style={{ cursor: "pointer" }} onClick={() => openDetail(d.id)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>#{d.id}</strong> — <span style={{ color: "#8b98c7" }}>{d.reason}</span>
                </div>
                <Badge variant={d.status === "resolved" ? "resolved" : d.status === "under_review" ? "review" : "open"}>{d.status}</Badge>
              </div>
              <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#5a6a9a" }}>
                ${d.amount} · {new Date(d.openedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
          <Pagination page={data.page} total={data.total} perPage={data.perPage} onPage={setPage} />
        </>
      )}
    </div>
  );
}

function PlatformControls() {
  const { data, loading, reload } = useAdminData(() => apiGet("/api/admin/controls"), []);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function handleToggle(key) {
    try {
      await apiPut("/api/admin/controls", { [key]: !data[key] });
      setMsg(`Toggled successfully`);
      reload();
      setConfirm(null);
      setTimeout(() => setMsg(""), 3000);
    } catch (e) { setMsg(`Error: ${e.message}`); }
  }

  if (loading) return <Loading />;
  if (!data) return <Empty message="Failed to load controls" />;

  return (
    <div>
      {msg && <div style={{ color: msg.startsWith("Error") ? "#df4c4c" : "#4cdf8b", fontSize: "0.85rem", marginBottom: "1rem" }}>{msg}</div>}

      <div className="toggle-group">
        <div className="toggle-row">
          <div>
            <div className="toggle-label">New User Registrations</div>
            <div className="toggle-desc">Allow new users to sign up for the platform</div>
          </div>
          <button className={`toggle-switch ${data.registrationsEnabled ? "on" : ""}`} onClick={() => setConfirm("registrationsEnabled")} />
        </div>
        <div className="toggle-row">
          <div>
            <div className="toggle-label">New Job Postings</div>
            <div className="toggle-desc">Allow clients to post new jobs</div>
          </div>
          <button className={`toggle-switch ${data.jobPostingsEnabled ? "on" : ""}`} onClick={() => setConfirm("jobPostingsEnabled")} />
        </div>
      </div>

      {confirm && (
        <div className="modal-overlay" onClick={() => setConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Change</h3>
            <p style={{ color: "#8b98c7", fontSize: "0.9rem" }}>
              Are you sure you want to {data[confirm] ? "disable" : "enable"} {confirm === "registrationsEnabled" ? "new user registrations" : "new job postings"}?
            </p>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handleToggle(confirm)}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AuditLogViewer() {
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("perPage", "15");
  if (actionFilter) params.set("action", actionFilter);

  const { data, loading } = useAdminData(
    () => apiGet(`/api/admin/audit-log?${params}`),
    [page, actionFilter],
  );

  return (
    <div>
      <div className="section-header">
        <select className="filter-select" value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}>
          <option value="">All actions</option>
          <option value="user_suspend">Suspensions</option>
          <option value="user_reinstate">Reinstatements</option>
          <option value="user_ban">Bans</option>
          <option value="job_approve">Job Approvals</option>
          <option value="job_reject">Job Rejections</option>
          <option value="dispute_rule">Dispute Rulings</option>
          <option value="toggle_registrations">Registration Toggles</option>
          <option value="toggle_job_postings">Job Posting Toggles</option>
        </select>
      </div>

      {loading ? <Loading /> : !data?.entries?.length ? <Empty message="No audit log entries" /> : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((e) => (
                <tr key={e.id}>
                  <td style={{ color: "#8b98c7", whiteSpace: "nowrap" }}>{new Date(e.timestamp).toLocaleString()}</td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{e.adminId}</td>
                  <td><Badge variant="open">{e.action}</Badge></td>
                  <td style={{ fontSize: "0.85rem", color: "#8b98c7" }}>{JSON.stringify(e.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={data.page} total={data.total} perPage={data.perPage} onPage={setPage} />
        </>
      )}
    </div>
  );
}

const TABS = [
  { key: "dashboard", label: "Dashboard", component: MetricsDashboard },
  { key: "users", label: "Users", component: UserManagement },
  { key: "moderation", label: "Moderation", component: JobModeration },
  { key: "disputes", label: "Disputes", component: DisputeResolution },
  { key: "controls", label: "Controls", component: PlatformControls },
  { key: "audit", label: "Audit Log", component: AuditLogViewer },
];

export default function AdminPanelPage() {
  const [tab, setTab] = useState("dashboard");
  const [token, setToken] = useState<string | null>(null);
  const [loginMsg, setLoginMsg] = useState("");

  useEffect(() => {
    setToken(localStorage.getItem("admin_token"));
  }, []);

  async function handleLogin() {
    try {
      const res = await fetch(`${API}/api/admin/dev-login`, { method: "POST" });
      const data = await res.json();
      const jwt = data.data?.token;
      if (!jwt) throw new Error("No token in response");
      localStorage.setItem("admin_token", jwt);
      setToken(jwt);
      setLoginMsg("Logged in as admin");
      setTimeout(() => setLoginMsg(""), 3000);
    } catch (e: any) {
      setLoginMsg(`Login failed: ${e.message}`);
    }
  }

  function handleLogout() {
    localStorage.removeItem("admin_token");
    setToken(null);
  }

  const ActiveComponent = TABS.find((t) => t.key === tab)?.component || MetricsDashboard;

  return (
    <div>
      <div className="section-header">
        <h2>Admin Panel</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {token ? (
            <>
              <span style={{ color: "#4cdf8b", fontSize: "0.85rem" }}>Authenticated</span>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={handleLogin}>Login as Admin</button>
          )}
          {loginMsg && <span style={{ color: loginMsg.startsWith("Login failed") ? "#df4c4c" : "#4cdf8b", fontSize: "0.85rem" }}>{loginMsg}</span>}
        </div>
      </div>
      <div className="admin-layout">
        <nav className="admin-nav">
          {TABS.map((t) => (
            <button key={t.key} className={tab === t.key ? "active" : ""} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="admin-content">
          {!token ? (
            <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
              <p style={{ color: "#8b98c7" }}>Click "Login as Admin" to access the admin panel.</p>
            </div>
          ) : (
            <ActiveComponent />
          )}
        </div>
      </div>
    </div>
  );
}
