"use client";

import { useState } from "react";

type MetricsData = {
  totalUsers: number;
  openJobs: number;
  activeFreelancers: number;
  openDisputes: number;
  flaggedListings: number;
  monthlyVolume: number;
  registrationEnabled: boolean;
  newJobPostingEnabled: boolean;
};

const MOCK_METRICS: MetricsData = {
  totalUsers: 312,
  openJobs: 47,
  activeFreelancers: 185,
  openDisputes: 8,
  flaggedListings: 3,
  monthlyVolume: 128900,
  registrationEnabled: true,
  newJobPostingEnabled: true,
};

const MOCK_USERS = [
  { id: "usr_1", email: "alice@example.com", fullName: "Alice Dev", role: "freelancer", status: "active", joinDate: "2025-01-10" },
  { id: "usr_2", email: "bob@example.com",   fullName: "Bob Client",  role: "client",     status: "active", joinDate: "2025-02-14" },
  { id: "usr_3", email: "carol@example.com", fullName: "Carol UX",    role: "freelancer", status: "suspended", joinDate: "2025-03-01" },
];

const MOCK_DISPUTES = [
  { id: "dsp_1", title: "Payment not released", status: "open",         parties: "alice vs bob", createdAt: "2026-06-01" },
  { id: "dsp_2", title: "Work quality issue",   status: "under_review", parties: "carol vs dave", createdAt: "2026-06-05" },
];

const MOCK_FLAGS = [
  { id: "flg_1", jobTitle: "Suspicious SEO job",     reason: "Automated rule: keyword spam", resolved: false },
  { id: "flg_2", jobTitle: "Mass scraping contract", reason: "User report",                  resolved: false },
];

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: "1rem", minWidth: 140, textAlign: "center" }}>
      <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: "0.85rem", color: "#666", marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function AdminPanelPage() {
  const [metrics]                 = useState<MetricsData>(MOCK_METRICS);
  const [users, setUsers]         = useState(MOCK_USERS);
  const [disputes, setDisputes]   = useState(MOCK_DISPUTES);
  const [flags, setFlags]         = useState(MOCK_FLAGS);
  const [regEnabled, setReg]      = useState(metrics.registrationEnabled);
  const [jobEnabled, setJob]      = useState(metrics.newJobPostingEnabled);
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch]       = useState("");
  const [tab, setTab]             = useState<"users" | "jobs" | "disputes" | "controls">("users");

  const filteredUsers = users.filter(u => {
    const matchRole   = roleFilter === "all" || u.role === roleFilter;
    const matchSearch = !search || u.email.includes(search) || u.fullName.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <section>
      <h2>Admin Panel</h2>

      {/* Metrics */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <MetricCard label="Total Users"       value={metrics.totalUsers} />
        <MetricCard label="Open Jobs"         value={metrics.openJobs} />
        <MetricCard label="Active Freelancers" value={metrics.activeFreelancers} />
        <MetricCard label="Open Disputes"     value={metrics.openDisputes} />
        <MetricCard label="Flagged Listings"  value={metrics.flaggedListings} />
        <MetricCard label="Monthly Volume"    value={`$${metrics.monthlyVolume.toLocaleString()}`} />
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["users","jobs","disputes","controls"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "0.4rem 1rem", borderRadius: 6, border: "1px solid #bbb",
                     background: tab === t ? "#5468ff" : "#fff",
                     color: tab === t ? "#fff" : "#333", cursor: "pointer" }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* User Management */}
      {tab === "users" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input placeholder="Search email or name" value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, padding: "0.4rem", borderRadius: 4, border: "1px solid #ccc" }} />
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
              style={{ padding: "0.4rem", borderRadius: 4 }}>
              <option value="all">All roles</option>
              <option value="freelancer">Freelancer</option>
              <option value="client">Client</option>
            </select>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #eee", textAlign: "left" }}>
                <th style={{ padding: "0.5rem" }}>Name</th>
                <th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "0.5rem" }}>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td><span style={{ color: u.status === "active" ? "green" : "red" }}>{u.status}</span></td>
                  <td>{u.joinDate}</td>
                  <td style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => setUsers(prev => prev.map(x => x.id === u.id ? {...x, status: "suspended"} : x))}
                      style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", cursor: "pointer" }}>Suspend</button>
                    <button onClick={() => setUsers(prev => prev.map(x => x.id === u.id ? {...x, status: "banned"} : x))}
                      style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", cursor: "pointer", color: "red" }}>Ban</button>
                    <button onClick={() => setUsers(prev => prev.map(x => x.id === u.id ? {...x, status: "active"} : x))}
                      style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", cursor: "pointer", color: "green" }}>Reinstate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Flagged Jobs */}
      {tab === "jobs" && (
        <div>
          <h3>Flagged Listings</h3>
          {flags.filter(f => !f.resolved).length === 0 && <p>No flagged listings.</p>}
          {flags.filter(f => !f.resolved).map(f => (
            <div key={f.id} className="card" style={{ marginBottom: 8 }}>
              <strong>{f.jobTitle}</strong>
              <p style={{ margin: "4px 0", color: "#666" }}>{f.reason}</p>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button onClick={() => setFlags(prev => prev.map(x => x.id === f.id ? {...x, resolved: true, action: "approve"} : x))}
                  style={{ cursor: "pointer", color: "green" }}>Approve</button>
                <button onClick={() => setFlags(prev => prev.map(x => x.id === f.id ? {...x, resolved: true, action: "reject"} : x))}
                  style={{ cursor: "pointer", color: "red" }}>Reject</button>
                <button onClick={() => setFlags(prev => prev.map(x => x.id === f.id ? {...x, resolved: true, action: "escalate"} : x))}
                  style={{ cursor: "pointer" }}>Escalate</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Disputes */}
      {tab === "disputes" && (
        <div>
          <h3>Dispute Queue</h3>
          {disputes.map(d => (
            <div key={d.id} className="card" style={{ marginBottom: 8 }}>
              <strong>{d.title}</strong>
              <p style={{ margin: "4px 0", color: "#666" }}>{d.parties} — <em>{d.status}</em></p>
              <p style={{ fontSize: "0.8rem", color: "#999" }}>Opened: {d.createdAt}</p>
              {d.status !== "resolved" && (
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={() => setDisputes(prev => prev.map(x => x.id === d.id ? {...x, status: "resolved", ruling: "favour_freelancer"} : x))}
                    style={{ cursor: "pointer" }}>Rule: Freelancer</button>
                  <button onClick={() => setDisputes(prev => prev.map(x => x.id === d.id ? {...x, status: "resolved", ruling: "favour_client"} : x))}
                    style={{ cursor: "pointer" }}>Rule: Client</button>
                  <button onClick={() => setDisputes(prev => prev.map(x => x.id === d.id ? {...x, status: "under_review"} : x))}
                    style={{ cursor: "pointer", color: "#888" }}>Escalate</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Platform Controls */}
      {tab === "controls" && (
        <div>
          <h3>Platform Controls</h3>
          <div className="card" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
            <span>New user registrations</span>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={regEnabled} onChange={e => setReg(e.target.checked)} />
              {regEnabled ? "Enabled" : "Disabled"}
            </label>
          </div>
          <div className="card" style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span>New job postings</span>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={jobEnabled} onChange={e => setJob(e.target.checked)} />
              {jobEnabled ? "Enabled" : "Disabled"}
            </label>
          </div>
        </div>
      )}
    </section>
  );
}
