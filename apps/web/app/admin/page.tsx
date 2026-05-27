"use client";

import { useState, useEffect, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

async function api(path, opts = {}) {
  const token = localStorage.getItem("admin_token");
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
    ...opts,
  });
  const body = await res.json();
  if (!body.success) throw new Error(body.message || "API error");
  return body.data;
}

const TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "users", label: "Users" },
  { key: "jobs", label: "Jobs" },
  { key: "disputes", label: "Disputes" },
  { key: "settings", label: "Settings" },
  { key: "audit", label: "Audit Log" },
];

const btn = {
  background: "#5468ff", color: "white", border: "none",
  borderRadius: 8, padding: "0.5rem 0.9rem", cursor: "pointer", fontSize: 13,
};
const btnSm = { ...btn, padding: "0.3rem 0.6rem", fontSize: 12 };
const btnDanger = { ...btn, background: "#dc3545" };
const btnSuccess = { ...btn, background: "#28a745" };
const btnWarn = { ...btn, background: "#ffc107", color: "#000" };

function MetricCard({ label, value }) {
  return (
    <div className="card" style={{ textAlign: "center" }}>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 13, color: "#8892b0" }}>{label}</div>
    </div>
  );
}

function Spinner() {
  return <div style={{ textAlign: "center", padding: 40, color: "#8892b0" }}>Loading...</div>;
}

export default function AdminPanelPage() {
  const [tab, setTab] = useState("dashboard");
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authErr, setAuthErr] = useState("");

  function handleLogin() {
    if (!token.trim()) { setAuthErr("Token required"); return; }
    localStorage.setItem("admin_token", token.trim());
    setAuthed(true);
    setAuthErr("");
  }

  function handleLogout() {
    localStorage.removeItem("admin_token");
    setAuthed(false);
    setToken("");
  }

  useEffect(() => {
    const stored = localStorage.getItem("admin_token");
    if (stored) { setToken(stored); setAuthed(true); }
  }, []);

  if (!authed) {
    return (
      <section className="card">
        <h2>Admin Login</h2>
        <p style={{ fontSize: 13, color: "#8892b0", marginBottom: 12 }}>
          Enter an admin JWT token to access the panel.
        </p>
        <input
          value={token}
          onChange={e => setToken(e.target.value)}
          placeholder="Bearer token..."
          style={{
            width: "100%", padding: "0.6rem", borderRadius: 8, border: "1px solid #2a3765",
            background: "#0b1020", color: "#f2f5ff", marginBottom: 8,
          }}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
        />
        {authErr && <p style={{ color: "#dc3545", fontSize: 13 }}>{authErr}</p>}
        <button onClick={handleLogin} style={btn}>Login</button>
      </section>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Admin Panel</h2>
        <button onClick={handleLogout} style={btnDanger}>Logout</button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              ...btn,
              background: tab === t.key ? "#5468ff" : "#1e2a4a",
              opacity: tab === t.key ? 1 : 0.7,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <Dashboard />}
      {tab === "users" && <UserManagement />}
      {tab === "jobs" && <JobModeration />}
      {tab === "disputes" && <DisputeResolution />}
      {tab === "settings" && <PlatformSettings />}
      {tab === "audit" && <AuditLogPage />}
    </div>
  );
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api("/admin/metrics"));
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <Spinner />;
  if (err) return <p style={{ color: "#dc3545" }}>{err}</p>;
  if (!data) return null;

  const cards = [
    { label: "Open Jobs", value: data.openJobs },
    { label: "Total Jobs", value: data.totalJobs },
    { label: "Active Freelancers", value: data.activeFreelancers },
    { label: "Total Users", value: data.totalUsers },
    { label: "Flagged Accounts", value: data.flaggedAccounts },
    { label: "Proposals", value: data.totalProposals },
    { label: "Reviews", value: data.totalReviews },
    { label: "Monthly Volume", value: `$${data.monthlyVolume?.toLocaleString()}` },
  ];

  return (
    <div>
      <div className="grid">
        {cards.map(c => <MetricCard key={c.label} {...c} />)}
      </div>
      <button onClick={fetch} style={btn}>Refresh</button>
    </div>
  );
}

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState(null);
  const PAGE_SIZE = 10;

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(page * PAGE_SIZE) });
      if (search) params.set("search", search);
      const data = await api(`/admin/users?${params}`);
      setUsers(data.users);
      setTotal(data.total);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetch(); }, [fetch]);

  async function action(id, op) {
    try {
      await api(`/admin/users/${id}/${op}`, { method: "PATCH", body: JSON.stringify({ reason: "Admin action" }) });
      fetch();
    } catch (e) { setErr(e.message); }
  }

  async function viewDetail(id) {
    try {
      setDetail(await api(`/admin/users/${id}`));
    } catch (e) { setErr(e.message); }
  }

  const isFlagged = (u) => u.flags?.suspended ? "Suspended" : u.flags?.banned ? "Banned" : "Active";

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search users..."
          style={{
            flex: 1, padding: "0.5rem", borderRadius: 8, border: "1px solid #2a3765",
            background: "#0b1020", color: "#f2f5ff",
          }}
        />
      </div>

      {err && <p style={{ color: "#dc3545", fontSize: 13 }}>{err}</p>}

      {detail && (
        <div className="card" style={{ marginBottom: 12 }}>
          <h3>User Detail: {detail.fullName || detail.id}</h3>
          <pre style={{ fontSize: 12, color: "#8892b0", whiteSpace: "pre-wrap" }}>
            {JSON.stringify(detail, null, 2)}
          </pre>
          <button onClick={() => setDetail(null)} style={btnSm}>Close</button>
        </div>
      )}

      {loading ? <Spinner /> : (
        <>
          <div style={{ fontSize: 13, color: "#8892b0", marginBottom: 8 }}>
            {total} user{total !== 1 ? "s" : ""}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "#8892b0", textAlign: "left" }}>
                <th style={th}>ID</th>
                <th style={th}>Name</th>
                <th style={th}>Email</th>
                <th style={th}>Role</th>
                <th style={th}>Status</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: "1px solid #2a3765" }}>
                  <td style={td}>{u.id.slice(0, 12)}</td>
                  <td style={td}>{u.fullName || "-"}</td>
                  <td style={td}>{u.email || "-"}</td>
                  <td style={td}>{u.role || "N/A"}</td>
                  <td style={td}>{isFlagged(u)}</td>
                  <td style={{ ...td, display: "flex", gap: 4, flexWrap: "wrap" }}>
                    <button onClick={() => viewDetail(u.id)} style={btnSm}>View</button>
                    {u.flags?.suspended ? (
                      <button onClick={() => action(u.id, "reinstate")} style={{ ...btnSm, ...btnSuccess }}>Reinstate</button>
                    ) : (
                      <button onClick={() => action(u.id, "suspend")} style={{ ...btnSm, ...btnWarn }}>Suspend</button>
                    )}
                    {!u.flags?.banned && (
                      <button onClick={() => action(u.id, "ban")} style={{ ...btnSm, ...btnDanger }}>Ban</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={btnSm}>Prev</button>
            <span style={{ fontSize: 13, color: "#8892b0" }}>Page {page + 1}</span>
            <button disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)} style={btnSm}>Next</button>
          </div>
        </>
      )}
    </div>
  );
}

function JobModeration() {
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api(`/admin/jobs/flagged?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`);
      setJobs(data.jobs);
      setTotal(data.total);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  async function moderate(id, action) {
    try {
      await api(`/admin/jobs/${id}/moderate`, {
        method: "PATCH",
        body: JSON.stringify({ action, reason: `Moderated: ${action}` }),
      });
      fetch();
    } catch (e) { setErr(e.message); }
  }

  return (
    <div>
      {err && <p style={{ color: "#dc3545", fontSize: 13 }}>{err}</p>}
      {loading ? <Spinner /> : (
        <>
          <div style={{ fontSize: 13, color: "#8892b0", marginBottom: 8 }}>
            {total} job{total !== 1 ? "s" : ""}
          </div>
          {jobs.length === 0 ? (
            <div className="card" style={{ textAlign: "center", color: "#8892b0" }}>No jobs to moderate</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ color: "#8892b0", textAlign: "left" }}>
                  <th style={th}>ID</th>
                  <th style={th}>Title</th>
                  <th style={th}>Status</th>
                  <th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(j => (
                  <tr key={j.id} style={{ borderBottom: "1px solid #2a3765" }}>
                    <td style={td}>{j.id.slice(0, 12)}</td>
                    <td style={td}>{j.title || "Untitled"}</td>
                    <td style={td}>{j.status}</td>
                    <td style={{ ...td, display: "flex", gap: 4 }}>
                      <button onClick={() => moderate(j.id, "approve")} style={{ ...btnSm, ...btnSuccess }}>Approve</button>
                      <button onClick={() => moderate(j.id, "flag")} style={{ ...btnSm, ...btnWarn }}>Flag</button>
                      <button onClick={() => moderate(j.id, "reject")} style={{ ...btnSm, ...btnDanger }}>Reject</button>
                      <button onClick={() => moderate(j.id, "escalate")} style={btnSm}>Escalate</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={btnSm}>Prev</button>
            <span style={{ fontSize: 13, color: "#8892b0" }}>Page {page + 1}</span>
            <button disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)} style={btnSm}>Next</button>
          </div>
        </>
      )}
    </div>
  );
}

function DisputeResolution() {
  const [disputes, setDisputes] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api("/admin/disputes");
      setDisputes(data.disputes);
      setTotal(data.total);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function resolve(id, ruling) {
    try {
      await api(`/admin/disputes/${id}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({ ruling, refund: ruling === "refund" }),
      });
      fetch();
    } catch (e) { setErr(e.message); }
  }

  return (
    <div>
      {err && <p style={{ color: "#dc3545", fontSize: 13 }}>{err}</p>}
      {loading ? <Spinner /> : (
        <>
          <div style={{ fontSize: 13, color: "#8892b0", marginBottom: 8 }}>
            {total} dispute{total !== 1 ? "s" : ""}
          </div>
          {disputes.length === 0 ? (
            <div className="card" style={{ textAlign: "center", color: "#8892b0" }}>No disputes</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ color: "#8892b0", textAlign: "left" }}>
                  <th style={th}>ID</th>
                  <th style={th}>Title</th>
                  <th style={th}>Status</th>
                  <th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {disputes.map(d => (
                  <tr key={d.id} style={{ borderBottom: "1px solid #2a3765" }}>
                    <td style={td}>{d.id.slice(0, 12)}</td>
                    <td style={td}>{d.title || "Untitled"}</td>
                    <td style={td}>{d.status}</td>
                    <td style={{ ...td, display: "flex", gap: 4 }}>
                      <button onClick={() => resolve(d.id, "freelancer")} style={{ ...btnSm, ...btnSuccess }}>Freelancer Wins</button>
                      <button onClick={() => resolve(d.id, "client")} style={{ ...btnSm, ...btnWarn }}>Client Wins</button>
                      <button onClick={() => resolve(d.id, "refund")} style={{ ...btnSm, ...btnDanger }}>Refund</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

function PlatformSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      setSettings(await api("/admin/settings"));
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function toggle(key) {
    try {
      const data = await api(`/admin/settings/${key}`, {
        method: "PATCH",
        body: JSON.stringify({ value: !settings[key] }),
      });
      setSettings(data.settings);
      setMsg(`Setting ${key} toggled`);
      setTimeout(() => setMsg(""), 2000);
    } catch (e) { setErr(e.message); }
  }

  if (loading) return <Spinner />;
  if (!settings) return <p style={{ color: "#dc3545" }}>{err}</p>;

  return (
    <div>
      {msg && <div style={{ background: "#28a745", color: "white", padding: "0.5rem", borderRadius: 8, marginBottom: 12 }}>{msg}</div>}
      {err && <p style={{ color: "#dc3545", fontSize: 13 }}>{err}</p>}
      <div className="grid">
        {Object.entries(settings).map(([key, value]) => (
          <div key={key} className="card">
            <h3 style={{ textTransform: "capitalize", margin: "0 0 8px" }}>{key.replace(/([A-Z])/g, " $1")}</h3>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: value ? "#28a745" : "#dc3545", fontWeight: 600 }}>
                {value ? "ON" : "OFF"}
              </span>
              <button onClick={() => toggle(key)} style={{ ...btn, ...(value ? btnDanger : btnSuccess) }}>
                {value ? "Disable" : "Enable"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditLogPage() {
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(page * PAGE_SIZE) });
      if (filter) params.set("action", filter);
      const data = await api(`/admin/audit-log?${params}`);
      setEntries(data.entries);
      setTotal(data.total);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, [page, filter]);

  const [err, setErr] = useState("");
  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <select
          value={filter}
          onChange={e => { setFilter(e.target.value); setPage(0); }}
          style={{
            padding: "0.4rem", borderRadius: 8, border: "1px solid #2a3765",
            background: "#0b1020", color: "#f2f5ff",
          }}
        >
          <option value="">All actions</option>
          <option value="user.suspend">Suspend</option>
          <option value="user.reinstate">Reinstate</option>
          <option value="user.ban">Ban</option>
          <option value="job.approve">Approve</option>
          <option value="job.reject">Reject</option>
          <option value="job.flag">Flag</option>
          <option value="job.escalate">Escalate</option>
          <option value="dispute.resolve">Resolve</option>
          <option value="settings.update">Settings</option>
        </select>
        <button onClick={fetch} style={btnSm}>Refresh</button>
      </div>

      {err && <p style={{ color: "#dc3545", fontSize: 13 }}>{err}</p>}
      {loading ? <Spinner /> : (
        <>
          <div style={{ fontSize: 13, color: "#8892b0", marginBottom: 8 }}>
            {total} entr{total !== 1 ? "ies" : "y"}
          </div>
          {entries.length === 0 ? (
            <div className="card" style={{ textAlign: "center", color: "#8892b0" }}>No audit entries</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ color: "#8892b0", textAlign: "left" }}>
                  <th style={th}>Action</th>
                  <th style={th}>Admin</th>
                  <th style={th}>Details</th>
                  <th style={th}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id} style={{ borderBottom: "1px solid #2a3765" }}>
                    <td style={td}>{e.action}</td>
                    <td style={td}>{e.adminId?.slice(0, 10)}</td>
                    <td style={{ ...td, maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {JSON.stringify(e.details)}
                    </td>
                    <td style={td}>{new Date(e.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={btnSm}>Prev</button>
            <span style={{ fontSize: 13, color: "#8892b0" }}>Page {page + 1}</span>
            <button disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)} style={btnSm}>Next</button>
          </div>
        </>
      )}
    </div>
  );
}

const th = { padding: "0.5rem", borderBottom: "2px solid #2a3765", fontWeight: 600 };
const td = { padding: "0.5rem", verticalAlign: "middle" };
