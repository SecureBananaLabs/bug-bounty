"use client";

import { useState, useEffect, useCallback } from "react";

type Tab = "dashboard" | "users" | "moderation" | "disputes" | "settings" | "audit";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api/admin${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (res.status === 403) window.location.href = "/403";
  const json: ApiResponse<T> = await res.json();
  if (!json.success) throw new Error(json.message || "Request failed");
  return json.data;
}

// ─── Components ────────────────────────────────────────

function Dashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  useEffect(() => { api("/metrics").then(setMetrics).catch(console.error); }, []);
  if (!metrics) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="dashboard-grid">
      <div className="metric-card"><h3>Total Users</h3><p className="metric-value">{metrics.totalUsers}</p></div>
      <div className="metric-card"><h3>Active Jobs</h3><p className="metric-value">{metrics.activeJobs}</p></div>
      <div className="metric-card"><h3>Open Disputes</h3><p className="metric-value">{metrics.openDisputes}</p></div>
      <div className="metric-card"><h3>Flagged Listings</h3><p className="metric-value">{metrics.flaggedJobs}</p></div>
      <div className="metric-card"><h3>Revenue</h3><p className="metric-value">${metrics.revenue.toLocaleString()}</p></div>
    </div>
  );
}

function UsersTab() {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  const fetch = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (role) params.set("role", role);
    if (status) params.set("status", status);
    api(`/users?${params}`).then(setData).catch(console.error);
  }, [page, search, role, status]);

  useEffect(() => { fetch(); }, [fetch]);

  const action = async (userId: string, act: string) => {
    await api(`/users/${userId}/${act}`, { method: "PATCH" });
    fetch();
  };

  return (
    <div>
      <div className="filters">
        <input placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="">All Roles</option>
          <option value="CLIENT">Client</option>
          <option value="FREELANCER">Freelancer</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="BANNED">Banned</option>
        </select>
      </div>
      {data && (
        <>
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Verified</th><th>Actions</th></tr></thead>
            <tbody>
              {data.users.map((u: any) => (
                <tr key={u.id}>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td><span className={`badge role-${u.role}`}>{u.role}</span></td>
                  <td><span className={`badge status-${u.status}`}>{u.status}</span></td>
                  <td>{u.isVerified ? "✅" : "❌"}</td>
                  <td className="actions">
                    {u.status !== "SUSPENDED" && <button onClick={() => action(u.id, "suspend")}>Suspend</button>}
                    {u.status !== "ACTIVE" && <button onClick={() => action(u.id, "resume")}>Resume</button>}
                    {u.status !== "BANNED" && <button className="danger" onClick={() => action(u.id, "ban")}>Ban</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span>Page {page} of {data.totalPages}</span>
            <button disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        </>
      )}
    </div>
  );
}

function ModerationTab() {
  const [data, setData] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [rejectId, setRejectId] = useState<string | null>(null);

  const fetch = useCallback(() => {
    api("/jobs/moderation").then(setData).catch(console.error);
  }, []);
  useEffect(() => { fetch(); }, [fetch]);

  const approve = (id: string) => api(`/jobs/${id}/approve`, { method: "POST" }).then(fetch);
  const reject = async () => {
    if (!rejectId || !reason) return;
    await api(`/jobs/${rejectId}/reject`, { method: "POST", body: JSON.stringify({ reason }) });
    setRejectId(null); setReason(""); fetch();
  };
  const escalate = (id: string) => api(`/jobs/${id}/escalate`, { method: "POST" }).then(fetch);

  return (
    <div>
      {rejectId && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Rejection Reason</h3>
            <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Why is this listing being rejected?" />
            <div className="modal-actions">
              <button onClick={reject} disabled={!reason}>Confirm Reject</button>
              <button onClick={() => { setRejectId(null); setReason(""); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {data && data.jobs.length === 0 ? (
        <p>No flagged listings.</p>
      ) : (
        <table>
          <thead><tr><th>Title</th><th>Client</th><th>Budget</th><th>Flagged</th><th>Actions</th></tr></thead>
          <tbody>
            {data?.jobs.map((j: any) => (
              <tr key={j.id}>
                <td>{j.title}</td>
                <td>{j.client?.fullName}</td>
                <td>${j.budgetMin}–${j.budgetMax}</td>
                <td>{new Date(j.createdAt).toLocaleDateString()}</td>
                <td className="actions">
                  <button className="approve" onClick={() => approve(j.id)}>Approve</button>
                  <button className="danger" onClick={() => setRejectId(j.id)}>Reject</button>
                  <button onClick={() => escalate(j.id)}>Escalate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function DisputesTab() {
  const [data, setData] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [resolution, setResolution] = useState("");

  const fetch = useCallback(() => {
    api("/disputes").then(setData).catch(console.error);
  }, []);
  useEffect(() => { fetch(); }, [fetch]);

  const viewDetail = (id: string) => api(`/disputes/${id}`).then(setDetail);
  const resolve = async () => {
    if (!detail || !resolution) return;
    await api(`/disputes/${detail.id}/resolve`, { method: "POST", body: JSON.stringify({ resolution }) });
    setDetail(null); setResolution(""); fetch();
  };

  return (
    <div>
      {detail && (
        <div className="modal-overlay">
          <div className="modal wide">
            <h3>Dispute #{detail.id}</h3>
            <p><strong>Status:</strong> {detail.status}</p>
            <p><strong>Initiator:</strong> {detail.initiator?.fullName} ({detail.initiator?.email})</p>
            <p><strong>Respondent:</strong> {detail.respondent?.fullName} ({detail.respondent?.email})</p>
            <p><strong>Reason:</strong> {detail.reason}</p>
            {detail.description && <p><strong>Description:</strong> {detail.description}</p>}
            {detail.evidenceUrl && <p><strong>Evidence:</strong> <a href={detail.evidenceUrl}>{detail.evidenceUrl}</a></p>}
            <label>Resolution:</label>
            <textarea value={resolution} onChange={e => setResolution(e.target.value)} placeholder="Describe the resolution..." />
            <div className="modal-actions">
              <button onClick={resolve} disabled={!resolution}>Resolve Dispute</button>
              <button onClick={() => { setDetail(null); setResolution(""); }}>Close</button>
            </div>
          </div>
        </div>
      )}
      {data && data.disputes.length === 0 ? (
        <p>No open disputes.</p>
      ) : (
        <table>
          <thead><tr><th>ID</th><th>Status</th><th>Initiator</th><th>Respondent</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {data?.disputes.map((d: any) => (
              <tr key={d.id}>
                <td>{d.id.slice(-6)}</td>
                <td><span className={`badge status-${d.status}`}>{d.status}</span></td>
                <td>{d.initiator?.fullName}</td>
                <td>{d.respondent?.fullName}</td>
                <td>{new Date(d.createdAt).toLocaleDateString()}</td>
                <td><button onClick={() => viewDetail(d.id)}>View & Resolve</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function SettingsTab() {
  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const fetch = () => api("/settings").then(setSettings);
  useEffect(() => { fetch(); }, []);

  const toggle = async (key: string) => {
    if (!settings) return;
    setSaving(true);
    await api("/settings", { method: "PUT", body: JSON.stringify({ [key]: !settings[key] }) });
    fetch();
    setSaving(false);
  };

  if (!settings) return <div className="loading">Loading settings...</div>;

  return (
    <div className="settings-panel">
      <div className="setting-row">
        <div>
          <h3>New User Registration</h3>
          <p>{settings.allowRegistration ? "Users can sign up." : "Registration is disabled."}</p>
        </div>
        <button className={settings.allowRegistration ? "toggle on" : "toggle off"} onClick={() => toggle("allowRegistration")} disabled={saving}>
          {settings.allowRegistration ? "Disable" : "Enable"}
        </button>
      </div>
      <div className="setting-row">
        <div>
          <h3>New Job Posting</h3>
          <p>{settings.allowJobPosting ? "Users can post new jobs." : "Job posting is disabled."}</p>
        </div>
        <button className={settings.allowJobPosting ? "toggle on" : "toggle off"} onClick={() => toggle("allowJobPosting")} disabled={saving}>
          {settings.allowJobPosting ? "Disable" : "Enable"}
        </button>
      </div>
    </div>
  );
}

function AuditTab() {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);

  const fetch = useCallback(() => {
    api(`/audit-log?page=${page}&limit=50`).then(setData).catch(console.error);
  }, [page]);
  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div>
      {data && (
        <>
          <table>
            <thead><tr><th>Admin</th><th>Action</th><th>Entity</th><th>Details</th><th>Date</th></tr></thead>
            <tbody>
              {data.logs.map((l: any) => (
                <tr key={l.id}>
                  <td>{l.admin?.fullName}</td>
                  <td><span className="badge">{l.action}</span></td>
                  <td>{l.entityType}{l.entityId ? ` #${l.entityId.slice(-6)}` : ""}</td>
                  <td>{l.details?.slice(0, 80)}</td>
                  <td>{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span>Page {page} of {data.totalPages}</span>
            <button disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Admin Panel ─────────────────────────────────

const TABS: { key: Tab; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "users", label: "Users" },
  { key: "moderation", label: "Moderation" },
  { key: "disputes", label: "Disputes" },
  { key: "settings", label: "Settings" },
  { key: "audit", label: "Audit Log" },
];

export default function AdminPanelPage() {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <section className="admin-panel" role="main" aria-label="Admin Panel">
      <h2>Admin Panel</h2>
      <nav className="tab-nav" role="tablist">
        {TABS.map(t => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={tab === t.key ? "tab active" : "tab"}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div className="tab-content" role="tabpanel">
        {tab === "dashboard" && <Dashboard />}
        {tab === "users" && <UsersTab />}
        {tab === "moderation" && <ModerationTab />}
        {tab === "disputes" && <DisputesTab />}
        {tab === "settings" && <SettingsTab />}
        {tab === "audit" && <AuditTab />}
      </div>
    </section>
  );
}
