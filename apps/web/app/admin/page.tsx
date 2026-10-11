"use client";
import { useState } from "react";

const MOCK_USERS = [
  { id: "usr_1", name: "Alice Johnson", email: "alice@example.com", role: "freelancer", status: "active", joined: "2026-01-10" },
  { id: "usr_2", name: "Bob Smith",    email: "bob@example.com",   role: "client",     status: "active", joined: "2026-02-14" },
  { id: "usr_3", name: "Carol White",  email: "carol@example.com", role: "freelancer", status: "suspended", joined: "2026-03-05" },
];

const MOCK_JOBS = [
  { id: "job-101", title: "Build an AI widget", status: "flagged",  reason: "Spam" },
  { id: "job-102", title: "Migrate API",        status: "pending",  reason: "Policy review" },
];

const MOCK_DISPUTES = [
  { id: "dsp-1", freelancer: "alice@example.com", client: "bob@example.com", status: "open",         amount: "$500" },
  { id: "dsp-2", freelancer: "carol@example.com", client: "dave@example.com", status: "under_review", amount: "$200" },
];

const MOCK_AUDIT: { id: string; admin: string; action: string; target: string; at: string }[] = [];

type UserStatus = "active" | "suspended" | "banned";

export default function AdminPanelPage() {
  // Platform controls
  const [regEnabled,  setRegEnabled]  = useState(true);
  const [jobsEnabled, setJobsEnabled] = useState(true);
  const [confirmKey,  setConfirmKey]  = useState<string | null>(null);

  // Users
  const [users, setUsers] = useState(MOCK_USERS);
  const [userFilter, setUserFilter] = useState("");

  // Jobs
  const [jobs, setJobs] = useState(MOCK_JOBS);

  // Disputes
  const [disputes, setDisputesState] = useState(MOCK_DISPUTES);

  // Audit log
  const [auditLog, setAuditLog] = useState(MOCK_AUDIT);
  const [auditFilter, setAuditFilter] = useState("");

  const logAction = (action: string, target: string) => {
    setAuditLog((prev) => [
      { id: `log-${Date.now()}`, admin: "admin@platform.com", action, target, at: new Date().toISOString() },
      ...prev,
    ]);
  };

  const setUserStatus = (id: string, status: UserStatus) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status } : u));
    logAction(status === "banned" ? "BAN" : status === "suspended" ? "SUSPEND" : "REINSTATE", id);
  };

  const moderateJob = (id: string, decision: "approved" | "rejected") => {
    setJobs((prev) => prev.map((j) => j.id === id ? { ...j, status: decision } : j));
    logAction(`JOB_${decision.toUpperCase()}`, id);
  };

  const resolveDispute = (id: string, ruling: string) => {
    setDisputesState((prev) => prev.map((d) => d.id === id ? { ...d, status: "resolved" } : d));
    logAction(`DISPUTE_RESOLVED:${ruling}`, id);
  };

  const toggleControl = (key: string) => {
    if (confirmKey === key) {
      if (key === "reg")  { setRegEnabled((v)  => !v); logAction("TOGGLE_REGISTRATION", String(!regEnabled)); }
      if (key === "jobs") { setJobsEnabled((v) => !v); logAction("TOGGLE_JOB_POSTING",  String(!jobsEnabled)); }
      setConfirmKey(null);
    } else {
      setConfirmKey(key);
    }
  };

  const filteredUsers = users.filter((u) =>
    !userFilter || u.role === userFilter || u.status === userFilter
  );

  const filteredAudit = auditLog.filter((a) =>
    !auditFilter || a.action.includes(auditFilter.toUpperCase()) || a.admin.includes(auditFilter)
  );

  const metrics = {
    totalUsers: users.length,
    activeJobs: jobs.filter((j) => j.status === "pending").length,
    openDisputes: disputes.filter((d) => d.status === "open").length,
    flaggedListings: jobs.filter((j) => j.status === "flagged").length,
  };

  return (
    <main style={{ padding: "1.5rem", fontFamily: "sans-serif", maxWidth: 1100, margin: "0 auto" }}>
      <h1>Admin Panel</h1>

      {/* ── Metrics ── */}
      <section aria-label="Platform metrics">
        <h2>Trust &amp; Metrics</h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {Object.entries(metrics).map(([k, v]) => (
            <div key={k} className="card" style={{ minWidth: 140, textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: "bold" }}>{v}</div>
              <div>{k.replace(/([A-Z])/g, " $1")}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Platform Controls ── */}
      <section aria-label="Platform controls" style={{ marginTop: "2rem" }}>
        <h2>Platform Controls</h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {[
            { key: "reg",  label: "New Registrations", val: regEnabled },
            { key: "jobs", label: "New Job Postings",   val: jobsEnabled },
          ].map(({ key, label, val }) => (
            <div key={key} className="card">
              <strong>{label}:</strong> {val ? "✅ Enabled" : "🚫 Disabled"}
              <br />
              {confirmKey === key ? (
                <>
                  <span style={{ color: "red" }}>Confirm toggle?</span>{" "}
                  <button onClick={() => toggleControl(key)} aria-label={`Confirm toggle ${label}`}>Yes</button>{" "}
                  <button onClick={() => setConfirmKey(null)} aria-label="Cancel">Cancel</button>
                </>
              ) : (
                <button onClick={() => setConfirmKey(key)} aria-label={`Toggle ${label}`}>Toggle</button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── User Management ── */}
      <section aria-label="User management" style={{ marginTop: "2rem" }}>
        <h2>User Management</h2>
        <label htmlFor="user-filter">Filter by role/status: </label>
        <select id="user-filter" value={userFilter} onChange={(e) => setUserFilter(e.target.value)}>
          <option value="">All</option>
          <option value="freelancer">Freelancer</option>
          <option value="client">Client</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "0.5rem" }} role="table" aria-label="Users table">
          <thead>
            <tr>{["Name","Email","Role","Status","Joined","Actions"].map((h) => (
              <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "0.4rem" }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                <td style={{ padding: "0.4rem" }}>{u.name}</td>
                <td style={{ padding: "0.4rem" }}>{u.email}</td>
                <td style={{ padding: "0.4rem" }}>{u.role}</td>
                <td style={{ padding: "0.4rem" }}>{u.status}</td>
                <td style={{ padding: "0.4rem" }}>{u.joined}</td>
                <td style={{ padding: "0.4rem", display: "flex", gap: "0.3rem" }}>
                  <button disabled={u.status === "active"}    onClick={() => setUserStatus(u.id, "active")}    aria-label={`Reinstate ${u.name}`}>Reinstate</button>
                  <button disabled={u.status === "suspended"} onClick={() => setUserStatus(u.id, "suspended")} aria-label={`Suspend ${u.name}`}>Suspend</button>
                  <button disabled={u.status === "banned"}    onClick={() => setUserStatus(u.id, "banned")}    aria-label={`Ban ${u.name}`}>Ban</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── Job Moderation ── */}
      <section aria-label="Job moderation queue" style={{ marginTop: "2rem" }}>
        <h2>Job Moderation Queue</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }} role="table" aria-label="Jobs moderation table">
          <thead>
            <tr>{["Job","Reason","Status","Actions"].map((h) => (
              <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "0.4rem" }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id}>
                <td style={{ padding: "0.4rem" }}>{j.title}</td>
                <td style={{ padding: "0.4rem" }}>{j.reason}</td>
                <td style={{ padding: "0.4rem" }}>{j.status}</td>
                <td style={{ padding: "0.4rem", display: "flex", gap: "0.3rem" }}>
                  <button disabled={j.status === "approved"} onClick={() => moderateJob(j.id, "approved")} aria-label={`Approve ${j.title}`}>Approve</button>
                  <button disabled={j.status === "rejected"} onClick={() => moderateJob(j.id, "rejected")} aria-label={`Reject ${j.title}`}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── Dispute Resolution ── */}
      <section aria-label="Dispute resolution" style={{ marginTop: "2rem" }}>
        <h2>Dispute Resolution</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }} role="table" aria-label="Disputes table">
          <thead>
            <tr>{["Freelancer","Client","Amount","Status","Actions"].map((h) => (
              <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "0.4rem" }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {disputes.map((d) => (
              <tr key={d.id}>
                <td style={{ padding: "0.4rem" }}>{d.freelancer}</td>
                <td style={{ padding: "0.4rem" }}>{d.client}</td>
                <td style={{ padding: "0.4rem" }}>{d.amount}</td>
                <td style={{ padding: "0.4rem" }}>{d.status}</td>
                <td style={{ padding: "0.4rem", display: "flex", gap: "0.3rem" }}>
                  <button disabled={d.status === "resolved"} onClick={() => resolveDispute(d.id, "freelancer")} aria-label="Rule for freelancer">Freelancer wins</button>
                  <button disabled={d.status === "resolved"} onClick={() => resolveDispute(d.id, "client")}     aria-label="Rule for client">Client wins</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── Audit Log ── */}
      <section aria-label="Audit log" style={{ marginTop: "2rem" }}>
        <h2>Audit Log</h2>
        <label htmlFor="audit-filter">Filter: </label>
        <input id="audit-filter" value={auditFilter} onChange={(e) => setAuditFilter(e.target.value)} placeholder="action or admin email" />
        {filteredAudit.length === 0
          ? <p>No audit entries yet.</p>
          : (
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "0.5rem" }} role="table" aria-label="Audit log table">
              <thead>
                <tr>{["Admin","Action","Target","Time"].map((h) => (
                  <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "0.4rem" }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filteredAudit.map((a) => (
                  <tr key={a.id}>
                    <td style={{ padding: "0.4rem" }}>{a.admin}</td>
                    <td style={{ padding: "0.4rem" }}>{a.action}</td>
                    <td style={{ padding: "0.4rem" }}>{a.target}</td>
                    <td style={{ padding: "0.4rem" }}>{new Date(a.at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </section>
    </main>
  );
}
