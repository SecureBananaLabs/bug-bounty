"use client";

import { useMemo, useState } from "react";

type UserStatus = "active" | "suspended" | "banned";
type QueueStatus = "flagged" | "approved" | "rejected" | "escalated" | "under_review";
type DisputeStatus = "open" | "under_review" | "resolved" | "escalated";

type AuditEntry = {
  id: string;
  action: string;
  targetId: string;
  admin: string;
  reason: string;
  createdAt: string;
};

const initialUsers = [
  { id: "usr_01", name: "Nadia Chen", role: "client", status: "active" as UserStatus, joinedAt: "Mar 11", jobs: 3, disputes: 0, trust: 92 },
  { id: "usr_02", name: "Maya Iyer", role: "freelancer", status: "active" as UserStatus, joinedAt: "Feb 19", jobs: 4, disputes: 1, trust: 88 },
  { id: "usr_03", name: "Jordan Vale", role: "freelancer", status: "active" as UserStatus, joinedAt: "Apr 03", jobs: 2, disputes: 1, trust: 77 },
  { id: "usr_04", name: "Owen Park", role: "freelancer", status: "active" as UserStatus, joinedAt: "Jan 29", jobs: 5, disputes: 0, trust: 95 },
  { id: "usr_05", name: "Rhea Singh", role: "client", status: "suspended" as UserStatus, joinedAt: "Apr 21", jobs: 1, disputes: 2, trust: 51 }
];

const initialJobs = [
  { id: "job_201", title: "Scrape gated lead database", owner: "Rhea Singh", severity: "high", status: "flagged" as QueueStatus },
  { id: "job_202", title: "Landing page rebuild", owner: "Nadia Chen", severity: "medium", status: "under_review" as QueueStatus }
];

const initialDisputes = [
  { id: "dsp_301", title: "Mobile checkout polish", parties: "Nadia / Jordan", amount: "$1,200", evidence: 4, status: "open" as DisputeStatus },
  { id: "dsp_302", title: "API migration", parties: "Rhea / Maya", amount: "$2,800", evidence: 7, status: "under_review" as DisputeStatus }
];

const now = () => new Date().toLocaleString();

export function AdminPanel() {
  const [users, setUsers] = useState(initialUsers);
  const [jobs, setJobs] = useState(initialJobs);
  const [disputes, setDisputes] = useState(initialDisputes);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [controls, setControls] = useState({
    registrations: true,
    jobPostings: true
  });
  const [audit, setAudit] = useState<AuditEntry[]>([
    {
      id: "aud_001",
      action: "moderation.reviewed",
      targetId: "job_202",
      admin: "admin_seed",
      reason: "Initial seeded review",
      createdAt: "May 18, 2026, 10:00 AM"
    }
  ]);

  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users.filter((user) => {
      const queryMatch = needle ? `${user.name} ${user.id}`.toLowerCase().includes(needle) : true;
      const roleMatch = role === "all" ? true : user.role === role;
      const statusMatch = status === "all" ? true : user.status === status;
      return queryMatch && roleMatch && statusMatch;
    });
  }, [query, role, status, users]);

  const metrics = useMemo(() => {
    const activeJobs = users.reduce((sum, user) => sum + user.jobs, 0);
    return [
      ["Total users", users.length],
      ["Active jobs", activeJobs],
      ["Open disputes", disputes.filter((dispute) => dispute.status !== "resolved").length],
      ["Flagged listings", jobs.filter((job) => job.status === "flagged").length],
      ["Revenue", "$128.9k"]
    ];
  }, [disputes, jobs, users]);

  function addAudit(action: string, targetId: string, reason: string) {
    setAudit((entries) => [
      {
        id: `aud_${String(entries.length + 1).padStart(3, "0")}`,
        action,
        targetId,
        admin: "current_admin",
        reason,
        createdAt: now()
      },
      ...entries
    ]);
  }

  function setUserStatus(userId: string, nextStatus: UserStatus) {
    setUsers((items) => items.map((user) => (user.id === userId ? { ...user, status: nextStatus } : user)));
    addAudit("user.status_changed", userId, `Set user to ${nextStatus}`);
  }

  function setJobStatus(jobId: string, nextStatus: QueueStatus) {
    setJobs((items) => items.map((job) => (job.id === jobId ? { ...job, status: nextStatus } : job)));
    addAudit("moderation.status_changed", jobId, `Marked listing ${nextStatus}`);
  }

  function setDisputeStatus(disputeId: string, nextStatus: DisputeStatus) {
    setDisputes((items) => items.map((dispute) => (dispute.id === disputeId ? { ...dispute, status: nextStatus } : dispute)));
    addAudit("dispute.status_changed", disputeId, `Moved dispute to ${nextStatus}`);
  }

  function toggleControl(key: "registrations" | "jobPostings") {
    const label = key === "registrations" ? "new user registrations" : "new job postings";
    if (!window.confirm(`Confirm change for ${label}?`)) {
      return;
    }

    setControls((current) => ({ ...current, [key]: !current[key] }));
    addAudit("platform_control.updated", key, `Toggled ${label}`);
  }

  return (
    <section className="admin-panel" aria-labelledby="admin-title">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Admin command surface</p>
          <h2 id="admin-title">Trust, moderation, and platform controls</h2>
        </div>
        <div className="admin-guard" aria-label="Access status">
          Admin only
        </div>
      </div>

      <div className="metric-row" aria-label="Platform metrics">
        {metrics.map(([label, value]) => (
          <div className="metric-tile" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="admin-layout">
        <section className="admin-section wide" aria-labelledby="users-title">
          <div className="section-heading">
            <h3 id="users-title">Users</h3>
            <div className="filters">
              <input aria-label="Search users" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users" />
              <select aria-label="Filter by role" value={role} onChange={(event) => setRole(event.target.value)}>
                <option value="all">All roles</option>
                <option value="client">Clients</option>
                <option value="freelancer">Freelancers</option>
              </select>
              <select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </select>
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
                      <strong>{user.name}</strong>
                      <span>{user.id} - {user.jobs} jobs - {user.disputes} disputes</span>
                    </td>
                    <td>{user.role}</td>
                    <td><span className={`status ${user.status}`}>{user.status}</span></td>
                    <td>{user.joinedAt}</td>
                    <td>
                      <meter min="0" max="100" value={user.trust} aria-label={`${user.name} trust score`} />
                      <span>{user.trust}</span>
                    </td>
                    <td className="action-row">
                      <button type="button" onClick={() => setUserStatus(user.id, "suspended")}>Suspend</button>
                      <button type="button" onClick={() => setUserStatus(user.id, "active")}>Reinstate</button>
                      <button type="button" onClick={() => setUserStatus(user.id, "banned")}>Ban</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-section" aria-labelledby="queue-title">
          <h3 id="queue-title">Moderation Queue</h3>
          {jobs.map((job) => (
            <article className="queue-item" key={job.id}>
              <div>
                <strong>{job.title}</strong>
                <span>{job.owner} - {job.severity}</span>
              </div>
              <span className={`status ${job.status}`}>{job.status.replace("_", " ")}</span>
              <div className="action-row">
                <button type="button" onClick={() => setJobStatus(job.id, "approved")}>Approve</button>
                <button type="button" onClick={() => setJobStatus(job.id, "rejected")}>Reject</button>
                <button type="button" onClick={() => setJobStatus(job.id, "escalated")}>Escalate</button>
              </div>
            </article>
          ))}
        </section>

        <section className="admin-section" aria-labelledby="disputes-title">
          <h3 id="disputes-title">Disputes</h3>
          {disputes.map((dispute) => (
            <article className="queue-item" key={dispute.id}>
              <div>
                <strong>{dispute.title}</strong>
                <span>{dispute.parties} - {dispute.amount} - {dispute.evidence} files</span>
              </div>
              <span className={`status ${dispute.status}`}>{dispute.status.replace("_", " ")}</span>
              <div className="action-row">
                <button type="button" onClick={() => setDisputeStatus(dispute.id, "resolved")}>Rule</button>
                <button type="button" onClick={() => setDisputeStatus(dispute.id, "escalated")}>Escalate</button>
              </div>
            </article>
          ))}
        </section>

        <section className="admin-section" aria-labelledby="controls-title">
          <h3 id="controls-title">Platform Controls</h3>
          <label className="toggle-row">
            <span>New user registrations</span>
            <input type="checkbox" checked={controls.registrations} onChange={() => toggleControl("registrations")} />
          </label>
          <label className="toggle-row">
            <span>New job postings</span>
            <input type="checkbox" checked={controls.jobPostings} onChange={() => toggleControl("jobPostings")} />
          </label>
        </section>

        <section className="admin-section wide" aria-labelledby="audit-title">
          <h3 id="audit-title">Audit Log</h3>
          <div className="audit-list">
            {audit.map((entry) => (
              <div className="audit-row" key={entry.id}>
                <strong>{entry.action}</strong>
                <span>{entry.targetId}</span>
                <span>{entry.reason}</span>
                <time>{entry.createdAt}</time>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
