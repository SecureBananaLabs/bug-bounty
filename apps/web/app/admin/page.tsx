"use client";
import { useState, useEffect, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

type Tab = "metrics" | "users" | "jobs" | "disputes" | "settings" | "audit";

const TABS: { id: Tab; label: string }[] = [
  { id: "metrics", label: "Dashboard" },
  { id: "users", label: "Users" },
  { id: "jobs", label: "Flagged Jobs" },
  { id: "disputes", label: "Disputes" },
  { id: "settings", label: "Platform" },
  { id: "audit", label: "Audit Log" },
];

function useAdminFetch<T>(url: string, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (r.status === 401 || r.status === 403) {
        setError("Access denied — admin role required.");
        return;
      }
      const json = await r.json();
      setData(json.data ?? json);
    } catch {
      setError("Network error — could not reach API.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, token, ...deps]);

  useEffect(() => { refetch(); }, [refetch]);
  return { data, loading, error, refetch };
}

function StatusBadge({ status }: { status: string }) {
  const colours: Record<string, string> = {
    ACTIVE: "#16a34a", SUSPENDED: "#d97706", BANNED: "#dc2626",
    open: "#2563eb", under_review: "#d97706", resolved: "#16a34a",
    pending: "#6b7280", approved: "#16a34a", rejected: "#dc2626", escalated: "#9333ea",
  };
  return (
    <span style={{ background: colours[status] ?? "#6b7280", color: "#fff", padding: "2px 8px", borderRadius: 4, fontSize: 12 }}>
      {status}
    </span>
  );
}

function Card({ title, value, sub }: { title: string; value: string | number; sub?: string }) {
  return (
    <div className="card" style={{ minWidth: 140, flex: "1 1 140px" }}>
      <div style={{ fontSize: 13, color: "#6b7280" }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700, margin: "4px 0" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#9ca3af" }}>{sub}</div>}
    </div>
  );
}

function LoadingRow() {
  return <tr><td colSpan={99} style={{ textAlign: "center", padding: 32, color: "#9ca3af" }}>Loading…</td></tr>;
}
function ErrorRow({ msg }: { msg: string }) {
  return <tr><td colSpan={99} style={{ textAlign: "center", padding: 32, color: "#dc2626" }}>{msg}</td></tr>;
}
function EmptyRow({ msg }: { msg: string }) {
  return <tr><td colSpan={99} style={{ textAlign: "center", padding: 32, color: "#6b7280" }}>{msg}</td></tr>;
}

// ── Metrics ───────────────────────────────────────────────────────────────
function MetricsTab() {
  const { data, loading, error, refetch } = useAdminFetch<{
    totalUsers: number; activeJobs: number; openDisputes: number;
    flaggedListings: number; revenue: { current: number; currency: string };
    trustDistribution: { high: number; medium: number; low: number };
  }>(`${API}/admin/metrics`);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Platform Overview</h3>
        <button className="card" style={{ padding: "4px 12px", cursor: "pointer" }} onClick={refetch} aria-label="Refresh metrics">
          ↻ Refresh
        </button>
      </div>
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}
      {loading && <p>Loading…</p>}
      {data && (
        <>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
            <Card title="Total Users" value={data.totalUsers.toLocaleString()} />
            <Card title="Active Jobs" value={data.activeJobs} />
            <Card title="Open Disputes" value={data.openDisputes} />
            <Card title="Flagged Listings" value={data.flaggedListings} />
            <Card title="Revenue MTD" value={`$${data.revenue.current.toLocaleString()}`} sub={data.revenue.currency} />
          </div>
          <div className="card">
            <h4 style={{ margin: "0 0 12px" }}>Trust Score Distribution</h4>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 80 }}>
              {[["High", data.trustDistribution.high, "#16a34a"],
                ["Medium", data.trustDistribution.medium, "#d97706"],
                ["Low", data.trustDistribution.low, "#dc2626"]].map(([label, pct, color]) => (
                <div key={label as string} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: "100%", background: color as string, height: `${pct}%`, borderRadius: 4, minHeight: 4 }} role="img" aria-label={`${label}: ${pct}%`} />
                  <span style={{ fontSize: 11, color: "#6b7280" }}>{label} {pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Users ─────────────────────────────────────────────────────────────────
function UsersTab() {
  const [filters, setFilters] = useState({ role: "", status: "", search: "" });
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState<{ userId: string; action: string } | null>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

  const url = `${API}/admin/users?page=${page}&role=${filters.role}&status=${filters.status}&search=${filters.search}`;
  const { data, loading, error, refetch } = useAdminFetch<{ data: unknown[]; total: number }>(url, [page, filters]);

  async function handleAction(userId: string, status: string) {
    setConfirm(null);
    await fetch(`${API}/admin/users/${userId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, reason: "Admin action" }),
    });
    refetch();
  }

  const users = (data as { data: Record<string, unknown>[] } | null)?.data ?? [];
  const total = (data as { total: number } | null)?.total ?? 0;

  return (
    <div>
      {confirm && (
        <div role="dialog" aria-modal="true" aria-label="Confirm action" style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50 }}>
          <div className="card" style={{ maxWidth:380,width:"90%" }}>
            <h4>Confirm: {confirm.action} user?</h4>
            <p style={{ color:"#6b7280",fontSize:14 }}>This action will be logged in the audit trail.</p>
            <div style={{ display:"flex",gap:8,justifyContent:"flex-end",marginTop:16 }}>
              <button onClick={() => setConfirm(null)} aria-label="Cancel">Cancel</button>
              <button onClick={() => handleAction(confirm.userId, confirm.action)} style={{ background:"#dc2626",color:"#fff",border:"none",padding:"6px 16px",borderRadius:4,cursor:"pointer" }} aria-label={`Confirm ${confirm.action}`}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{ display:"flex",gap:8,marginBottom:16,flexWrap:"wrap" }}>
        <input placeholder="Search name or email…" value={filters.search} onChange={e=>setFilters(f=>({...f,search:e.target.value}))} style={{ padding:"6px 10px",border:"1px solid #e5e7eb",borderRadius:4,flex:"1 1 180px" }} aria-label="Search users" />
        <select value={filters.role} onChange={e=>setFilters(f=>({...f,role:e.target.value}))} aria-label="Filter by role">
          <option value="">All roles</option><option>CLIENT</option><option>FREELANCER</option><option>ADMIN</option>
        </select>
        <select value={filters.status} onChange={e=>setFilters(f=>({...f,status:e.target.value}))} aria-label="Filter by status">
          <option value="">All statuses</option><option>ACTIVE</option><option>SUSPENDED</option><option>BANNED</option>
        </select>
      </div>
      {error && <p style={{ color:"#dc2626" }}>{error}</p>}
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%",borderCollapse:"collapse",fontSize:14 }}>
          <thead>
            <tr style={{ borderBottom:"2px solid #e5e7eb" }}>
              {["Name","Email","Role","Status","Joined","Jobs","Disputes","Actions"].map(h=>(
                <th key={h} style={{ padding:"8px 12px",textAlign:"left",color:"#374151" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <LoadingRow />}
            {!loading && error && <ErrorRow msg={error} />}
            {!loading && !error && users.length === 0 && <EmptyRow msg="No users found." />}
            {users.map((u: Record<string, unknown>) => (
              <tr key={u.id as string} style={{ borderBottom:"1px solid #f3f4f6" }}>
                <td style={{ padding:"8px 12px",fontWeight:500 }}>{u.fullName as string}</td>
                <td style={{ padding:"8px 12px",color:"#6b7280" }}>{u.email as string}</td>
                <td style={{ padding:"8px 12px" }}>{u.role as string}</td>
                <td style={{ padding:"8px 12px" }}><StatusBadge status={u.status as string} /></td>
                <td style={{ padding:"8px 12px",color:"#6b7280" }}>{String(u.createdAt).slice(0,10)}</td>
                <td style={{ padding:"8px 12px" }}>{u.activeJobs as number}</td>
                <td style={{ padding:"8px 12px" }}>{u.disputes as number}</td>
                <td style={{ padding:"8px 12px" }}>
                  <div style={{ display:"flex",gap:4 }}>
                    {u.status !== "SUSPENDED" && <button onClick={()=>setConfirm({userId:u.id as string,action:"SUSPENDED"})} style={{ fontSize:12,padding:"2px 8px",cursor:"pointer" }} aria-label={`Suspend ${u.fullName}`}>Suspend</button>}
                    {u.status !== "ACTIVE" && <button onClick={()=>setConfirm({userId:u.id as string,action:"ACTIVE"})} style={{ fontSize:12,padding:"2px 8px",cursor:"pointer" }} aria-label={`Reinstate ${u.fullName}`}>Reinstate</button>}
                    {u.status !== "BANNED" && <button onClick={()=>setConfirm({userId:u.id as string,action:"BANNED"})} style={{ fontSize:12,padding:"2px 8px",background:"#dc2626",color:"#fff",border:"none",borderRadius:4,cursor:"pointer" }} aria-label={`Ban ${u.fullName}`}>Ban</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display:"flex",gap:8,justifyContent:"center",marginTop:12,alignItems:"center" }}>
        <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} aria-label="Previous page">← Prev</button>
        <span style={{ fontSize:14,color:"#6b7280" }}>Page {page} · {total} total</span>
        <button onClick={()=>setPage(p=>p+1)} disabled={users.length < 20} aria-label="Next page">Next →</button>
      </div>
    </div>
  );
}

// ── Flagged Jobs ──────────────────────────────────────────────────────────
function JobsTab() {
  const [page, setPage] = useState(1);
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  const { data, loading, error, refetch } = useAdminFetch<{ data: unknown[]; total: number }>(`${API}/admin/jobs/flagged?page=${page}`, [page]);
  const jobs = (data as { data: Record<string, unknown>[] } | null)?.data ?? [];
  const total = (data as { total: number } | null)?.total ?? 0;

  async function moderate(id: string, action: string) {
    const reason = window.prompt(`Reason for ${action}:`);
    if (reason === null) return;
    await fetch(`${API}/admin/jobs/${id}/moderate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, reason }),
    });
    refetch();
  }

  return (
    <div>
      <h3>Flagged Listings</h3>
      {error && <p style={{ color:"#dc2626" }}>{error}</p>}
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%",borderCollapse:"collapse",fontSize:14 }}>
          <thead>
            <tr style={{ borderBottom:"2px solid #e5e7eb" }}>
              {["Title","Client","Reason","Flagged","Status","Actions"].map(h=>(
                <th key={h} style={{ padding:"8px 12px",textAlign:"left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <LoadingRow />}
            {!loading && error && <ErrorRow msg={error} />}
            {!loading && !error && jobs.length === 0 && <EmptyRow msg="No flagged jobs." />}
            {jobs.map((j: Record<string, unknown>) => (
              <tr key={j.id as string} style={{ borderBottom:"1px solid #f3f4f6" }}>
                <td style={{ padding:"8px 12px",fontWeight:500 }}>{j.title as string}</td>
                <td style={{ padding:"8px 12px" }}>{j.client as string}</td>
                <td style={{ padding:"8px 12px",color:"#6b7280" }}>{j.reason as string}</td>
                <td style={{ padding:"8px 12px",color:"#6b7280" }}>{String(j.flaggedAt).slice(0,10)}</td>
                <td style={{ padding:"8px 12px" }}><StatusBadge status={j.status as string} /></td>
                <td style={{ padding:"8px 12px" }}>
                  <div style={{ display:"flex",gap:4 }}>
                    <button onClick={()=>moderate(j.id as string,"approved")} style={{ fontSize:12,padding:"2px 8px",background:"#16a34a",color:"#fff",border:"none",borderRadius:4,cursor:"pointer" }} aria-label={`Approve job ${j.id}`}>Approve</button>
                    <button onClick={()=>moderate(j.id as string,"rejected")} style={{ fontSize:12,padding:"2px 8px",background:"#dc2626",color:"#fff",border:"none",borderRadius:4,cursor:"pointer" }} aria-label={`Reject job ${j.id}`}>Reject</button>
                    <button onClick={()=>moderate(j.id as string,"escalated")} style={{ fontSize:12,padding:"2px 8px",cursor:"pointer" }} aria-label={`Escalate job ${j.id}`}>Escalate</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display:"flex",gap:8,justifyContent:"center",marginTop:12 }}>
        <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} aria-label="Previous page">← Prev</button>
        <span style={{ fontSize:14,color:"#6b7280" }}>Page {page} · {total} total</span>
        <button onClick={()=>setPage(p=>p+1)} disabled={jobs.length<20} aria-label="Next page">Next →</button>
      </div>
    </div>
  );
}

// ── Disputes ──────────────────────────────────────────────────────────────
function DisputesTab() {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  const { data, loading, error, refetch } = useAdminFetch<{ data: unknown[]; total: number }>(`${API}/admin/disputes?page=${page}&status=${statusFilter}`, [page, statusFilter]);
  const disputes = (data as { data: Record<string, unknown>[] } | null)?.data ?? [];
  const total = (data as { total: number } | null)?.total ?? 0;

  async function resolve(id: string, ruling: string) {
    const reason = window.prompt(`Ruling reason:`);
    if (reason === null) return;
    await fetch(`${API}/admin/disputes/${id}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ruling, reason }),
    });
    refetch();
  }

  return (
    <div>
      <div style={{ display:"flex",gap:8,marginBottom:16,alignItems:"center" }}>
        <h3 style={{ margin:0 }}>Dispute Queue</h3>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} aria-label="Filter by dispute status">
          <option value="">All</option><option value="open">Open</option><option value="under_review">Under Review</option><option value="resolved">Resolved</option>
        </select>
      </div>
      {error && <p style={{ color:"#dc2626" }}>{error}</p>}
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%",borderCollapse:"collapse",fontSize:14 }}>
          <thead>
            <tr style={{ borderBottom:"2px solid #e5e7eb" }}>
              {["Title","Client","Freelancer","Amount","Status","Evidence","Actions"].map(h=>(
                <th key={h} style={{ padding:"8px 12px",textAlign:"left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <LoadingRow />}
            {!loading && error && <ErrorRow msg={error} />}
            {!loading && !error && disputes.length === 0 && <EmptyRow msg="No disputes." />}
            {disputes.map((d: Record<string, unknown>) => (
              <tr key={d.id as string} style={{ borderBottom:"1px solid #f3f4f6" }}>
                <td style={{ padding:"8px 12px",fontWeight:500 }}>{d.title as string}</td>
                <td style={{ padding:"8px 12px" }}>{d.client as string}</td>
                <td style={{ padding:"8px 12px" }}>{d.freelancer as string}</td>
                <td style={{ padding:"8px 12px" }}>${d.amount as number}</td>
                <td style={{ padding:"8px 12px" }}><StatusBadge status={d.status as string} /></td>
                <td style={{ padding:"8px 12px",color:"#6b7280" }}>{d.evidence as string}</td>
                <td style={{ padding:"8px 12px" }}>
                  {d.status !== "resolved" && (
                    <div style={{ display:"flex",gap:4" }}>
                      <button onClick={()=>resolve(d.id as string,"client")} style={{ fontSize:12,padding:"2px 8px",cursor:"pointer" }} aria-label="Rule for client">Client wins</button>
                      <button onClick={()=>resolve(d.id as string,"freelancer")} style={{ fontSize:12,padding:"2px 8px",cursor:"pointer" }} aria-label="Rule for freelancer">Freelancer wins</button>
                      <button onClick={()=>resolve(d.id as string,"escalate")} style={{ fontSize:12,padding:"2px 8px",cursor:"pointer" }} aria-label="Escalate dispute">Escalate</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display:"flex",gap:8,justifyContent:"center",marginTop:12 }}>
        <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} aria-label="Previous page">← Prev</button>
        <span style={{ fontSize:14,color:"#6b7280" }}>Page {page} · {total} total</span>
        <button onClick={()=>setPage(p=>p+1)} disabled={disputes.length<20} aria-label="Next page">Next →</button>
      </div>
    </div>
  );
}

// ── Platform Settings ─────────────────────────────────────────────────────
function SettingsTab() {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  const { data, loading, error, refetch } = useAdminFetch<{ key: string; value: string }[]>(`${API}/admin/settings`);
  const settings = Array.isArray(data) ? data : [];

  async function toggle(key: string, current: string) {
    const newVal = current === "true" ? "false" : "true";
    const label = key.replace(/_/g," ");
    if (!window.confirm(`${newVal === "false" ? "Disable" : "Enable"} ${label}? This will be logged.`)) return;
    await fetch(`${API}/admin/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ key, value: newVal }),
    });
    refetch();
  }

  const labels: Record<string, string> = {
    registrations_enabled: "New User Registrations",
    job_posting_enabled: "New Job Postings",
  };

  return (
    <div>
      <h3>Platform Controls</h3>
      {error && <p style={{ color:"#dc2626" }}>{error}</p>}
      {loading && <p>Loading…</p>}
      {settings.length === 0 && !loading && <p style={{ color:"#6b7280" }}>No settings found.</p>}
      <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
        {settings.map(s => (
          <div key={s.key} className="card" style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <div>
              <div style={{ fontWeight:500 }}>{labels[s.key] ?? s.key}</div>
              <div style={{ fontSize:13,color:"#6b7280" }}>Currently: <strong>{s.value === "true" ? "Enabled" : "Disabled"}</strong></div>
            </div>
            <button
              onClick={() => toggle(s.key, s.value)}
              aria-label={`Toggle ${labels[s.key] ?? s.key}`}
              style={{ padding:"8px 20px", background: s.value === "true" ? "#16a34a" : "#dc2626", color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600 }}
            >
              {s.value === "true" ? "Enabled" : "Disabled"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Audit Log ─────────────────────────────────────────────────────────────
function AuditTab() {
  const [filters, setFilters] = useState({ action: "", from: "", to: "" });
  const [page, setPage] = useState(1);
  const url = `${API}/admin/audit-log?page=${page}&action=${filters.action}&from=${filters.from}&to=${filters.to}`;
  const { data, loading, error } = useAdminFetch<{ data: unknown[]; total: number }>(url, [page, filters]);
  const logs = (data as { data: Record<string, unknown>[] } | null)?.data ?? [];
  const total = (data as { total: number } | null)?.total ?? 0;

  return (
    <div>
      <div style={{ display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center" }}>
        <h3 style={{ margin:0 }}>Audit Log</h3>
        <input placeholder="Filter by action…" value={filters.action} onChange={e=>setFilters(f=>({...f,action:e.target.value}))} style={{ padding:"4px 8px",border:"1px solid #e5e7eb",borderRadius:4 }} aria-label="Filter by action" />
        <input type="date" value={filters.from} onChange={e=>setFilters(f=>({...f,from:e.target.value}))} aria-label="From date" />
        <input type="date" value={filters.to} onChange={e=>setFilters(f=>({...f,to:e.target.value}))} aria-label="To date" />
      </div>
      {error && <p style={{ color:"#dc2626" }}>{error}</p>}
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:"2px solid #e5e7eb" }}>
              {["Time","Admin","Action","Target","Details"].map(h=>(
                <th key={h} style={{ padding:"8px 12px",textAlign:"left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <LoadingRow />}
            {!loading && error && <ErrorRow msg={error} />}
            {!loading && !error && logs.length === 0 && <EmptyRow msg="No audit entries." />}
            {logs.map((l: Record<string, unknown>) => (
              <tr key={l.id as string} style={{ borderBottom:"1px solid #f3f4f6" }}>
                <td style={{ padding:"8px 12px",color:"#6b7280",whiteSpace:"nowrap" }}>{new Date(l.createdAt as string).toLocaleString()}</td>
                <td style={{ padding:"8px 12px" }}>{l.adminName as string}</td>
                <td style={{ padding:"8px 12px",fontFamily:"monospace",color:"#7c3aed" }}>{l.action as string}</td>
                <td style={{ padding:"8px 12px",color:"#6b7280" }}>{l.targetType as string}/{l.targetId as string}</td>
                <td style={{ padding:"8px 12px",color:"#6b7280",fontSize:12 }}>{l.metadata ? JSON.stringify(JSON.parse(l.metadata as string)) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display:"flex",gap:8,justifyContent:"center",marginTop:12 }}>
        <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} aria-label="Previous page">← Prev</button>
        <span style={{ fontSize:14,color:"#6b7280" }}>Page {page} · {total} total</span>
        <button onClick={()=>setPage(p=>p+1)} disabled={logs.length<50} aria-label="Next page">Next →</button>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────
export default function AdminPanelPage() {
  const [tab, setTab] = useState<Tab>("metrics");
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) { setAuthed(false); return; }
    fetch(`${API}/admin/metrics`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) return <div style={{ padding:32,color:"#6b7280" }}>Checking access…</div>;

  if (!authed) {
    return (
      <section className="card" role="alert" aria-live="assertive">
        <h2>Access Denied</h2>
        <p>This page requires an admin account. You are being redirected.</p>
        <p style={{ color:"#6b7280",fontSize:13 }}>If you believe this is an error, contact the platform administrator.</p>
        <a href="/" style={{ color:"#2563eb" }}>← Return to home</a>
      </section>
    );
  }

  return (
    <section>
      <h2 style={{ marginBottom:4 }}>Admin Panel</h2>
      <p style={{ color:"#6b7280",marginBottom:20,fontSize:14 }}>FreelanceFlow platform management — all actions are logged.</p>

      <nav aria-label="Admin panel sections" style={{ display:"flex",gap:4,marginBottom:24,flexWrap:"wrap",borderBottom:"2px solid #e5e7eb",paddingBottom:8 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            role="tab"
            style={{
              padding:"6px 16px", cursor:"pointer", border:"none", borderRadius:"4px 4px 0 0",
              background: tab === t.id ? "#2563eb" : "transparent",
              color: tab === t.id ? "#fff" : "#374151",
              fontWeight: tab === t.id ? 600 : 400,
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div id={`panel-${tab}`} role="tabpanel" aria-label={TABS.find(t=>t.id===tab)?.label}>
        {tab === "metrics"   && <MetricsTab />}
        {tab === "users"     && <UsersTab />}
        {tab === "jobs"      && <JobsTab />}
        {tab === "disputes"  && <DisputesTab />}
        {tab === "settings"  && <SettingsTab />}
        {tab === "audit"     && <AuditTab />}
      </div>
    </section>
  );
}
