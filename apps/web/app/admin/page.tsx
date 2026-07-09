"use client";
import { useEffect, useState } from "react";

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluXzEiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODM2MTI2MTgsImV4cCI6MTc4MzY0ODYxOH0.i25stZq2pRWUIRKTscS5PJjSueX1-u7nnodxvEiK7Hs";

async function fetchApi(endpoint: string, method = "GET", body: any = null) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") || TOKEN : TOKEN;
  const res = await fetch(`http://localhost:4000/api/admin${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: body ? JSON.stringify(body) : null
  });
  if (res.status === 401 || res.status === 403) {
    if (typeof window !== "undefined") window.location.href = "/";
    throw new Error("Unauthorized");
  }
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

export default function AdminPanelPage() {
  const [tab, setTab] = useState("dashboard");
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    fetchApi("/metrics").then(() => setAuthorized(true)).catch(() => setAuthorized(false));
  }, []);

  if (authorized === null) return <div className="card">Loading...</div>;
  if (authorized === false) return <div className="card">Redirecting...</div>;

  return (
    <div>
      <h2>Admin Panel</h2>
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        {["dashboard", "users", "jobs", "disputes", "audit", "controls"].map(t => (
          <button key={t} aria-label={`${t} tab`} onClick={() => setTab(t)} style={{ padding: "8px 16px", background: tab === t ? "#2a3765" : "#151c35", color: "white", border: "1px solid #2a3765", borderRadius: "4px", cursor: "pointer" }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <section className="card">
        {tab === "dashboard" && <DashboardTab />}
        {tab === "users" && <UsersTab />}
        {tab === "jobs" && <JobsTab />}
        {tab === "disputes" && <DisputesTab />}
        {tab === "audit" && <AuditTab />}
        {tab === "controls" && <ControlsTab />}
      </section>
    </div>
  );
}

function DashboardTab() {
  const [data, setData] = useState<any>(null);
  
  const load = () => fetchApi("/metrics").then(setData);
  useEffect(() => { load(); }, []);

  if (!data) return <div>Loading...</div>;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>Trust & Metrics</h3>
        <button onClick={load} style={{ padding: "6px 12px", background: "#2a3765", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Refresh</button>
      </div>
      <div className="grid">
        <div className="card"><h4>Total Users</h4><p style={{ fontSize: "24px", margin: 0 }}>{data.totalUsers}</p></div>
        <div className="card"><h4>Active Jobs</h4><p style={{ fontSize: "24px", margin: 0 }}>{data.openJobs}</p></div>
        <div className="card"><h4>Open Disputes</h4><p style={{ fontSize: "24px", margin: 0 }}>{data.openDisputes}</p></div>
        <div className="card"><h4>Flagged Listings</h4><p style={{ fontSize: "24px", margin: 0 }}>{data.flaggedListings}</p></div>
        <div className="card"><h4>Revenue</h4><p style={{ fontSize: "24px", margin: 0 }}>${data.monthlyVolume}</p></div>
      </div>
      <div className="card">
        <h4>Trust Score Distribution</h4>
        <p>90-100: {data.trustScoreDist["90-100"]}</p>
        <p>70-89: {data.trustScoreDist["70-89"]}</p>
        <p>0-69: {data.trustScoreDist["0-69"]}</p>
      </div>
    </div>
  );
}

function UsersTab() {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = () => fetchApi(`/users?page=${page}&limit=10&search=${search}&role=${role}&status=${status}&dateFrom=${dateFrom}&dateTo=${dateTo}`).then(setData);
  useEffect(() => { load(); }, [page, search, role, status, dateFrom, dateTo]);

  const handleAction = async (id: string, action: string) => {
    await fetchApi(`/users/${id}/${action}`, "POST");
    load();
  };

  if (!data) return <div>Loading...</div>;
  return (
    <div>
      <h3>Users</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "1rem" }}>
        <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: "4px" }} />
        <select value={role} onChange={e => setRole(e.target.value)} style={{ padding: "4px" }}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="freelancer">Freelancer</option>
          <option value="client">Client</option>
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: "4px" }}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: "4px" }} title="Join Date From" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: "4px" }} title="Join Date To" />
      </div>
      <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
        <thead><tr><th>ID</th><th>Name</th><th>Role</th><th>Status</th><th>Join Date</th><th>Actions / Info</th></tr></thead>
        <tbody>
          {data.data.map((u: any) => (
            <tr key={u.id} style={{ borderBottom: "1px solid #2a3765" }}>
              <td style={{ padding: "8px 0" }}>{u.id}</td>
              <td>{u.name}</td>
              <td>{u.role}</td>
              <td>{u.status}</td>
              <td>{u.joinDate}</td>
              <td>
                <details style={{ marginBottom: "8px" }}>
                  <summary>Details</summary>
                  <p>Profile: {u.name} ({u.trustScore} Trust Score)</p>
                  <p>Active Jobs: [Mock Job 1, Mock Job 2]</p>
                  <p>Dispute History: [Mock Dispute 1]</p>
                </details>
                <div style={{ display: "flex", gap: "5px" }}>
                  <button aria-label="Suspend user" onClick={() => handleAction(u.id, "suspend")} disabled={u.status === "suspended"}>Suspend</button>
                  <button aria-label="Reinstate user" onClick={() => handleAction(u.id, "reinstate")} disabled={u.status === "active"}>Reinstate</button>
                  <button aria-label="Ban user" onClick={() => handleAction(u.id, "ban")} disabled={u.status === "banned"}>Ban</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
        <span>Page {page}</span>
        <button disabled={data.data.length < 10} onClick={() => setPage(p => p + 1)}>Next</button>
      </div>
    </div>
  );
}

function JobsTab() {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const load = () => fetchApi(`/jobs/flagged?page=${page}&limit=10`).then(setData);
  useEffect(() => { load(); }, [page]);

  const handleAction = async (id: string, action: string) => {
    let reason = "";
    if (action === "reject") {
      reason = prompt("Reason for rejection:") || "Violated terms";
    }
    await fetchApi(`/jobs/${id}/${action}`, "POST", { reason });
    load();
  };

  if (!data) return <div>Loading...</div>;
  return (
    <div>
      <h3>Flagged Jobs</h3>
      {data.data.length === 0 ? <p>No flagged jobs.</p> : (
        <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
          <thead><tr><th>ID</th><th>Title</th><th>Reason</th><th>Actions</th></tr></thead>
          <tbody>
            {data.data.map((j: any) => (
              <tr key={j.id} style={{ borderBottom: "1px solid #2a3765" }}>
                <td style={{ padding: "8px 0" }}>{j.id}</td>
                <td>{j.title}</td>
                <td>{j.reason}</td>
                <td>
                  <button onClick={() => handleAction(j.id, "approve")}>Approve</button>
                  <button onClick={() => handleAction(j.id, "reject")}>Reject</button>
                  <button onClick={() => handleAction(j.id, "escalate")}>Escalate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
        <span>Page {page}</span>
        <button disabled={data.data.length < 10} onClick={() => setPage(p => p + 1)}>Next</button>
      </div>
    </div>
  );
}

function DisputesTab() {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const load = () => fetchApi(`/disputes?page=${page}&limit=10`).then(setData);
  useEffect(() => { load(); }, [page]);

  const handleAction = async (id: string, action: string) => {
    await fetchApi(`/disputes/${id}/${action}`, "POST");
    load();
  };

  if (!data) return <div>Loading...</div>;
  return (
    <div>
      <h3>Disputes</h3>
      <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
        <thead><tr><th>ID</th><th>Job</th><th>Status</th><th>Thread</th><th>Actions</th></tr></thead>
        <tbody>
          {data.data.map((d: any) => (
            <tr key={d.id} style={{ borderBottom: "1px solid #2a3765" }}>
              <td style={{ padding: "8px 0" }}>{d.id}</td>
              <td>{d.jobId}</td>
              <td>{d.status}</td>
              <td>
                <details>
                  <summary>View Thread</summary>
                  <pre>{JSON.stringify(d.thread, null, 2)}</pre>
                  <p>Evidence: {d.evidence}</p>
                  <p>Tx Amount: {d.transactionDetails?.amount}</p>
                </details>
              </td>
              <td>
                <button onClick={() => handleAction(d.id, "rule")}>Rule in favour</button>
                <button onClick={() => handleAction(d.id, "refund")}>Refund</button>
                <button onClick={() => handleAction(d.id, "escalate")}>Escalate</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
        <span>Page {page}</span>
        <button disabled={data.data.length < 10} onClick={() => setPage(p => p + 1)}>Next</button>
      </div>
    </div>
  );
}

function ControlsTab() {
  const [data, setData] = useState<any>(null);
  const load = () => fetchApi(`/controls`).then(setData);
  useEffect(() => { load(); }, []);

  const handleToggle = async (key: string, value: boolean) => {
    if (!confirm(`Are you sure you want to ${value ? 'enable' : 'disable'} ${key}?`)) return;
    await fetchApi(`/controls`, "POST", { [key]: value });
    load();
  };

  if (!data) return <div>Loading...</div>;
  return (
    <div>
      <h3>Platform Controls</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <label>
          <input type="checkbox" checked={data.newRegistrations} onChange={e => handleToggle("newRegistrations", e.target.checked)} />
          Enable New Registrations
        </label>
        <label>
          <input type="checkbox" checked={data.newJobPostings} onChange={e => handleToggle("newJobPostings", e.target.checked)} />
          Enable New Job Postings
        </label>
      </div>
    </div>
  );
}

function AuditTab() {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [adminId, setAdminId] = useState("");
  const [actionType, setActionType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = () => fetchApi(`/audit?page=${page}&limit=10&adminId=${adminId}&actionType=${actionType}&dateFrom=${dateFrom}&dateTo=${dateTo}`).then(setData);
  useEffect(() => { load(); }, [page, adminId, actionType, dateFrom, dateTo]);

  if (!data) return <div>Loading...</div>;
  return (
    <div>
      <h3>Audit Log</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "1rem" }}>
        <input placeholder="Admin ID..." value={adminId} onChange={e => setAdminId(e.target.value)} style={{ padding: "4px" }} />
        <input placeholder="Action Type..." value={actionType} onChange={e => setActionType(e.target.value)} style={{ padding: "4px" }} />
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: "4px" }} title="Date From" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: "4px" }} title="Date To" />
      </div>
      <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
        <thead><tr><th>Time</th><th>Admin</th><th>Action</th><th>Details</th></tr></thead>
        <tbody>
          {data.data.map((l: any) => (
            <tr key={l.id} style={{ borderBottom: "1px solid #2a3765" }}>
              <td style={{ padding: "8px 0" }}>{new Date(l.timestamp).toLocaleString()}</td>
              <td>{l.adminId}</td>
              <td>{l.action}</td>
              <td>{l.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
        <span>Page {page}</span>
        <button disabled={data.data.length < 10} onClick={() => setPage(p => p + 1)}>Next</button>
      </div>
    </div>
  );
}
