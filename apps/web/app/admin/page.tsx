"use client";

import { useMemo, useState } from "react";

type UserStatus = "active" | "under_review" | "suspended" | "banned";
type Role = "admin" | "client" | "freelancer";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: Exclude<Role, "admin">;
  status: UserStatus;
  joinedAt: string;
  trustScore: number;
  activeJobs: string[];
  disputeHistory: string[];
};

type ModerationJob = {
  id: string;
  title: string;
  poster: string;
  status: "flagged" | "approved" | "rejected" | "escalated";
  reason: string;
  budget: string;
};

type Dispute = {
  id: string;
  status: "open" | "under_review" | "resolved";
  client: string;
  freelancer: string;
  amount: string;
  evidence: string[];
  thread: string[];
  transaction: string;
  resolution?: string;
};

type AuditLog = {
  id: string;
  adminId: string;
  actionType: string;
  targetId: string;
  details: string;
  createdAt: string;
};

const adminId = "adm_zhengjynicolas";

const initialUsers: AdminUser[] = [
  {
    id: "usr_client_1",
    name: "Amara Li",
    email: "amara@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-03-04",
    trustScore: 91,
    activeJobs: ["job_101", "job_105"],
    disputeHistory: ["dsp_201"]
  },
  {
    id: "usr_freelancer_1",
    name: "Miles Ortega",
    email: "miles@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-02-10",
    trustScore: 84,
    activeJobs: ["job_101"],
    disputeHistory: []
  },
  {
    id: "usr_client_2",
    name: "Priya Raman",
    email: "priya@example.com",
    role: "client",
    status: "under_review",
    joinedAt: "2026-04-18",
    trustScore: 58,
    activeJobs: ["job_102"],
    disputeHistory: ["dsp_202"]
  },
  {
    id: "usr_freelancer_2",
    name: "Jon Bell",
    email: "jon@example.com",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2026-01-22",
    trustScore: 37,
    activeJobs: [],
    disputeHistory: ["dsp_202"]
  }
];

const initialJobs: ModerationJob[] = [
  {
    id: "job_101",
    title: "Build a secure billing dashboard",
    poster: "Amara Li",
    status: "flagged",
    reason: "Unusual milestone pattern",
    budget: "$6,200"
  },
  {
    id: "job_102",
    title: "Scrape private lead database",
    poster: "Priya Raman",
    status: "flagged",
    reason: "Potential data policy violation",
    budget: "$900"
  }
];

const initialDisputes: Dispute[] = [
  {
    id: "dsp_201",
    status: "open",
    client: "Amara Li",
    freelancer: "Miles Ortega",
    amount: "$2,400",
    evidence: ["scope.pdf", "milestone-two.zip"],
    thread: ["Client: Milestone two is incomplete.", "Freelancer: The deliverable is attached."],
    transaction: "txn_301"
  },
  {
    id: "dsp_202",
    status: "under_review",
    client: "Priya Raman",
    freelancer: "Jon Bell",
    amount: "$900",
    evidence: ["chat-export.txt"],
    thread: ["Freelancer: The client changed scope after delivery."],
    transaction: "txn_302"
  }
];

const initialAudit: AuditLog[] = [
  {
    id: "aud_1",
    adminId,
    actionType: "system.seed",
    targetId: "admin-panel",
    details: "Admin workspace opened",
    createdAt: "2026-05-19T00:00:00.000Z"
  }
];

function nowStamp() {
  return new Date().toISOString();
}

function StatusPill({ status }: { status: string }) {
  return <span className={`admin-pill admin-pill-${status.replace("_", "-")}`}>{status}</span>;
}

function EmptyState({ label }: { label: string }) {
  return <div className="admin-empty" role="status">{label}</div>;
}

export default function AdminPanelPage() {
  const [viewerRole, setViewerRole] = useState<Role>("admin");
  const [users, setUsers] = useState(initialUsers);
  const [jobs, setJobs] = useState(initialJobs);
  const [disputes, setDisputes] = useState(initialDisputes);
  const [auditLogs, setAuditLogs] = useState(initialAudit);
  const [registrationsEnabled, setRegistrationsEnabled] = useState(true);
  const [jobPostingsEnabled, setJobPostingsEnabled] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [auditFilter, setAuditFilter] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(initialUsers[0].id);
  const [selectedDisputeId, setSelectedDisputeId] = useState(initialDisputes[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshLabel, setRefreshLabel] = useState("Ready");

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0];
  const selectedDispute = disputes.find((dispute) => dispute.id === selectedDisputeId) ?? disputes[0];

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = `${user.name} ${user.email}`.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roleFilter, search, statusFilter, users]);

  const filteredAudit = useMemo(() => {
    return auditLogs.filter((log) => !auditFilter || log.actionType === auditFilter);
  }, [auditFilter, auditLogs]);

  const metrics = useMemo(() => {
    return {
      totalUsers: users.length,
      activeJobs: jobs.filter((job) => job.status === "approved" || job.status === "flagged").length,
      openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
      flaggedListings: jobs.filter((job) => job.status === "flagged").length,
      revenue: "$7,100"
    };
  }, [disputes, jobs, users]);

  const trustDistribution = useMemo(() => {
    return [
      { label: "0-49", count: users.filter((user) => user.trustScore < 50).length },
      { label: "50-69", count: users.filter((user) => user.trustScore >= 50 && user.trustScore < 70).length },
      { label: "70-89", count: users.filter((user) => user.trustScore >= 70 && user.trustScore < 90).length },
      { label: "90-100", count: users.filter((user) => user.trustScore >= 90).length }
    ];
  }, [users]);

  function addAudit(actionType: string, targetId: string, details: string) {
    setAuditLogs((current) => [
      { id: `aud_${current.length + 1}`, adminId, actionType, targetId, details, createdAt: nowStamp() },
      ...current
    ]);
  }

  function refreshData() {
    setError("");
    setLoading(true);
    window.setTimeout(() => {
      setRefreshLabel(`Last refreshed ${new Date().toLocaleTimeString()}`);
      setLoading(false);
    }, 350);
  }

  function updateUserStatus(userId: string, nextStatus: UserStatus) {
    setUsers((current) => current.map((user) => (user.id === userId ? { ...user, status: nextStatus } : user)));
    addAudit(`user.${nextStatus}`, userId, `Status changed to ${nextStatus}`);
  }

  function moderateJob(jobId: string, status: ModerationJob["status"]) {
    setJobs((current) => current.map((job) => (
      job.id === jobId ? { ...job, status, reason: status === "rejected" ? "Rejected: policy mismatch" : job.reason } : job
    )));
    addAudit(`job.${status}`, jobId, status === "rejected" ? "Posting user notified with rejection reason" : `Listing moved to ${status}`);
  }

  function ruleDispute(disputeId: string, resolution: string) {
    setDisputes((current) => current.map((dispute) => (
      dispute.id === disputeId
        ? { ...dispute, status: resolution === "escalate" ? "under_review" : "resolved", resolution }
        : dispute
    )));
    addAudit(`dispute.${resolution}`, disputeId, "Both parties notified");
  }

  function toggleControl(name: "registrations" | "jobs") {
    const confirmed = window.confirm(`Apply change to ${name}?`);
    if (!confirmed) {
      return;
    }

    if (name === "registrations") {
      setRegistrationsEnabled((value) => !value);
      addAudit("control.registrations", "registrationsEnabled", `Set to ${!registrationsEnabled}`);
      return;
    }

    setJobPostingsEnabled((value) => !value);
    addAudit("control.jobPostings", "jobPostingsEnabled", `Set to ${!jobPostingsEnabled}`);
  }

  if (viewerRole !== "admin") {
    return (
      <section className="admin-shell" aria-labelledby="admin-denied-heading">
        <div className="admin-toolbar">
          <label>
            Viewer role
            <select value={viewerRole} onChange={(event) => setViewerRole(event.target.value as Role)}>
              <option value="admin">admin</option>
              <option value="client">client</option>
              <option value="freelancer">freelancer</option>
            </select>
          </label>
        </div>
        <div className="admin-denied" role="alert">
          <strong id="admin-denied-heading">403</strong>
          <p>Admin access required.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-shell" aria-labelledby="admin-heading">
      <div className="admin-toolbar">
        <div>
          <h2 id="admin-heading">Admin Command Center</h2>
          <p>{loading ? "Refreshing admin data..." : refreshLabel}</p>
        </div>
        <label>
          Viewer role
          <select value={viewerRole} onChange={(event) => setViewerRole(event.target.value as Role)}>
            <option value="admin">admin</option>
            <option value="client">client</option>
            <option value="freelancer">freelancer</option>
          </select>
        </label>
        <button type="button" onClick={refreshData} aria-label="Refresh admin data">Refresh</button>
      </div>

      {error ? <div className="admin-error" role="alert">{error}</div> : null}

      <div className="admin-metrics" aria-label="Platform metrics">
        {Object.entries(metrics).map(([label, value]) => (
          <article className="admin-card" key={label}>
            <span>{label.replace(/([A-Z])/g, " $1")}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <div className="admin-layout">
        <section className="admin-panel" aria-labelledby="users-heading">
          <div className="admin-section-head">
            <h3 id="users-heading">Users</h3>
            <div className="admin-filters">
              <label>
                Search
                <input value={search} onChange={(event) => setSearch(event.target.value)} />
              </label>
              <label>
                Role
                <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                  <option value="all">all</option>
                  <option value="client">client</option>
                  <option value="freelancer">freelancer</option>
                </select>
              </label>
              <label>
                Status
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="all">all</option>
                  <option value="active">active</option>
                  <option value="under_review">under_review</option>
                  <option value="suspended">suspended</option>
                  <option value="banned">banned</option>
                </select>
              </label>
            </div>
          </div>
          {filteredUsers.length === 0 ? (
            <EmptyState label="No users match the current filters." />
          ) : (
            <div className="admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.slice(0, 5).map((user) => (
                    <tr key={user.id}>
                      <td>
                        <button type="button" className="admin-link-button" onClick={() => setSelectedUserId(user.id)}>
                          {user.name}
                        </button>
                        <small>{user.email}</small>
                      </td>
                      <td>{user.role}</td>
                      <td><StatusPill status={user.status} /></td>
                      <td>{user.joinedAt}</td>
                      <td>
                        <div className="admin-row-actions">
                          <button type="button" onClick={() => updateUserStatus(user.id, "suspended")} aria-label={`Suspend ${user.name}`}>Suspend</button>
                          <button type="button" onClick={() => updateUserStatus(user.id, "active")} aria-label={`Reinstate ${user.name}`}>Reinstate</button>
                          <button type="button" onClick={() => updateUserStatus(user.id, "banned")} aria-label={`Ban ${user.name}`}>Ban</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="admin-detail">
            <strong>{selectedUser.name}</strong>
            <span>Trust {selectedUser.trustScore}</span>
            <span>Active jobs: {selectedUser.activeJobs.join(", ") || "none"}</span>
            <span>Disputes: {selectedUser.disputeHistory.join(", ") || "none"}</span>
          </div>
        </section>

        <section className="admin-panel" aria-labelledby="moderation-heading">
          <h3 id="moderation-heading">Moderation</h3>
          {jobs.length === 0 ? (
            <EmptyState label="No flagged listings." />
          ) : (
            <div className="admin-stack">
              {jobs.map((job) => (
                <article className="admin-list-item" key={job.id}>
                  <div>
                    <strong>{job.title}</strong>
                    <span>{job.poster} · {job.budget}</span>
                    <span>{job.reason}</span>
                  </div>
                  <StatusPill status={job.status} />
                  <div className="admin-row-actions">
                    <button type="button" onClick={() => moderateJob(job.id, "approved")} aria-label={`Approve ${job.title}`}>Approve</button>
                    <button type="button" onClick={() => moderateJob(job.id, "rejected")} aria-label={`Reject ${job.title}`}>Reject</button>
                    <button type="button" onClick={() => moderateJob(job.id, "escalated")} aria-label={`Escalate ${job.title}`}>Escalate</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="admin-panel" aria-labelledby="disputes-heading">
          <h3 id="disputes-heading">Disputes</h3>
          <div className="admin-stack">
            {disputes.map((dispute) => (
              <button
                className="admin-dispute-button"
                key={dispute.id}
                type="button"
                onClick={() => setSelectedDisputeId(dispute.id)}
                aria-label={`Open dispute ${dispute.id}`}
              >
                <span>{dispute.id} · {dispute.amount}</span>
                <StatusPill status={dispute.status} />
              </button>
            ))}
          </div>
          <div className="admin-detail">
            <strong>{selectedDispute.client} vs {selectedDispute.freelancer}</strong>
            <span>Transaction: {selectedDispute.transaction}</span>
            <span>Evidence: {selectedDispute.evidence.join(", ")}</span>
            {selectedDispute.thread.map((message) => <span key={message}>{message}</span>)}
            <div className="admin-row-actions">
              <button type="button" onClick={() => ruleDispute(selectedDispute.id, "client")}>Rule client</button>
              <button type="button" onClick={() => ruleDispute(selectedDispute.id, "freelancer")}>Rule freelancer</button>
              <button type="button" onClick={() => ruleDispute(selectedDispute.id, "refund")}>Refund</button>
              <button type="button" onClick={() => ruleDispute(selectedDispute.id, "escalate")}>Escalate</button>
            </div>
          </div>
        </section>

        <section className="admin-panel" aria-labelledby="controls-heading">
          <h3 id="controls-heading">Controls</h3>
          <div className="admin-controls">
            <button type="button" onClick={() => toggleControl("registrations")} aria-pressed={registrationsEnabled}>
              Registrations {registrationsEnabled ? "enabled" : "disabled"}
            </button>
            <button type="button" onClick={() => toggleControl("jobs")} aria-pressed={jobPostingsEnabled}>
              Job posting {jobPostingsEnabled ? "enabled" : "disabled"}
            </button>
          </div>
          <div className="admin-chart" aria-label="Trust score distribution">
            {trustDistribution.map((bucket) => (
              <div className="admin-bar-row" key={bucket.label}>
                <span>{bucket.label}</span>
                <div><i style={{ width: `${Math.max(bucket.count * 24, 8)}%` }} /></div>
                <strong>{bucket.count}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel admin-panel-wide" aria-labelledby="audit-heading">
          <div className="admin-section-head">
            <h3 id="audit-heading">Audit Log</h3>
            <label>
              Action
              <select value={auditFilter} onChange={(event) => setAuditFilter(event.target.value)}>
                <option value="">all</option>
                {[...new Set(auditLogs.map((log) => log.actionType))].map((action) => (
                  <option value={action} key={action}>{action}</option>
                ))}
              </select>
            </label>
          </div>
          {filteredAudit.length === 0 ? (
            <EmptyState label="No audit events match the current filter." />
          ) : (
            <div className="admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Admin</th>
                    <th>Action</th>
                    <th>Target</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAudit.slice(0, 8).map((log) => (
                    <tr key={log.id}>
                      <td>{new Date(log.createdAt).toLocaleTimeString()}</td>
                      <td>{log.adminId}</td>
                      <td>{log.actionType}</td>
                      <td>{log.targetId}</td>
                      <td>{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
