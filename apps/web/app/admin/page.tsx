"use client";

import { useMemo, useState } from "react";

type UserStatus = "active" | "suspended" | "banned";
type JobStatus = "pending" | "approved" | "rejected" | "escalated";
type DisputeStatus = "open" | "under_review" | "resolved";

type User = {
  id: string;
  name: string;
  email: string;
  role: "freelancer" | "client";
  status: UserStatus;
  joinedAt: string;
  trustScore: number;
  activeJobs: string[];
  disputes: string[];
};

type Job = {
  id: string;
  title: string;
  client: string;
  status: JobStatus;
  flagReason: string;
  reports: number;
};

type Dispute = {
  id: string;
  job: string;
  client: string;
  freelancer: string;
  status: DisputeStatus;
  amount: number;
  thread: string[];
  evidence: string[];
};

type AuditEntry = {
  id: string;
  adminId: string;
  action: string;
  target: string;
  createdAt: string;
};

const initialUsers: User[] = [
  { id: "usr_1001", name: "Maya Chen", email: "maya@example.com", role: "freelancer", status: "active", joinedAt: "2026-01-12", trustScore: 94, activeJobs: ["job_502"], disputes: ["dsp_9002"] },
  { id: "usr_1002", name: "Jordan Reed", email: "jordan@example.com", role: "client", status: "active", joinedAt: "2026-02-03", trustScore: 81, activeJobs: ["job_501", "job_503"], disputes: ["dsp_9001"] },
  { id: "usr_1003", name: "Iris Novak", email: "iris@example.com", role: "freelancer", status: "suspended", joinedAt: "2026-03-18", trustScore: 47, activeJobs: [], disputes: ["dsp_9001"] },
  { id: "usr_1004", name: "Theo Park", email: "theo@example.com", role: "client", status: "active", joinedAt: "2026-04-02", trustScore: 72, activeJobs: ["job_504"], disputes: [] }
];

const initialJobs: Job[] = [
  { id: "job_501", title: "Audit OAuth callback handling", client: "Jordan Reed", status: "pending", flagReason: "Off-platform payment wording", reports: 3 },
  { id: "job_503", title: "Scrape private marketplace leads", client: "Jordan Reed", status: "escalated", flagReason: "Potential terms violation", reports: 2 },
  { id: "job_505", title: "Bulk import customer invoices", client: "Theo Park", status: "pending", flagReason: "Sensitive data request", reports: 1 }
];

const initialDisputes: Dispute[] = [
  { id: "dsp_9001", job: "Audit OAuth callback handling", client: "Jordan Reed", freelancer: "Iris Novak", status: "open", amount: 650, thread: ["Missing OAuth test cases", "Second archive uploaded"], evidence: ["Test report", "Archive manifest"] },
  { id: "dsp_9002", job: "Build invoice dashboard", client: "Theo Park", freelancer: "Maya Chen", status: "under_review", amount: 300, thread: ["Scope changed after milestone approval"], evidence: ["Milestone transcript"] }
];

function stamp() {
  return new Date().toISOString();
}

function statusClass(status: string) {
  return `status-pill status-${status.replace("_", "-")}`;
}

export default function AdminPanelPage() {
  const [users, setUsers] = useState(initialUsers);
  const [jobs, setJobs] = useState(initialJobs);
  const [disputes, setDisputes] = useState(initialDisputes);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([
    { id: "aud_1", adminId: "adm_1", action: "admin.view", target: "panel", createdAt: stamp() }
  ]);
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [jobPostingOpen, setJobPostingOpen] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id ?? "");
  const [auditActionFilter, setAuditActionFilter] = useState("all");
  const [refreshedAt, setRefreshedAt] = useState(stamp());

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0];

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    return users.filter((user) => {
      if (query && !`${user.name} ${user.email}`.toLowerCase().includes(query)) return false;
      if (roleFilter !== "all" && user.role !== roleFilter) return false;
      if (statusFilter !== "all" && user.status !== statusFilter) return false;
      return true;
    });
  }, [roleFilter, statusFilter, userSearch, users]);

  const metrics = useMemo(() => {
    const trustBuckets = [
      { label: "0-49", count: users.filter((user) => user.trustScore < 50).length },
      { label: "50-69", count: users.filter((user) => user.trustScore >= 50 && user.trustScore < 70).length },
      { label: "70-89", count: users.filter((user) => user.trustScore >= 70 && user.trustScore < 90).length },
      { label: "90-100", count: users.filter((user) => user.trustScore >= 90).length }
    ];

    return {
      totalUsers: users.length,
      activeJobs: users.reduce((count, user) => count + user.activeJobs.length, 0),
      openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
      flaggedListings: jobs.filter((job) => job.status === "pending" || job.status === "escalated").length,
      revenue: "$128,900",
      trustBuckets
    };
  }, [disputes, jobs, users]);

  const filteredAudit = auditLog.filter((entry) => auditActionFilter === "all" || entry.action === auditActionFilter);

  function addAudit(action: string, target: string) {
    setAuditLog((entries) => [
      { id: `aud_${entries.length + 1}`, adminId: "adm_1", action, target, createdAt: stamp() },
      ...entries
    ]);
  }

  function updateUserStatus(userId: string, status: UserStatus) {
    setUsers((current) => current.map((user) => (user.id === userId ? { ...user, status } : user)));
    addAudit(`user.${status}`, userId);
  }

  function decideJob(jobId: string, status: JobStatus) {
    setJobs((current) => current.map((job) => (job.id === jobId ? { ...job, status } : job)));
    addAudit(`job.${status}`, jobId);
  }

  function ruleDispute(disputeId: string, status: DisputeStatus, action: string) {
    setDisputes((current) => current.map((dispute) => (dispute.id === disputeId ? { ...dispute, status } : dispute)));
    addAudit(action, disputeId);
  }

  function toggleControl(control: "registrations" | "jobPostings", enabled: boolean) {
    const label = control === "registrations" ? "registrations" : "job postings";
    if (!window.confirm(`Apply platform control change for ${label}?`)) return;
    if (control === "registrations") setRegistrationOpen(enabled);
    if (control === "jobPostings") setJobPostingOpen(enabled);
    addAudit("control.toggle", control);
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Admin Console</p>
          <h1>Operations Panel</h1>
        </div>
        <button
          className="primary-button"
          type="button"
          onClick={() => {
            setRefreshedAt(stamp());
            addAudit("admin.refresh", "panel");
          }}
        >
          Refresh Data
        </button>
      </header>

      <section className="metric-grid" aria-label="Platform metrics">
        <div className="metric-tile"><span>Total users</span><strong>{metrics.totalUsers}</strong></div>
        <div className="metric-tile"><span>Active jobs</span><strong>{metrics.activeJobs}</strong></div>
        <div className="metric-tile"><span>Open disputes</span><strong>{metrics.openDisputes}</strong></div>
        <div className="metric-tile"><span>Flagged listings</span><strong>{metrics.flaggedListings}</strong></div>
        <div className="metric-tile"><span>Period revenue</span><strong>{metrics.revenue}</strong></div>
      </section>

      <section className="admin-section">
        <div className="section-heading">
          <div>
            <h2>Trust Distribution</h2>
            <p>Last refreshed {new Date(refreshedAt).toLocaleString()}</p>
          </div>
        </div>
        <div className="trust-chart" aria-label="Trust score distribution">
          {metrics.trustBuckets.map((bucket) => (
            <div className="trust-bar" key={bucket.label}>
              <span>{bucket.label}</span>
              <div><i style={{ width: `${Math.max(bucket.count * 24, 8)}%` }} /></div>
              <strong>{bucket.count}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <div className="section-heading">
          <div>
            <h2>User Management</h2>
            <p>{filteredUsers.length} visible users</p>
          </div>
          <div className="filter-row">
            <label>
              <span>Search</span>
              <input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Name or email" />
            </label>
            <label>
              <span>Role</span>
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                <option value="all">All</option>
                <option value="freelancer">Freelancer</option>
                <option value="client">Client</option>
              </select>
            </label>
            <label>
              <span>Status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </select>
            </label>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Trust</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <button className="link-button" type="button" onClick={() => setSelectedUserId(user.id)}>
                      {user.name}
                    </button>
                    <small>{user.email}</small>
                  </td>
                  <td>{user.role}</td>
                  <td><span className={statusClass(user.status)}>{user.status}</span></td>
                  <td>{user.joinedAt}</td>
                  <td>{user.trustScore}</td>
                  <td className="action-cell">
                    <button type="button" onClick={() => updateUserStatus(user.id, "active")}>Reinstate</button>
                    <button type="button" onClick={() => updateUserStatus(user.id, "suspended")}>Suspend</button>
                    <button type="button" onClick={() => updateUserStatus(user.id, "banned")}>Ban</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {selectedUser ? (
          <aside className="detail-panel" aria-label="Selected user details">
            <strong>{selectedUser.name}</strong>
            <span>Active jobs: {selectedUser.activeJobs.join(", ") || "None"}</span>
            <span>Disputes: {selectedUser.disputes.join(", ") || "None"}</span>
          </aside>
        ) : null}
      </section>

      <section className="admin-section">
        <div className="section-heading">
          <div>
            <h2>Job Moderation</h2>
            <p>{jobs.length} flagged listings</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Listing</th>
                <th>Client</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>{job.title}<small>{job.reports} reports</small></td>
                  <td>{job.client}</td>
                  <td>{job.flagReason}</td>
                  <td><span className={statusClass(job.status)}>{job.status}</span></td>
                  <td className="action-cell">
                    <button type="button" onClick={() => decideJob(job.id, "approved")}>Approve</button>
                    <button type="button" onClick={() => decideJob(job.id, "rejected")}>Reject</button>
                    <button type="button" onClick={() => decideJob(job.id, "escalated")}>Escalate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section">
        <div className="section-heading">
          <div>
            <h2>Dispute Resolution</h2>
            <p>{disputes.length} active case records</p>
          </div>
        </div>
        <div className="dispute-grid">
          {disputes.map((dispute) => (
            <article className="case-panel" key={dispute.id}>
              <div className="case-title">
                <h3>{dispute.job}</h3>
                <span className={statusClass(dispute.status)}>{dispute.status}</span>
              </div>
              <p>{dispute.client} vs {dispute.freelancer} - ${dispute.amount}</p>
              <dl>
                <dt>Thread</dt>
                <dd>{dispute.thread.join(" / ")}</dd>
                <dt>Evidence</dt>
                <dd>{dispute.evidence.join(", ")}</dd>
              </dl>
              <div className="action-cell">
                <button type="button" onClick={() => ruleDispute(dispute.id, "resolved", "dispute.freelancer")}>Freelancer</button>
                <button type="button" onClick={() => ruleDispute(dispute.id, "resolved", "dispute.client")}>Client</button>
                <button type="button" onClick={() => ruleDispute(dispute.id, "resolved", "dispute.refund")}>Refund</button>
                <button type="button" onClick={() => ruleDispute(dispute.id, "under_review", "dispute.escalate")}>Escalate</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-section controls-section">
        <div>
          <h2>Platform Controls</h2>
          <p>Changes require confirmation and are logged.</p>
        </div>
        <label className="toggle-row">
          <span>New user registrations</span>
          <input type="checkbox" checked={registrationOpen} onChange={(event) => toggleControl("registrations", event.target.checked)} />
        </label>
        <label className="toggle-row">
          <span>New job postings</span>
          <input type="checkbox" checked={jobPostingOpen} onChange={(event) => toggleControl("jobPostings", event.target.checked)} />
        </label>
      </section>

      <section className="admin-section">
        <div className="section-heading">
          <div>
            <h2>Audit Log</h2>
            <p>{filteredAudit.length} entries</p>
          </div>
          <label className="compact-filter">
            <span>Action</span>
            <select value={auditActionFilter} onChange={(event) => setAuditActionFilter(event.target.value)}>
              <option value="all">All</option>
              {[...new Set(auditLog.map((entry) => entry.action))].map((action) => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Target</th>
              </tr>
            </thead>
            <tbody>
              {filteredAudit.map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.createdAt).toLocaleString()}</td>
                  <td>{entry.adminId}</td>
                  <td>{entry.action}</td>
                  <td>{entry.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
