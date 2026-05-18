"use client";

import { useCallback, useEffect, useState } from "react";

/* ──────────────────────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────────────────────── */
interface User {
  id: string; email: string; name: string; role: string; status: string; createdAt: string;
  jobs?: Job[]; disputes?: Dispute[];
}
interface Job {
  id: string; userId: string; title: string; description: string; budgetMin: number; budgetMax: number;
  status: string; categoryId: string; skills: string[]; createdAt: string;
  flaggedReason?: string; flaggedBy?: string; flaggedAt?: string; moderationStatus?: string;
  moderationReason?: string;
}
interface Dispute {
  id: string; jobId: string; raisedBy: string; raisedAgainst: string; reason: string;
  evidence: string; status: string; ruling: string | null; ruledBy: string | null;
  createdAt: string; raisedByName?: string; raisedAgainstName?: string; job?: Job | null;
  rulingNotes?: string;
}
interface MetricCard {
  label: string; value: number | string; color: string;
}
interface AuditEntry {
  id: string; adminId: string; adminName: string; action: string; target: string;
  details: string; createdAt: string;
}
interface Paginated<T> {
  items: T[]; total: number; page: number; limit: number; totalPages: number;
}
interface Metrics {
  totalUsers: number; activeUsers: number; suspendedUsers: number; bannedUsers: number;
  totalJobs: number; activeJobs: number; completedJobs: number; openDisputes: number;
  pendingFlagged: number; totalRevenue: number; trustScore: number;
  trustScoreHistory: { date: string; score: number }[];
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/admin";

/* ──────────────────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────────────────── */
function token(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || "";
}
function headers(): Record<string, string> {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token()}` };
}
async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, { ...init, headers: { ...headers(), ...init?.headers } });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "API error");
  return json.data as T;
}
function badge(label: string, color: string) {
  return { display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600, background: color, color: "#fff" };
}
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString();
}

/* ──────────────────────────────────────────────────────────────────────────
   Sub-components
   ────────────────────────────────────────────────────────────────────────── */

function MetricCards({ data }: { data: Metrics }) {
  const cards: MetricCard[] = [
    { label: "Total Users", value: data.totalUsers, color: "#4f46e5" },
    { label: "Active Users", value: data.activeUsers, color: "#10b981" },
    { label: "Active Jobs", value: data.activeJobs, color: "#3b82f6" },
    { label: "Open Disputes", value: data.openDisputes, color: "#f59e0b" },
    { label: "Flagged Listings", value: data.pendingFlagged, color: "#ef4444" },
    { label: "Revenue", value: `$${data.totalRevenue.toLocaleString()}`, color: "#8b5cf6" },
  ];
  return (
    <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginBottom: 16 }}>
      {cards.map(c => (
        <div key={c.label} className="card" style={{ textAlign: "center", borderTop: `3px solid ${c.color}` }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{c.value}</div>
          <div style={{ fontSize: 12, color: "#8892b0" }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}

function TrustScoreChart({ history }: { history: { date: string; score: number }[] }) {
  const max = Math.max(...history.map(h => h.score), 100);
  const w = 320, h = 120;
  const points = history.map((p, i) => `${(i / (history.length - 1)) * w},${h - (p.score / max) * (h - 10)}`).join(" ");
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h3 style={{ margin: "0 0 8px" }}>Trust Score Trend</h3>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", maxWidth: w, height: h }}>
        <polyline fill="none" stroke="#10b981" strokeWidth="2" points={points} />
        {history.map((p, i) => (
          <circle key={i} cx={(i / (history.length - 1)) * w} cy={h - (p.score / max) * (h - 10)} r="3" fill="#10b981" />
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#8892b0", marginTop: 4 }}>
        {history.filter((_, i) => i === 0 || i === history.length - 1).map(p => (
          <span key={p.date}>{p.date}</span>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#10b981" }}>Current: {history[history.length - 1].score}/100</span>
      </div>
    </div>
  );
}

function Pagination({ paginated, onPage }: { paginated: Paginated<any>; onPage: (p: number) => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, fontSize: 13 }}>
      <span style={{ color: "#8892b0" }}>{paginated.total} total</span>
      <div style={{ display: "flex", gap: 6 }}>
        <button disabled={paginated.page <= 1} onClick={() => onPage(paginated.page - 1)} className="card" style={{ padding: "4px 10px", cursor: "pointer", border: "none" }}>Prev</button>
        <span style={{ padding: "4px 8px" }}>Page {paginated.page} of {paginated.totalPages}</span>
        <button disabled={paginated.page >= paginated.totalPages} onClick={() => onPage(paginated.page + 1)} className="card" style={{ padding: "4px 10px", cursor: "pointer", border: "none" }}>Next</button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = { active: "#10b981", suspended: "#f59e0b", banned: "#ef4444", open: "#3b82f6", under_review: "#f59e0b", resolved: "#10b981", pending: "#6b7280", approved: "#10b981", rejected: "#ef4444", escalated: "#8b5cf6" };
  const label = status.replace(/_/g, " ");
  return <span style={badge(label, colors[status] || "#6b7280")}>{label}</span>;
}

/* ──────────────────────────────────────────────────────────────────────────
   Tab views
   ────────────────────────────────────────────────────────────────────────── */

function UsersTab() {
  const [data, setData] = useState<Paginated<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<User | null>(null);
  const [actionMsg, setActionMsg] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);
      setData(await api<Paginated<User>>(`/users?${params}`));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const updateStatus = async (userId: string, status: string) => {
    setActionMsg(""); setLoading(true);
    try {
      await api(`/users/${userId}/status`, { method: "PATCH", body: JSON.stringify({ status, reason: `${status} by admin` }) });
      setActionMsg(`User ${status} successfully`);
      fetchUsers();
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const viewUser = async (userId: string) => {
    setLoading(true);
    try { setSelected(await api<User>(`/users/${userId}`)); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <h2 style={{ margin: "0 0 12px" }}>User Management</h2>

      {/* Filters */}
      <div className="card" style={{ padding: "12px", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input placeholder="Search name or email…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #2a3765", background: "#0b1020", color: "#f2f5ff", flex: 1, minWidth: 180 }} />
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #2a3765", background: "#0b1020", color: "#f2f5ff" }}>
            <option value="">All Roles</option>
            <option value="client">Client</option>
            <option value="freelancer">Freelancer</option>
            <option value="admin">Admin</option>
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #2a3765", background: "#0b1020", color: "#f2f5ff" }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>

      {actionMsg && <div style={{ padding: "8px 12px", background: "#065f46", color: "#d1fae5", borderRadius: 6, marginBottom: 8 }}>{actionMsg}</div>}
      {error && <div style={{ padding: "8px 12px", background: "#7f1d1d", color: "#fecaca", borderRadius: 6, marginBottom: 8 }}>{error}</div>}

      {loading && !data && <p style={{ color: "#8892b0" }}>Loading…</p>}

      {selected ? (
        <div className="card">
          <button onClick={() => setSelected(null)} style={{ float: "right", cursor: "pointer", background: "none", border: "1px solid #2a3765", color: "#f2f5ff", padding: "4px 10px", borderRadius: 6 }}>Back</button>
          <h3 style={{ margin: "0 0 8px" }}>{selected.name}</h3>
          <p style={{ color: "#8892b0", fontSize: 13 }}>{selected.email} &middot; {selected.role} &middot; <StatusBadge status={selected.status} /></p>
          <p style={{ fontSize: 13, color: "#8892b0" }}>Joined {new Date(selected.createdAt).toLocaleDateString()}</p>
          <h4 style={{ margin: "16px 0 8px", fontSize: 14 }}>Jobs ({selected.jobs?.length || 0})</h4>
          {selected.jobs?.slice(0, 5).map(j => (
            <div key={j.id} style={{ padding: "6px 0", borderBottom: "1px solid #2a3765", fontSize: 13 }}>
              <strong>{j.title}</strong> &middot; <StatusBadge status={j.status} />
            </div>
          ))}
          <h4 style={{ margin: "16px 0 8px", fontSize: 14 }}>Disputes ({selected.disputes?.length || 0})</h4>
          {selected.disputes?.map(d => (
            <div key={d.id} style={{ padding: "6px 0", borderBottom: "1px solid #2a3765", fontSize: 13 }}>
              {d.reason.slice(0, 60)}… &middot; <StatusBadge status={d.status} />
            </div>
          ))}
        </div>
      ) : (
        <>
          {data && data.items.length === 0 && <p style={{ color: "#8892b0" }}>No users found.</p>}
          {data && data.items.length > 0 && (
            <div className="card" style={{ padding: 0, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #2a3765", textAlign: "left" }}>
                    <th style={{ padding: "10px 12px" }}>Name</th>
                    <th style={{ padding: "10px 12px" }}>Email</th>
                    <th style={{ padding: "10px 12px" }}>Role</th>
                    <th style={{ padding: "10px 12px" }}>Status</th>
                    <th style={{ padding: "10px 12px" }}>Joined</th>
                    <th style={{ padding: "10px 12px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map(u => (
                    <tr key={u.id} style={{ borderBottom: "1px solid #151c35" }}>
                      <td style={{ padding: "10px 12px" }}><button onClick={() => viewUser(u.id)} style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer", padding: 0, fontSize: 13 }}>{u.name}</button></td>
                      <td style={{ padding: "10px 12px", color: "#8892b0" }}>{u.email}</td>
                      <td style={{ padding: "10px 12px" }}>{u.role}</td>
                      <td style={{ padding: "10px 12px" }}><StatusBadge status={u.status} /></td>
                      <td style={{ padding: "10px 12px", color: "#8892b0" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          {u.status !== "suspended" && <button onClick={() => updateStatus(u.id, "suspended")} disabled={loading} style={{ padding: "3px 8px", fontSize: 11, borderRadius: 4, border: "1px solid #f59e0b", background: "transparent", color: "#f59e0b", cursor: loading ? "not-allowed" : "pointer" }}>Suspend</button>}
                          {u.status !== "banned" && <button onClick={() => updateStatus(u.id, "banned")} disabled={loading} style={{ padding: "3px 8px", fontSize: 11, borderRadius: 4, border: "1px solid #ef4444", background: "transparent", color: "#ef4444", cursor: loading ? "not-allowed" : "pointer" }}>Ban</button>}
                          {u.status !== "active" && <button onClick={() => updateStatus(u.id, "active")} disabled={loading} style={{ padding: "3px 8px", fontSize: 11, borderRadius: 4, border: "1px solid #10b981", background: "transparent", color: "#10b981", cursor: loading ? "not-allowed" : "pointer" }}>Reinstate</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {data && <Pagination paginated={data} onPage={setPage} />}
        </>
      )}
    </div>
  );
}

function JobsTab() {
  const [data, setData] = useState<Paginated<Job> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [modMsg, setModMsg] = useState("");

  const fetchFlagged = useCallback(async () => {
    setLoading(true); setError("");
    try {
      setData(await api<Paginated<Job>>(`/jobs/flagged?page=${page}&limit=20`));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchFlagged(); }, [fetchFlagged]);

  const moderate = async (jobId: string, action: string) => {
    const reason = action === "reject" ? prompt("Rejection reason:") : undefined;
    if (action === "reject" && !reason) return;
    setLoading(true); setModMsg(""); setError("");
    try {
      await api(`/jobs/${jobId}/moderate`, { method: "POST", body: JSON.stringify({ action, reason }) });
      setModMsg(`Job ${action}d successfully`);
      fetchFlagged();
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <h2 style={{ margin: "0 0 12px" }}>Job &amp; Listing Moderation</h2>
      {modMsg && <div style={{ padding: "8px 12px", background: "#065f46", color: "#d1fae5", borderRadius: 6, marginBottom: 8 }}>{modMsg}</div>}
      {error && <div style={{ padding: "8px 12px", background: "#7f1d1d", color: "#fecaca", borderRadius: 6, marginBottom: 8 }}>{error}</div>}
      {loading && !data && <p style={{ color: "#8892b0" }}>Loading…</p>}
      {data && data.items.length === 0 && <p style={{ color: "#8892b0" }}>No flagged listings.</p>}
      {data && data.items.map(job => (
        <div key={job.id} className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: 15 }}>{job.title}</h3>
              <p style={{ margin: "0 0 4px", color: "#8892b0", fontSize: 13 }}>{job.description.slice(0, 120)}…</p>
              <p style={{ margin: "0", fontSize: 12, color: "#f59e0b" }}>
                ⚠ Flagged: {job.flaggedReason} &middot; {timeAgo(job.flaggedAt || job.createdAt)}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#8892b0" }}>
                Budget: ${job.budgetMin}–${job.budgetMax} &middot; Skills: {job.skills?.join(", ")}
              </p>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => moderate(job.id, "approve")} disabled={loading} style={{ padding: "6px 14px", fontSize: 12, borderRadius: 6, border: "none", background: "#10b981", color: "#fff", cursor: loading ? "not-allowed" : "pointer" }}>Approve</button>
              <button onClick={() => moderate(job.id, "reject")} disabled={loading} style={{ padding: "6px 14px", fontSize: 12, borderRadius: 6, border: "none", background: "#ef4444", color: "#fff", cursor: loading ? "not-allowed" : "pointer" }}>Reject</button>
              <button onClick={() => moderate(job.id, "escalate")} disabled={loading} style={{ padding: "6px 14px", fontSize: 12, borderRadius: 6, border: "none", background: "#8b5cf6", color: "#fff", cursor: loading ? "not-allowed" : "pointer" }}>Escalate</button>
            </div>
          </div>
        </div>
      ))}
      {data && <Pagination paginated={data} onPage={setPage} />}
    </div>
  );
}

function DisputesTab() {
  const [data, setData] = useState<Paginated<Dispute> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [ruleMsg, setRuleMsg] = useState("");

  const fetchDisputes = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      setData(await api<Paginated<Dispute>>(`/disputes?${params}`));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchDisputes(); }, [fetchDisputes]);

  const viewDispute = async (id: string) => {
    setLoading(true);
    try { setSelected(await api<Dispute>(`/disputes/${id}`)); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const rule = async (disputeId: string, ruling: string) => {
    const notes = ruling !== "escalate" ? prompt("Ruling notes (optional):") : undefined;
    setLoading(true); setRuleMsg(""); setError("");
    try {
      await api(`/disputes/${disputeId}/rule`, { method: "POST", body: JSON.stringify({ ruling, notes }) });
      setRuleMsg(`Ruling "${ruling}" applied`);
      setSelected(null);
      fetchDisputes();
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  if (selected) {
    return (
      <div>
        <button onClick={() => setSelected(null)} style={{ marginBottom: 12, cursor: "pointer", background: "none", border: "1px solid #2a3765", color: "#f2f5ff", padding: "6px 14px", borderRadius: 6 }}>← Back to queue</button>
        <div className="card">
          <h3 style={{ margin: "0 0 8px" }}>Dispute {selected.id}</h3>
          <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
            <p><strong>Status:</strong> <StatusBadge status={selected.status} /></p>
            <p><strong>Raised By:</strong> {selected.raisedByName} ({selected.raisedBy})</p>
            <p><strong>Against:</strong> {selected.raisedAgainstName} ({selected.raisedAgainst})</p>
            <p><strong>Reason:</strong> {selected.reason}</p>
            <div><strong>Evidence:</strong><pre style={{ background: "#151c35", padding: 12, borderRadius: 8, marginTop: 4, fontSize: 12, whiteSpace: "pre-wrap", color: "#d1d5db" }}>{selected.evidence}</pre></div>
            {selected.job && (
              <div>
                <strong>Related Job:</strong>
                <p style={{ margin: "4px 0", color: "#60a5fa" }}>{selected.job.title} (${selected.job.budgetMin}–${selected.job.budgetMax})</p>
              </div>
            )}
            {selected.ruling && <p><strong>Ruling:</strong> {selected.ruling}</p>}
            {selected.rulingNotes && <p><strong>Notes:</strong> {selected.rulingNotes}</p>}
          </div>
          {selected.status !== "resolved" && (
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={() => rule(selected.id, "favor_raiser")} disabled={loading} style={{ padding: "8px 16px", fontSize: 13, borderRadius: 6, border: "none", background: "#10b981", color: "#fff", cursor: loading ? "not-allowed" : "pointer" }}>Rule: Favor Raiser</button>
              <button onClick={() => rule(selected.id, "favor_opponent")} disabled={loading} style={{ padding: "8px 16px", fontSize: 13, borderRadius: 6, border: "none", background: "#f59e0b", color: "#fff", cursor: loading ? "not-allowed" : "pointer" }}>Rule: Favor Opponent</button>
              <button onClick={() => rule(selected.id, "refund_both")} disabled={loading} style={{ padding: "8px 16px", fontSize: 13, borderRadius: 6, border: "none", background: "#8b5cf6", color: "#fff", cursor: loading ? "not-allowed" : "pointer" }}>Refund Both</button>
              <button onClick={() => rule(selected.id, "escalate")} disabled={loading} style={{ padding: "8px 16px", fontSize: 13, borderRadius: 6, border: "none", background: "#ef4444", color: "#fff", cursor: loading ? "not-allowed" : "pointer" }}>Escalate</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ margin: "0 0 12px" }}>Dispute Resolution</h2>
      {ruleMsg && <div style={{ padding: "8px 12px", background: "#065f46", color: "#d1fae5", borderRadius: 6, marginBottom: 8 }}>{ruleMsg}</div>}
      {error && <div style={{ padding: "8px 12px", background: "#7f1d1d", color: "#fecaca", borderRadius: 6, marginBottom: 8 }}>{error}</div>}

      <div style={{ marginBottom: 12 }}>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #2a3765", background: "#0b1020", color: "#f2f5ff" }}>
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="under_review">Under Review</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {loading && !data && <p style={{ color: "#8892b0" }}>Loading…</p>}
      {data && data.items.length === 0 && <p style={{ color: "#8892b0" }}>No disputes found.</p>}
      {data && data.items.map(d => (
        <div key={d.id} className="card" style={{ cursor: "pointer" }} onClick={() => viewDispute(d.id)} role="button" tabIndex={0} aria-label={`View dispute ${d.id}`} onKeyDown={e => e.key === "Enter" && viewDispute(d.id)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ margin: "0 0 4px", fontWeight: 600, fontSize: 13 }}>{d.raisedByName} vs {d.raisedAgainstName}</p>
              <p style={{ margin: "0", color: "#8892b0", fontSize: 12 }}>{d.reason.slice(0, 80)}…</p>
            </div>
            <StatusBadge status={d.status} />
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 11, color: "#6b7280" }}>{timeAgo(d.createdAt)}</p>
        </div>
      ))}
      {data && <Pagination paginated={data} onPage={setPage} />}
    </div>
  );
}

function ControlsTab() {
  const [controls, setControls] = useState<{ registrationsOpen: boolean; jobPostingsOpen: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [confirm, setConfirm] = useState<{ field: string; value: boolean } | null>(null);

  useEffect(() => {
    api<{ registrationsOpen: boolean; jobPostingsOpen: boolean }>("/controls")
      .then(setControls).catch(e => setMsg(e.message)).finally(() => setLoading(false));
  }, []);

  const toggle = async (field: "registrationsOpen" | "jobPostingsOpen", value: boolean) => {
    setLoading(true); setMsg("");
    try {
      const result = await api<{ registrationsOpen: boolean; jobPostingsOpen: boolean }>("/controls", {
        method: "PATCH", body: JSON.stringify({ [field]: value })
      });
      setControls(result);
      setMsg(`${field === "registrationsOpen" ? "Registrations" : "Job postings"} ${value ? "opened" : "closed"}`);
    } catch (e: any) { setMsg(e.message); }
    finally { setLoading(false); setConfirm(null); }
  };

  if (loading && !controls) return <p style={{ color: "#8892b0" }}>Loading…</p>;

  return (
    <div>
      <h2 style={{ margin: "0 0 12px" }}>Platform Controls</h2>
      {msg && <div style={{ padding: "8px 12px", background: "#065f46", color: "#d1fae5", borderRadius: 6, marginBottom: 8 }}>{msg}</div>}

      {controls && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #2a3765" }}>
            <div>
              <strong>New User Registrations</strong>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#8892b0" }}>Allow new users to create accounts</p>
            </div>
            {confirm?.field === "registrationsOpen" ? (
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ fontSize: 13, color: "#f59e0b" }}>Confirm {confirm.value ? "open" : "close"}?</span>
                <button onClick={() => toggle("registrationsOpen", confirm.value)} disabled={loading} style={{ padding: "4px 10px", fontSize: 12, borderRadius: 4, border: "none", background: "#10b981", color: "#fff", cursor: loading ? "not-allowed" : "pointer" }}>Yes</button>
                <button onClick={() => setConfirm(null)} style={{ padding: "4px 10px", fontSize: 12, borderRadius: 4, border: "1px solid #2a3765", background: "transparent", color: "#f2f5ff", cursor: "pointer" }}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => setConfirm({ field: "registrationsOpen", value: !controls.registrationsOpen })}
                style={{ padding: "6px 16px", borderRadius: 6, border: "none", background: controls.registrationsOpen ? "#ef4444" : "#10b981", color: "#fff", cursor: "pointer", fontSize: 13 }}>
                {controls.registrationsOpen ? "Close Registrations" : "Open Registrations"}
              </button>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" }}>
            <div>
              <strong>New Job Postings</strong>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#8892b0" }}>Allow clients to post new jobs</p>
            </div>
            {confirm?.field === "jobPostingsOpen" ? (
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ fontSize: 13, color: "#f59e0b" }}>Confirm {confirm.value ? "open" : "close"}?</span>
                <button onClick={() => toggle("jobPostingsOpen", confirm.value)} disabled={loading} style={{ padding: "4px 10px", fontSize: 12, borderRadius: 4, border: "none", background: "#10b981", color: "#fff", cursor: loading ? "not-allowed" : "pointer" }}>Yes</button>
                <button onClick={() => setConfirm(null)} style={{ padding: "4px 10px", fontSize: 12, borderRadius: 4, border: "1px solid #2a3765", background: "transparent", color: "#f2f5ff", cursor: "pointer" }}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => setConfirm({ field: "jobPostingsOpen", value: !controls.jobPostingsOpen })}
                style={{ padding: "6px 16px", borderRadius: 6, border: "none", background: controls.jobPostingsOpen ? "#ef4444" : "#10b981", color: "#fff", cursor: "pointer", fontSize: 13 }}>
                {controls.jobPostingsOpen ? "Disable Job Postings" : "Enable Job Postings"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AuditLogTab() {
  const [data, setData] = useState<Paginated<AuditEntry> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");

  const fetchLog = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (actionFilter) params.set("action", actionFilter);
      setData(await api<Paginated<AuditEntry>>(`/audit-log?${params}`));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [page, actionFilter]);

  useEffect(() => { fetchLog(); }, [fetchLog]);

  const actionColors: Record<string, string> = {
    login: "#3b82f6", update_controls: "#8b5cf6", update_user_status: "#f59e0b",
    moderate_job: "#10b981", rule_dispute: "#ef4444"
  };

  return (
    <div>
      <h2 style={{ margin: "0 0 12px" }}>Audit Log</h2>
      {error && <div style={{ padding: "8px 12px", background: "#7f1d1d", color: "#fecaca", borderRadius: 6, marginBottom: 8 }}>{error}</div>}

      <div style={{ marginBottom: 12 }}>
        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #2a3765", background: "#0b1020", color: "#f2f5ff" }}>
          <option value="">All Actions</option>
          <option value="login">Login</option>
          <option value="update_controls">Controls</option>
          <option value="update_user_status">User Status</option>
          <option value="moderate_job">Job Moderation</option>
          <option value="rule_dispute">Dispute Ruling</option>
        </select>
      </div>

      {loading && !data && <p style={{ color: "#8892b0" }}>Loading…</p>}
      {data && data.items.length === 0 && <p style={{ color: "#8892b0" }}>No audit log entries found.</p>}
      {data && data.items.length > 0 && (
        <div className="card" style={{ padding: 0, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2a3765", textAlign: "left" }}>
                <th style={{ padding: "10px 12px" }}>Time</th>
                <th style={{ padding: "10px 12px" }}>Admin</th>
                <th style={{ padding: "10px 12px" }}>Action</th>
                <th style={{ padding: "10px 12px" }}>Target</th>
                <th style={{ padding: "10px 12px" }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map(e => (
                <tr key={e.id} style={{ borderBottom: "1px solid #151c35" }}>
                  <td style={{ padding: "10px 12px", color: "#6b7280", whiteSpace: "nowrap" }}>{timeAgo(e.createdAt)}</td>
                  <td style={{ padding: "10px 12px" }}>{e.adminName}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={badge(e.action.replace(/_/g, " "), actionColors[e.action] || "#6b7280")}>
                      {e.action.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", color: "#8892b0" }}>{e.target}</td>
                  <td style={{ padding: "10px 12px", color: "#d1d5db" }}>{e.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pagination paginated={data} onPage={setPage} />}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Main Admin Panel Page
   ────────────────────────────────────────────────────────────────────────── */
type TabId = "dashboard" | "users" | "jobs" | "disputes" | "controls" | "audit";

const TABS: { id: TabId; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "users", label: "Users" },
  { id: "jobs", label: "Jobs" },
  { id: "disputes", label: "Disputes" },
  { id: "controls", label: "Controls" },
  { id: "audit", label: "Audit Log" },
];

export default function AdminPanelPage() {
  const [tab, setTab] = useState<TabId>("dashboard");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  useEffect(() => {
    if (tab === "dashboard") {
      setMetricsLoading(true);
      api<Metrics>("/metrics").then(setMetrics).catch(() => {}).finally(() => setMetricsLoading(false));
    }
  }, [tab]);

  function renderTab() {
    switch (tab) {
      case "dashboard": return (
        <>
          {metricsLoading ? <p style={{ color: "#8892b0" }}>Loading metrics…</p> : metrics ? (
            <>
              <MetricCards data={metrics} />
              <TrustScoreChart history={metrics.trustScoreHistory} />
            </>
          ) : <p style={{ color: "#ef4444" }}>Failed to load metrics. Make sure you are logged in as admin.</p>}
        </>
      );
      case "users": return <UsersTab />;
      case "jobs": return <JobsTab />;
      case "disputes": return <DisputesTab />;
      case "controls": return <ControlsTab />;
      case "audit": return <AuditLogTab />;
    }
  }

  return (
    <section>
      <h2 style={{ margin: "0 0 16px" }}>Admin Panel</h2>

      {/* Tab navigation */}
      <nav style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }} role="tablist" aria-label="Admin panel sections">
        {TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: tab === t.id ? "#3b82f6" : "#151c35", color: tab === t.id ? "#fff" : "#8892b0",
              transition: "background 0.15s"
            }}>
            {t.label}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={tab}>
        {renderTab()}
      </div>
    </section>
  );
}
