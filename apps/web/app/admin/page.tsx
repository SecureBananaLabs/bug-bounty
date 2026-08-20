"use client";

import { useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

const initialUsers = [
  { id: "usr_client_1", name: "Maya Stone", email: "maya@example.com", role: "client", status: "active", joinedAt: "2026-01-10", trustScore: 92, activeJobs: 3, disputes: 0 },
  { id: "usr_freelancer_1", name: "Noah Chen", email: "noah@example.com", role: "freelancer", status: "active", joinedAt: "2026-02-14", trustScore: 81, activeJobs: 2, disputes: 1 },
  { id: "usr_client_2", name: "Priya Rao", email: "priya@example.com", role: "client", status: "suspended", joinedAt: "2026-03-02", trustScore: 47, activeJobs: 0, disputes: 2 },
  { id: "usr_freelancer_2", name: "Eli Brooks", email: "eli@example.com", role: "freelancer", status: "active", joinedAt: "2026-03-21", trustScore: 68, activeJobs: 1, disputes: 0 },
  { id: "usr_client_3", name: "Sofia Martin", email: "sofia@example.com", role: "client", status: "banned", joinedAt: "2026-04-03", trustScore: 22, activeJobs: 0, disputes: 4 }
];

const initialJobs = [
  { id: "job_101", title: "Marketplace scraping bot", poster: "Priya Rao", reason: "Potential ToS violation", status: "flagged" },
  { id: "job_102", title: "Landing page polish", poster: "Maya Stone", reason: "Payment terms missing", status: "flagged" },
  { id: "job_103", title: "KYC workflow review", poster: "Sofia Martin", reason: "Suspicious scope", status: "escalated" }
];

const initialDisputes = [
  { id: "dsp_201", jobTitle: "API integration", parties: "Maya Stone / Noah Chen", status: "open", amount: 850, evidence: "Milestone brief, delivery screenshots", thread: "Client reports incomplete webhooks. Freelancer provided retry logs." },
  { id: "dsp_202", jobTitle: "Brand refresh", parties: "Priya Rao / Eli Brooks", status: "under_review", amount: 420, evidence: "Design files, revision request", thread: "Freelancer claims scope creep. Client asks for refund." }
];

export default function AdminPanelPage() {
  const [users, setUsers] = useState(initialUsers);
  const [jobs, setJobs] = useState(initialJobs);
  const [disputes, setDisputes] = useState(initialDisputes);
  const [audit, setAudit] = useState([
    { id: "aud_1", admin: "admin_1", action: "admin_panel_loaded", target: "platform", at: "2026-05-22 09:00", note: "Dashboard opened" }
  ]);
  const [controls, setControls] = useState({ registrations: true, jobPostings: true });
  const [filters, setFilters] = useState({ search: "", role: "", status: "" });
  const [selectedUser, setSelectedUser] = useState(initialUsers[0]);
  const [loading, setLoading] = useState(false);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const search = filters.search.toLowerCase();
      return (!search || user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search))
        && (!filters.role || user.role === filters.role)
        && (!filters.status || user.status === filters.status);
    });
  }, [filters, users]);

  const metrics = useMemo(() => {
    const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
    return {
      totalUsers: users.length,
      activeJobs: users.reduce((total, user) => total + user.activeJobs, 0),
      openDisputes,
      flaggedListings: jobs.filter((job) => job.status === "flagged").length,
      revenue: "£101,800"
    };
  }, [disputes, jobs, users]);

  function log(action: string, target: string, note: string) {
    setAudit((entries) => [
      { id: `aud_${entries.length + 1}`, admin: "admin_1", action, target, at: new Date().toLocaleString(), note },
      ...entries
    ]);
  }

  function updateUserStatus(userId: string, status: string) {
    setUsers((items) => items.map((user) => user.id === userId ? { ...user, status } : user));
    log("user_status_updated", userId, `User set to ${status}`);
  }

  function updateJob(jobId: string, status: string) {
    setJobs((items) => items.map((job) => job.id === jobId ? { ...job, status } : job));
    log("listing_moderated", jobId, `Listing ${status}`);
  }

  function ruleDispute(disputeId: string, ruling: string) {
    setDisputes((items) => items.map((dispute) => dispute.id === disputeId ? { ...dispute, status: ruling === "escalated" ? "under_review" : "resolved", ruling } : dispute));
    log("dispute_ruled", disputeId, `Ruling: ${ruling}`);
  }

  function toggleControl(key: "registrations" | "jobPostings") {
    const label = key === "registrations" ? "new user registrations" : "new job postings";
    if (!window.confirm(`Confirm change to ${label}?`)) {
      return;
    }

    setControls((current) => {
      const next = !current[key];
      log("platform_control_updated", key, `${label} ${next ? "enabled" : "disabled"}`);
      return { ...current, [key]: next };
    });
  }

  function refresh() {
    setLoading(true);
    window.setTimeout(() => setLoading(false), 350);
  }

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: "0 0 .25rem" }}>Admin Panel</h2>
          <p style={{ margin: 0, color: "#b9c4e7" }}>Moderation, disputes, controls, and audit history</p>
        </div>
        <button aria-label="Refresh admin data" onClick={refresh} style={buttonStyle}>{loading ? "Refreshing" : "Refresh"}</button>
      </div>

      <div className="grid">
        <Metric label="Total users" value={metrics.totalUsers} />
        <Metric label="Active jobs" value={metrics.activeJobs} />
        <Metric label="Open disputes" value={metrics.openDisputes} />
        <Metric label="Flagged listings" value={metrics.flaggedListings} />
        <Metric label="Revenue" value={metrics.revenue} />
      </div>

      <div className="card">
        <h3>User Management</h3>
        <div style={toolbarStyle}>
          <input aria-label="Search users" placeholder="Search users" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} style={inputStyle} />
          <select aria-label="Filter by role" value={filters.role} onChange={(event) => setFilters({ ...filters, role: event.target.value })} style={inputStyle}>
            <option value="">All roles</option>
            <option value="client">Clients</option>
            <option value="freelancer">Freelancers</option>
          </select>
          <select aria-label="Filter by status" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} style={inputStyle}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
        </div>
        {filteredUsers.length === 0 ? <Empty label="No users match the filters." /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th>Trust</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td><button aria-label={`View ${user.name}`} onClick={() => setSelectedUser(user)} style={linkButtonStyle}>{user.name}<br /><span>{user.email}</span></button></td>
                    <td>{user.role}</td>
                    <td>{user.status}</td>
                    <td>{user.joinedAt}</td>
                    <td>{user.trustScore}</td>
                    <td style={actionsStyle}>
                      <button aria-label={`Suspend ${user.name}`} onClick={() => updateUserStatus(user.id, "suspended")} style={smallButtonStyle}>Suspend</button>
                      <button aria-label={`Reinstate ${user.name}`} onClick={() => updateUserStatus(user.id, "active")} style={smallButtonStyle}>Reinstate</button>
                      <button aria-label={`Ban ${user.name}`} onClick={() => updateUserStatus(user.id, "banned")} style={dangerButtonStyle}>Ban</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <aside style={panelStyle} aria-label="Selected user profile">
          <strong>{selectedUser.name}</strong>
          <span>{selectedUser.activeJobs} active jobs</span>
          <span>{selectedUser.disputes} dispute records</span>
        </aside>
      </div>

      <div className="grid">
        <Queue title="Job Moderation" items={jobs} render={(job) => (
          <>
            <p><strong>{job.title}</strong> by {job.poster}</p>
            <p>{job.reason}</p>
            <p>Status: {job.status}</p>
            <div style={actionsStyle}>
              <button aria-label={`Approve ${job.title}`} onClick={() => updateJob(job.id, "approved")} style={smallButtonStyle}>Approve</button>
              <button aria-label={`Reject ${job.title}`} onClick={() => updateJob(job.id, "rejected")} style={dangerButtonStyle}>Reject</button>
              <button aria-label={`Escalate ${job.title}`} onClick={() => updateJob(job.id, "escalated")} style={smallButtonStyle}>Escalate</button>
            </div>
          </>
        )} />

        <Queue title="Dispute Resolution" items={disputes} render={(dispute) => (
          <>
            <p><strong>{dispute.jobTitle}</strong></p>
            <p>{dispute.parties} · £{dispute.amount}</p>
            <p>{dispute.thread}</p>
            <p>Evidence: {dispute.evidence}</p>
            <div style={actionsStyle}>
              <button aria-label={`Rule for freelancer on ${dispute.id}`} onClick={() => ruleDispute(dispute.id, "freelancer")} style={smallButtonStyle}>Freelancer</button>
              <button aria-label={`Rule for client on ${dispute.id}`} onClick={() => ruleDispute(dispute.id, "client")} style={smallButtonStyle}>Client</button>
              <button aria-label={`Refund ${dispute.id}`} onClick={() => ruleDispute(dispute.id, "refund")} style={smallButtonStyle}>Refund</button>
              <button aria-label={`Escalate ${dispute.id}`} onClick={() => ruleDispute(dispute.id, "escalated")} style={dangerButtonStyle}>Escalate</button>
            </div>
          </>
        )} />
      </div>

      <div className="card">
        <h3>Trust & Controls</h3>
        <div className="grid">
          <div style={panelStyle}>
            <strong>Trust score distribution</strong>
            <span>High: {users.filter((user) => user.trustScore >= 80).length}</span>
            <span>Medium: {users.filter((user) => user.trustScore >= 50 && user.trustScore < 80).length}</span>
            <span>Low: {users.filter((user) => user.trustScore < 50).length}</span>
          </div>
          <div style={panelStyle}>
            <label><input type="checkbox" checked={controls.registrations} onChange={() => toggleControl("registrations")} /> New user registrations</label>
            <label><input type="checkbox" checked={controls.jobPostings} onChange={() => toggleControl("jobPostings")} /> New job postings</label>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Audit Log</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead><tr><th>Time</th><th>Admin</th><th>Action</th><th>Target</th><th>Note</th></tr></thead>
            <tbody>
              {audit.map((entry) => (
                <tr key={entry.id}><td>{entry.at}</td><td>{entry.admin}</td><td>{entry.action}</td><td>{entry.target}</td><td>{entry.note}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="card"><span style={{ color: "#b9c4e7" }}>{label}</span><strong style={{ display: "block", fontSize: "1.7rem", marginTop: ".35rem" }}>{value}</strong></div>;
}

function Queue<T>({ title, items, render }: { title: string; items: T[]; render: (item: T) => ReactNode }) {
  return <div className="card"><h3>{title}</h3>{items.length === 0 ? <Empty label="Queue is empty." /> : items.map((item, index) => <div key={index} style={panelStyle}>{render(item)}</div>)}</div>;
}

function Empty({ label }: { label: string }) {
  return <p role="status" style={{ color: "#b9c4e7" }}>{label}</p>;
}

const toolbarStyle = { display: "flex", flexWrap: "wrap", gap: ".5rem", marginBottom: "1rem" } satisfies CSSProperties;
const inputStyle = { minWidth: "160px", flex: "1 1 160px", borderRadius: "8px", border: "1px solid #34436f", background: "#0f162b", color: "#f2f5ff", padding: ".65rem" } satisfies CSSProperties;
const tableStyle = { width: "100%", borderCollapse: "collapse" } satisfies CSSProperties;
const actionsStyle = { display: "flex", flexWrap: "wrap", gap: ".4rem" } satisfies CSSProperties;
const buttonStyle = { border: 0, borderRadius: "8px", background: "#5dd6c6", color: "#06101c", padding: ".7rem 1rem", fontWeight: 700, cursor: "pointer" } satisfies CSSProperties;
const smallButtonStyle = { ...buttonStyle, padding: ".45rem .65rem", background: "#7ca7ff" } satisfies CSSProperties;
const dangerButtonStyle = { ...smallButtonStyle, background: "#ff7f9a" } satisfies CSSProperties;
const linkButtonStyle = { color: "#f2f5ff", background: "transparent", border: 0, padding: 0, textAlign: "left", cursor: "pointer" } satisfies CSSProperties;
const panelStyle = { display: "grid", gap: ".4rem", border: "1px solid #2a3765", borderRadius: "8px", padding: ".75rem", marginTop: ".75rem", background: "#101832" } satisfies CSSProperties;
