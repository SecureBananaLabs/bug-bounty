"use client";

import { useState, useEffect, useCallback } from "react";

// ---------- Types ----------

interface TrustDist { "90-100": number; "70-89": number; "50-69": number; "30-49": number; "0-29": number }

interface AdminMetrics {
  openJobs: number; activeFreelancers: number; flaggedAccounts: number;
  monthlyVolume: number; pendingDisputes: number; pendingReviews: number;
  totalUsers: number; activeUsers: number;
  trustScoreDistribution: TrustDist;
}

interface User {
  id: string; email: string; fullName: string; role: string; status: string;
  isVerified: boolean; trustScore: number; completedJobs: number;
  disputesWon: number; totalEarnings: number; joinedAt: string; lastActive: string;
  jobs?: { id: string; title: string; budget: number }[];
  disputes?: { id: string; reason: string; status: string }[];
}

interface FlaggedJob {
  id: string; title: string; clientName: string; clientId: string;
  budget: number; flagReason: string; flagCount: number; status: string; createdAt: string;
}

interface Dispute {
  id: string; jobId: string; jobTitle: string; userId: string; userName: string;
  reason: string; description: string; status: string; resolution: string | null;
  reviewedBy: string | null; createdAt: string; updatedAt: string;
  messages?: { from: string; body: string; at: string }[];
}

interface PlatformControl {
  key: string; value: string; description: string;
}

interface AuditLogEntry {
  id: string; action: string; entityType: string; entityId: string;
  performedBy: string; details: string; createdAt: string;
}

interface Paginated<T> {
  items: T[]; total: number; page: number; limit: number; totalPages: number;
}

// ---------- Tab names ----------
type Tab = "dashboard" | "users" | "moderation" | "disputes" | "controls" | "audit";

const TABS: { key: Tab; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "users", label: "Users" },
  { key: "moderation", label: "Moderation" },
  { key: "disputes", label: "Disputes" },
  { key: "controls", label: "Controls" },
  { key: "audit", label: "Audit Log" },
];

// ---------- Styles (inline for no extra deps) ----------

const styles: Record<string, React.CSSProperties> = {
  tabBar: { display: "flex", gap: 4, marginBottom: 24, flexWrap: "wrap", borderBottom: "1px solid #2a3765", paddingBottom: 0 },
  tab: (active: boolean) => ({
    padding: "10px 20px", borderRadius: "8px 8px 0 0", cursor: "pointer",
    background: active ? "#1e2a4a" : "transparent", color: active ? "#f2f5ff" : "#8892b0",
    border: active ? "1px solid #2a3765" : "1px solid transparent",
    borderBottom: active ? "1px solid #1e2a4a" : "none",
    fontWeight: 600, fontSize: 14, marginBottom: -1, position: "relative" as const, zIndex: active ? 1 : 0,
  }),
  card: { background: "#151c35", border: "1px solid #2a3765", borderRadius: 12, padding: 24, marginBottom: 16 },
  grid: { display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" },
  metricValue: { fontSize: 28, fontWeight: 700, margin: 0, color: "#f2f5ff" },
  metricLabel: { fontSize: 13, color: "#8892b0", marginTop: 4 },
  barChart: { display: "flex", alignItems: "flex-end", gap: 16, height: 160, paddingTop: 8 },
  barCol: { display: "flex", flexDirection: "column", alignItems: "center", flex: 1 },
  bar: (h: number, color: string) => ({
    width: "100%", maxWidth: 48, height: `${Math.max(h * 1.4, 4)}px`,
    background: color, borderRadius: "4px 4px 0 0", transition: "height 0.3s",
  }),
  barLabel: { fontSize: 11, color: "#8892b0", marginTop: 4 },
  barCount: { fontSize: 12, fontWeight: 600, color: "#f2f5ff" },
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
  th: { textAlign: "left" as const, padding: "10px 12px", borderBottom: "2px solid #2a3765", color: "#8892b0", fontWeight: 600, fontSize: 12, textTransform: "uppercase" as const },
  td: { padding: "10px 12px", borderBottom: "1px solid #1e2a4a", verticalAlign: "middle" as const },
  badge: (color: string) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500, background: color + "22", color, border: `1px solid ${color}44` }),
  button: (bg: string) => ({
    padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12,
    fontWeight: 600, background: bg, color: "#fff", marginRight: 6, marginBottom: 4,
  }),
  input: { padding: "8px 12px", borderRadius: 6, border: "1px solid #2a3765", background: "#0b1020", color: "#f2f5ff", fontSize: 13, width: "100%" },
  select: { padding: "8px 12px", borderRadius: 6, border: "1px solid #2a3765", background: "#0b1020", color: "#f2f5ff", fontSize: 13 },
  pagination: { display: "flex", gap: 8, alignItems: "center", justifyContent: "center", marginTop: 16 },
  pageBtn: (active: boolean) => ({
    padding: "6px 12px", borderRadius: 6, border: active ? "1px solid #4a7cf7" : "1px solid #2a3765",
    background: active ? "#4a7cf722" : "transparent", color: active ? "#4a7cf7" : "#8892b0",
    cursor: "pointer", fontSize: 13, fontWeight: 500,
  }),
  modalOverlay: { position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { background: "#151c35", border: "1px solid #2a3765", borderRadius: 16, padding: 32, maxWidth: 560, width: "90%", maxHeight: "80vh", overflow: "auto" },
  toast: { position: "fixed" as const, bottom: 24, right: 24, padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 500, zIndex: 200, color: "#fff" },
  spinner: { width: 20, height: 20, border: "3px solid #2a3765", borderTopColor: "#4a7cf7", borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" },
};

// ---------- Helpers ----------

async function apiFetch(path: string, options?: RequestInit) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
  const res = await fetch(`/api/admin${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Request failed");
  return json.data;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const BAR_COLORS = ["#4ade80", "#22d3ee", "#facc15", "#fb923c", "#f87171"];
const BAR_KEYS: (keyof TrustDist)[] = ["90-100", "70-89", "50-69", "30-49", "0-29"];

// ---------- Toast ----------

let toastTimer: ReturnType<typeof setTimeout> | null = null;

function useToast() {
  const [msg, setMsg] = useState<{ text: string; color: string } | null>(null);
  const show = useCallback((text: string, color = "#4ade80") => {
    setMsg({ text, color });
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => setMsg(null), 3000);
  }, []);
  return { toast: msg, showToast: show };
}

// ---------- Sub-components ----------

function TrustChart({ dist }: { dist: TrustDist }) {
  const maxVal = Math.max(...Object.values(dist), 1);
  return (
    <div style={styles.barChart}>
      {BAR_KEYS.map((k, i) => (
        <div key={k} style={styles.barCol}>
          <span style={styles.barCount}>{dist[k]}</span>
          <div style={styles.bar(dist[k] / maxVal * 140, BAR_COLORS[i])} />
          <span style={styles.barLabel}>{k}</span>
        </div>
      ))}
    </div>
  );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const pages: number[] = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) pages.push(i);
  return (
    <div style={styles.pagination}>
      <button style={styles.pageBtn(false)} onClick={() => onChange(page - 1)} disabled={page <= 1}>Prev</button>
      {pages[0] > 1 && <><button style={styles.pageBtn(false)} onClick={() => onChange(1)}>1</button><span style={{ color: "#8892b0" }}>...</span></>}
      {pages.map((p) => (
        <button key={p} style={styles.pageBtn(p === page)} onClick={() => onChange(p)}>{p}</button>
      ))}
      {pages[pages.length - 1] < totalPages && <><span style={{ color: "#8892b0" }}>...</span><button style={styles.pageBtn(false)} onClick={() => onChange(totalPages)}>{totalPages}</button></>}
      <button style={styles.pageBtn(false)} onClick={() => onChange(page + 1)} disabled={page >= totalPages}>Next</button>
    </div>
  );
}

function Spinner() {
  return <div style={{ textAlign: "center", padding: 32 }}><div style={styles.spinner} /></div>;
}

// ---------- Dashboard Tab ----------

function DashboardTab() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/metrics").then(setMetrics).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!metrics) return <p style={{ color: "#8892b0" }}>Failed to load metrics.</p>;

  const cards: { label: string; value: number | string; color: string }[] = [
    { label: "Total Users", value: metrics.totalUsers, color: "#4a7cf7" },
    { label: "Active Users", value: metrics.activeUsers, color: "#4ade80" },
    { label: "Open Jobs", value: metrics.openJobs, color: "#22d3ee" },
    { label: "Active Freelancers", value: metrics.activeFreelancers, color: "#a78bfa" },
    { label: "Monthly Volume", value: "$" + metrics.monthlyVolume.toLocaleString(), color: "#facc15" },
    { label: "Flagged Accounts", value: metrics.flaggedAccounts, color: "#f87171" },
    { label: "Pending Disputes", value: metrics.pendingDisputes, color: "#fb923c" },
    { label: "Pending Reviews", value: metrics.pendingReviews, color: "#f472b6" },
  ];

  return (
    <div>
      <div style={styles.grid}>
        {cards.map((c) => (
          <div key={c.label} style={{ ...styles.card, borderLeft: `4px solid ${c.color}` }}>
            <p style={styles.metricValue}>{c.value}</p>
            <p style={styles.metricLabel}>{c.label}</p>
          </div>
        ))}
      </div>
      <div style={{ ...styles.card, marginTop: 16 }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 600 }}>Trust Score Distribution</h3>
        <TrustChart dist={metrics.trustScoreDistribution} />
      </div>
    </div>
  );
}

// ---------- Users Tab ----------

function UsersTab() {
  const [data, setData] = useState<Paginated<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<User | null>(null);
  const { toast, showToast } = useToast();

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (role) params.set("role", role);
    if (status) params.set("status", status);
    params.set("page", String(page));
    params.set("limit", "10");
    apiFetch(`/users?${params}`).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [search, role, status, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleAction(userId: string, action: string) {
    try {
      const endpoint = action === "suspend" ? "suspend" : action === "reinstate" ? "reinstate" : "ban";
      await apiFetch(`/users/${userId}/${endpoint}`, { method: "PATCH" });
      showToast(`User ${action}d successfully`);
      fetchUsers();
    } catch (e: any) { showToast(e.message, "#f87171"); }
  }

  async function viewDetail(userId: string) {
    try {
      const u = await apiFetch(`/users/${userId}`);
      setDetail(u);
    } catch (e: any) { showToast(e.message, "#f87171"); }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <input style={{ ...styles.input, maxWidth: 220 }} placeholder="Search name or email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select style={{ ...styles.select, maxWidth: 140 }} value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          <option value="CLIENT">Client</option>
          <option value="FREELANCER">Freelancer</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select style={{ ...styles.select, maxWidth: 140 }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {loading ? <Spinner /> : data ? (
        <>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th><th style={styles.th}>Role</th><th style={styles.th}>Status</th>
                <th style={styles.th}>Trust</th><th style={styles.th}>Joined</th><th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((u) => (
                <tr key={u.id}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 600 }}>{u.fullName}</div>
                    <div style={{ fontSize: 11, color: "#8892b0" }}>{u.email}</div>
                  </td>
                  <td style={styles.td}><span style={styles.badge(u.role === "ADMIN" ? "#a78bfa" : u.role === "FREELANCER" ? "#22d3ee" : "#4a7cf7")}>{u.role}</span></td>
                  <td style={styles.td}><span style={styles.badge(u.status === "active" ? "#4ade80" : u.status === "suspended" ? "#facc15" : "#f87171")}>{u.status}</span></td>
                  <td style={styles.td}><span style={{ color: u.trustScore >= 70 ? "#4ade80" : u.trustScore >= 40 ? "#facc15" : "#f87171", fontWeight: 600 }}>{u.trustScore}</span></td>
                  <td style={styles.td}>{formatDate(u.joinedAt)}</td>
                  <td style={styles.td}>
                    <button style={styles.button("#4a7cf7")} onClick={() => viewDetail(u.id)}>View</button>
                    {u.status === "active" && <button style={styles.button("#facc15")} onClick={() => handleAction(u.id, "suspend")}>Suspend</button>}
                    {u.status === "suspended" && <button style={styles.button("#4ade80")} onClick={() => handleAction(u.id, "reinstate")}>Reinstate</button>}
                    {u.status !== "banned" && <button style={styles.button("#f87171")} onClick={() => handleAction(u.id, "ban")}>Ban</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
          <p style={{ color: "#8892b0", fontSize: 12, marginTop: 8 }}>Showing {data.items.length} of {data.total} users</p>
        </>
      ) : null}

      {detail && (
        <div style={styles.modalOverlay} onClick={() => setDetail(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>{detail.fullName}</h3>
              <button onClick={() => setDetail(null)} style={{ ...styles.button("transparent"), color: "#8892b0", fontSize: 18 }}>✕</button>
            </div>
            <div style={{ display: "grid", gap: 8, fontSize: 14 }}>
              <div><strong>Email:</strong> {detail.email}</div>
              <div><strong>Role:</strong> {detail.role}</div>
              <div><strong>Status:</strong> {detail.status}</div>
              <div><strong>Verified:</strong> {detail.isVerified ? "Yes" : "No"}</div>
              <div><strong>Trust Score:</strong> {detail.trustScore}</div>
              <div><strong>Completed Jobs:</strong> {detail.completedJobs}</div>
              <div><strong>Disputes Won:</strong> {detail.disputesWon}</div>
              <div><strong>Earnings:</strong> ${detail.totalEarnings.toFixed(2)}</div>
              <div><strong>Joined:</strong> {formatDate(detail.joinedAt)}</div>
              <div><strong>Last Active:</strong> {formatDate(detail.lastActive)}</div>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={{ ...styles.toast, background: toast.color }}>{toast.text}</div>}
    </div>
  );
}

// ---------- Moderation Tab ----------

function ModerationTab() {
  const [data, setData] = useState<Paginated<FlaggedJob> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { toast, showToast } = useToast();

  const fetchJobs = useCallback(() => {
    setLoading(true);
    apiFetch(`/jobs/flagged?page=${page}&limit=10`).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  async function handleAction(jobId: string, action: string) {
    try {
      const endpoint = action === "approve" ? "approve" : action === "reject" ? "reject" : "escalate";
      await apiFetch(`/jobs/${jobId}/${endpoint}`, { method: "POST", body: JSON.stringify({ reason: "Admin action" }) });
      showToast(`Job ${action}d successfully`);
      fetchJobs();
    } catch (e: any) { showToast(e.message, "#f87171"); }
  }

  return (
    <div>
      {loading ? <Spinner /> : data ? (
        <>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Job Title</th><th style={styles.th}>Budget</th><th style={styles.th}>Flag Reason</th>
                <th style={styles.th}>Flags</th><th style={styles.th}>Status</th><th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((j) => (
                <tr key={j.id}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 600 }}>{j.title}</div>
                    <div style={{ fontSize: 11, color: "#8892b0" }}>by {j.clientName}</div>
                  </td>
                  <td style={styles.td}>${j.budget.toFixed(2)}</td>
                  <td style={styles.td}><span style={{ color: "#fb923c" }}>{j.flagReason}</span></td>
                  <td style={styles.td}><span style={{ fontWeight: 600, color: j.flagCount >= 3 ? "#f87171" : "#facc15" }}>{j.flagCount}</span></td>
                  <td style={styles.td}><span style={styles.badge(j.status === "pending" ? "#facc15" : j.status === "under_review" ? "#4a7cf7" : j.status === "approved" ? "#4ade80" : j.status === "rejected" ? "#f87171" : "#fb923c")}>{j.status}</span></td>
                  <td style={styles.td}>
                    {j.status !== "approved" && <button style={styles.button("#4ade80")} onClick={() => handleAction(j.id, "approve")}>Approve</button>}
                    {j.status !== "rejected" && <button style={styles.button("#f87171")} onClick={() => handleAction(j.id, "reject")}>Reject</button>}
                    {j.status !== "escalated" && <button style={styles.button("#fb923c")} onClick={() => handleAction(j.id, "escalate")}>Escalate</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      ) : null}
      {toast && <div style={{ ...styles.toast, background: toast.color }}>{toast.text}</div>}
    </div>
  );
}

// ---------- Disputes Tab ----------

function DisputesTab() {
  const [data, setData] = useState<Paginated<Dispute> | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Dispute | null>(null);
  const [ruling, setRuling] = useState("");
  const { toast, showToast } = useToast();

  const fetchDisputes = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    params.set("page", String(page));
    params.set("limit", "10");
    apiFetch(`/disputes?${params}`).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [statusFilter, page]);

  useEffect(() => { fetchDisputes(); }, [fetchDisputes]);

  async function viewDetail(disputeId: string) {
    try {
      const d = await apiFetch(`/disputes/${disputeId}`);
      setDetail(d);
      setRuling("");
    } catch (e: any) { showToast(e.message, "#f87171"); }
  }

  async function submitRuling() {
    if (!detail || !ruling.trim()) return;
    try {
      await apiFetch(`/disputes/${detail.id}/rule`, { method: "PATCH", body: JSON.stringify({ resolution: ruling }) });
      showToast("Dispute resolved");
      setDetail(null);
      fetchDisputes();
    } catch (e: any) { showToast(e.message, "#f87171"); }
  }

  const statusBadge = (s: string) => {
    const m: Record<string, string> = { OPEN: "#facc15", UNDER_REVIEW: "#4a7cf7", RESOLVED: "#4ade80", CLOSED: "#8892b0" };
    return <span style={styles.badge(m[s] || "#8892b0")}>{s}</span>;
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <select style={{ ...styles.select, maxWidth: 180 }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {loading ? <Spinner /> : data ? (
        <>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Dispute</th><th style={styles.th}>Job</th><th style={styles.th}>Filed By</th>
                <th style={styles.th}>Status</th><th style={styles.th}>Created</th><th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((d) => (
                <tr key={d.id}>
                  <td style={styles.td}><span style={{ fontWeight: 600, color: "#fb923c" }}>{d.reason}</span></td>
                  <td style={styles.td}>{d.jobTitle}</td>
                  <td style={styles.td}>{d.userName}</td>
                  <td style={styles.td}>{statusBadge(d.status)}</td>
                  <td style={styles.td}>{formatDate(d.createdAt)}</td>
                  <td style={styles.td}>
                    <button style={styles.button("#4a7cf7")} onClick={() => viewDetail(d.id)}>Review</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      ) : null}

      {detail && (
        <div style={styles.modalOverlay} onClick={() => setDetail(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Dispute: {detail.reason}</h3>
              <button onClick={() => setDetail(null)} style={{ ...styles.button("transparent"), color: "#8892b0", fontSize: 18 }}>✕</button>
            </div>
            <div style={{ display: "grid", gap: 8, fontSize: 14, marginBottom: 16 }}>
              <div><strong>Job:</strong> {detail.jobTitle} ({detail.jobId})</div>
              <div><strong>Filed by:</strong> {detail.userName}</div>
              <div><strong>Status:</strong> {statusBadge(detail.status)}</div>
              <div><strong>Description:</strong> {detail.description}</div>
              {detail.resolution && <div><strong>Resolution:</strong> <span style={{ color: "#4ade80" }}>{detail.resolution}</span></div>}
              <div><strong>Created:</strong> {formatDate(detail.createdAt)}</div>
            </div>
            {detail.messages && detail.messages.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <strong style={{ fontSize: 13, color: "#8892b0" }}>Messages</strong>
                {detail.messages.map((m, i) => (
                  <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #1e2a4a", fontSize: 13 }}>
                    <span style={{ fontWeight: 600 }}>{m.from}:</span> {m.body}
                    <div style={{ fontSize: 11, color: "#8892b0" }}>{formatDate(m.at)}</div>
                  </div>
                ))}
              </div>
            )}
            {detail.status === "OPEN" || detail.status === "UNDER_REVIEW" ? (
              <div>
                <textarea
                  style={{ ...styles.input, minHeight: 80, marginBottom: 12 }}
                  placeholder="Write your ruling..."
                  value={ruling}
                  onChange={(e) => setRuling(e.target.value)}
                />
                <button style={styles.button("#4ade80")} onClick={submitRuling}>Submit Ruling</button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {toast && <div style={{ ...styles.toast, background: toast.color }}>{toast.text}</div>}
    </div>
  );
}

// ---------- Controls Tab ----------

function ControlsTab() {
  const [controls, setControls] = useState<PlatformControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const { toast, showToast } = useToast();

  const fetchControls = useCallback(() => {
    setLoading(true);
    apiFetch("/platform-controls").then(setControls).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchControls(); }, [fetchControls]);

  async function save(key: string) {
    try {
      await apiFetch(`/platform-controls/${key}`, { method: "PATCH", body: JSON.stringify({ value: editValue }) });
      showToast("Setting updated");
      setEditing(null);
      fetchControls();
    } catch (e: any) { showToast(e.message, "#f87171"); }
  }

  return (
    <div>
      {loading ? <Spinner /> : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Key</th><th style={styles.th}>Description</th><th style={styles.th}>Value</th><th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {controls.map((c) => (
              <tr key={c.key}>
                <td style={{ ...styles.td, fontFamily: "monospace", fontSize: 12 }}>{c.key}</td>
                <td style={{ ...styles.td, color: "#8892b0", fontSize: 13 }}>{c.description}</td>
                <td style={styles.td}>
                  {editing === c.key ? (
                    <input style={{ ...styles.input, maxWidth: 160 }} value={editValue} onChange={(e) => setEditValue(e.target.value)} autoFocus />
                  ) : (
                    <code style={{ background: "#0b1020", padding: "3px 8px", borderRadius: 4, fontSize: 13 }}>{c.value}</code>
                  )}
                </td>
                <td style={styles.td}>
                  {editing === c.key ? (
                    <>
                      <button style={styles.button("#4ade80")} onClick={() => save(c.key)}>Save</button>
                      <button style={styles.button("transparent")} onClick={() => setEditing(null)}>Cancel</button>
                    </>
                  ) : (
                    <button style={styles.button("#4a7cf7")} onClick={() => { setEditing(c.key); setEditValue(c.value); }}>Edit</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {toast && <div style={{ ...styles.toast, background: toast.color }}>{toast.text}</div>}
    </div>
  );
}

// ---------- Audit Log Tab ----------

function AuditLogTab() {
  const [data, setData] = useState<Paginated<AuditLogEntry> | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (action) params.set("action", action);
    if (entityType) params.set("entityType", entityType);
    params.set("page", String(page));
    params.set("limit", "15");
    apiFetch(`/audit-log?${params}`).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [action, entityType, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <select style={{ ...styles.select, maxWidth: 180 }} value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
          <option value="">All Actions</option>
          <option value="user.suspend">user.suspend</option>
          <option value="user.reinstate">user.reinstate</option>
          <option value="user.ban">user.ban</option>
          <option value="job.approve">job.approve</option>
          <option value="job.reject">job.reject</option>
          <option value="job.escalate">job.escalate</option>
          <option value="dispute.resolve">dispute.resolve</option>
          <option value="config.update">config.update</option>
          <option value="user.login">user.login</option>
          <option value="payment.process">payment.process</option>
          <option value="content.flag">content.flag</option>
        </select>
        <select style={{ ...styles.select, maxWidth: 160 }} value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1); }}>
          <option value="">All Entities</option>
          <option value="user">user</option>
          <option value="job">job</option>
          <option value="dispute">dispute</option>
          <option value="config">config</option>
          <option value="payment">payment</option>
          <option value="report">report</option>
        </select>
      </div>

      {loading ? <Spinner /> : data ? (
        <>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Action</th><th style={styles.th}>Entity</th><th style={styles.th}>Entity ID</th>
                <th style={styles.th}>Performed By</th><th style={styles.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((l) => (
                <tr key={l.id}>
                  <td style={styles.td}><code style={{ fontSize: 12, background: "#0b1020", padding: "2px 6px", borderRadius: 4 }}>{l.action}</code></td>
                  <td style={styles.td}><span style={styles.badge("#4a7cf7")}>{l.entityType}</span></td>
                  <td style={{ ...styles.td, fontFamily: "monospace", fontSize: 12 }}>{l.entityId}</td>
                  <td style={styles.td}>{l.performedBy}</td>
                  <td style={{ ...styles.td, fontSize: 12, color: "#8892b0" }}>{formatDate(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
          <p style={{ color: "#8892b0", fontSize: 12, marginTop: 8 }}>Showing {data.items.length} of {data.total} audit log entries</p>
        </>
      ) : null}
    </div>
  );
}

// ---------- Main Page ----------

export default function AdminPanelPage() {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <div>
      <div style={styles.tabBar}>
        {TABS.map((t) => (
          <button key={t.key} style={styles.tab(tab === t.key)} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {tab === "dashboard" && <DashboardTab />}
      {tab === "users" && <UsersTab />}
      {tab === "moderation" && <ModerationTab />}
      {tab === "disputes" && <DisputesTab />}
      {tab === "controls" && <ControlsTab />}
      {tab === "audit" && <AuditLogTab />}
    </div>
  );
}
