"use client";

import { useMemo, useState } from "react";

const currentAdmin = { id: "usr_admin_demo", role: "admin" };

const initialUsers = [
  {
    id: "usr_client_1",
    name: "Avery Tan",
    role: "client",
    status: "active",
    joinedAt: "2026-02-14",
    trust: 92,
    activeJobs: 1,
    disputes: 1
  },
  {
    id: "usr_freelancer_1",
    name: "Maya Dev",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-03-02",
    trust: 86,
    activeJobs: 2,
    disputes: 0
  },
  {
    id: "usr_client_2",
    name: "Jordan Lee",
    role: "client",
    status: "suspended",
    joinedAt: "2026-04-18",
    trust: 54,
    activeJobs: 0,
    disputes: 1
  },
  {
    id: "usr_freelancer_2",
    name: "Sam Rivera",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-05-08",
    trust: 73,
    activeJobs: 1,
    disputes: 0
  }
];

const initialJobs = [
  { id: "job_101", title: "AI support widget", status: "flagged", reason: "Budget and scope mismatch" },
  { id: "job_104", title: "Urgent payment recovery", status: "escalated", reason: "Multiple user reports" }
];

const initialDisputes = [
  { id: "dsp_1", job: "AI support widget", status: "open", amount: "$700", evidence: "handoff-notes.md" },
  { id: "dsp_2", job: "Urgent payment recovery", status: "under_review", amount: "$320", evidence: "scope-change.pdf" }
];

type AuditEntry = {
  id: string;
  adminId: string;
  actionType: string;
  targetId: string;
  details: string;
  createdAt: string;
};

export default function AdminPanelPage() {
  const [users, setUsers] = useState(initialUsers);
  const [jobs, setJobs] = useState(initialJobs);
  const [disputes, setDisputes] = useState(initialDisputes);
  const [registrationsEnabled, setRegistrationsEnabled] = useState(true);
  const [jobPostingEnabled, setJobPostingEnabled] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [auditFilter, setAuditFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState(initialUsers[0]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([
    {
      id: "aud_1",
      adminId: currentAdmin.id,
      actionType: "system.bootstrap",
      targetId: "admin-panel",
      details: "Admin console loaded",
      createdAt: new Date().toISOString()
    }
  ]);

  const visibleUsers = useMemo(
    () =>
      users.filter((user) => {
        const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase());
        const matchesRole = role === "all" || user.role === role;
        const matchesStatus = status === "all" || user.status === status;
        return matchesSearch && matchesRole && matchesStatus;
      }),
    [role, search, status, users]
  );

  const filteredAudit = useMemo(
    () => auditLog.filter((entry) => entry.actionType.includes(auditFilter.toLowerCase())),
    [auditFilter, auditLog]
  );

  const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
  const trustBands = [
    { label: "0-49", count: users.filter((user) => user.trust < 50).length },
    { label: "50-74", count: users.filter((user) => user.trust >= 50 && user.trust < 75).length },
    { label: "75-100", count: users.filter((user) => user.trust >= 75).length }
  ];

  function log(actionType: string, targetId: string, details: string) {
    setAuditLog((entries) => [
      {
        id: `aud_${entries.length + 1}`,
        adminId: currentAdmin.id,
        actionType,
        targetId,
        details,
        createdAt: new Date().toISOString()
      },
      ...entries
    ]);
  }

  function setUserStatus(userId: string, nextStatus: string) {
    setUsers((items) => items.map((user) => (user.id === userId ? { ...user, status: nextStatus } : user)));
    log(`user.${nextStatus}`, userId, `User marked ${nextStatus}`);
  }

  function moderate(jobId: string, action: string) {
    setJobs((items) => items.map((job) => (job.id === jobId ? { ...job, status: action } : job)));
    log(`listing.${action}`, jobId, `Listing ${action}`);
  }

  function rule(disputeId: string, ruling: string) {
    setDisputes((items) =>
      items.map((dispute) => (dispute.id === disputeId ? { ...dispute, status: "resolved" } : dispute))
    );
    log(`dispute.${ruling}`, disputeId, `Ruling recorded for ${ruling}`);
  }

  function toggleControl(control: "registrations" | "jobs", enabled: boolean) {
    const label = control === "registrations" ? "new user registrations" : "new job postings";
    if (!window.confirm(`Confirm ${enabled ? "enabling" : "disabling"} ${label}?`)) {
      return;
    }
    if (control === "registrations") {
      setRegistrationsEnabled(enabled);
    } else {
      setJobPostingEnabled(enabled);
    }
    log(`control.${control}`, control, `${label} ${enabled ? "enabled" : "disabled"}`);
  }

  if (currentAdmin.role !== "admin") {
    return (
      <section className="admin-empty" aria-live="polite">
        <h2>403</h2>
        <p>Admin access required.</p>
      </section>
    );
  }

  return (
    <section className="admin-shell" aria-label="Admin operations panel">
      <div className="admin-titlebar">
        <div>
          <h2>Admin Operations</h2>
          <p>Review marketplace risk, settle disputes, and control platform intake.</p>
        </div>
        <button type="button" onClick={() => log("metrics.refresh", "dashboard", "Manual refresh requested")}>
          Refresh
        </button>
      </div>

      <div className="metric-grid" aria-label="Trust and platform metrics">
        {[
          ["Total users", users.length],
          ["Active jobs", 4],
          ["Open disputes", openDisputes],
          ["Flagged listings", jobs.filter((job) => job.status !== "approved").length],
          ["Revenue", "$128.9k"]
        ].map(([label, value]) => (
          <article className="metric-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <section className="admin-section" aria-labelledby="trust-heading">
        <h3 id="trust-heading">Trust Distribution</h3>
        <div className="trust-bars">
          {trustBands.map((band) => (
            <div key={band.label}>
              <span>{band.label}</span>
              <div aria-label={`${band.count} users in trust band ${band.label}`}>
                <i style={{ width: `${Math.max(band.count * 28, 8)}%` }} />
              </div>
              <b>{band.count}</b>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-section" aria-labelledby="users-heading">
        <div className="admin-section-title">
          <h3 id="users-heading">User Management</h3>
          <span>Page 1 of 1</span>
        </div>
        <div className="admin-filters">
          <input aria-label="Search users" value={search} onChange={(event) => setSearch(event.target.value)} />
          <select aria-label="Filter by role" value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="all">All roles</option>
            <option value="client">Clients</option>
            <option value="freelancer">Freelancers</option>
          </select>
          <select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
        </div>
        <div className="admin-table" role="table" aria-label="Users">
          <div role="row">
            <span>Name</span>
            <span>Role</span>
            <span>Status</span>
            <span>Trust</span>
            <span>Actions</span>
          </div>
          {visibleUsers.map((user) => (
            <div role="row" key={user.id}>
              <button type="button" onClick={() => setSelectedUser(user)}>
                {user.name}
              </button>
              <span>{user.role}</span>
              <span>{user.status}</span>
              <span>{user.trust}</span>
              <span>
                <button type="button" onClick={() => setUserStatus(user.id, "suspended")}>
                  Suspend
                </button>
                <button type="button" onClick={() => setUserStatus(user.id, "active")}>
                  Reinstate
                </button>
                <button type="button" onClick={() => setUserStatus(user.id, "banned")}>
                  Ban
                </button>
              </span>
            </div>
          ))}
        </div>
        <aside className="admin-detail" aria-label="Selected user profile">
          <strong>{selectedUser.name}</strong>
          <span>{selectedUser.role}</span>
          <span>Joined {selectedUser.joinedAt}</span>
          <span>{selectedUser.activeJobs} active jobs</span>
          <span>{selectedUser.disputes} disputes</span>
        </aside>
      </section>

      <section className="admin-section two-column" aria-label="Moderation and disputes">
        <div>
          <h3>Job Moderation</h3>
          {jobs.map((job) => (
            <article className="admin-item" key={job.id}>
              <strong>{job.title}</strong>
              <span>{job.reason}</span>
              <small>{job.status}</small>
              <div>
                <button type="button" onClick={() => moderate(job.id, "approved")}>
                  Approve
                </button>
                <button type="button" onClick={() => moderate(job.id, "rejected")}>
                  Reject
                </button>
                <button type="button" onClick={() => moderate(job.id, "escalated")}>
                  Escalate
                </button>
              </div>
            </article>
          ))}
        </div>
        <div>
          <h3>Dispute Resolution</h3>
          {disputes.map((dispute) => (
            <article className="admin-item" key={dispute.id}>
              <strong>{dispute.job}</strong>
              <span>{dispute.amount} · {dispute.evidence}</span>
              <small>{dispute.status}</small>
              <div>
                <button type="button" onClick={() => rule(dispute.id, "client")}>
                  Client
                </button>
                <button type="button" onClick={() => rule(dispute.id, "freelancer")}>
                  Freelancer
                </button>
                <button type="button" onClick={() => rule(dispute.id, "refund")}>
                  Refund
                </button>
                <button type="button" onClick={() => rule(dispute.id, "escalate")}>
                  Senior
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-section two-column" aria-label="Platform controls and audit log">
        <div>
          <h3>Platform Controls</h3>
          <label className="admin-toggle">
            <input
              type="checkbox"
              checked={registrationsEnabled}
              onChange={(event) => toggleControl("registrations", event.target.checked)}
            />
            New user registrations
          </label>
          <label className="admin-toggle">
            <input
              type="checkbox"
              checked={jobPostingEnabled}
              onChange={(event) => toggleControl("jobs", event.target.checked)}
            />
            New job postings
          </label>
        </div>
        <div>
          <div className="admin-section-title">
            <h3>Audit Log</h3>
            <input
              aria-label="Filter audit log by action"
              value={auditFilter}
              onChange={(event) => setAuditFilter(event.target.value)}
            />
          </div>
          <ol className="audit-list">
            {filteredAudit.map((entry) => (
              <li key={entry.id}>
                <strong>{entry.actionType}</strong>
                <span>{entry.details}</span>
                <small>{entry.adminId}</small>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </section>
  );
}
