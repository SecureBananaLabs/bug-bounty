"use client";

import { useMemo, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
  trustScore: number;
  activeJobs: string[];
  disputes: string[];
};

type ModerationJob = {
  id: string;
  title: string;
  postedByName: string;
  status: string;
  reason: string;
  reports: number;
  flaggedAt: string;
};

type Dispute = {
  id: string;
  clientName: string;
  freelancerName: string;
  jobTitle: string;
  status: string;
  amountCents: number;
  openedAt: string;
  thread: string[];
  evidence: string[];
  transaction: string;
};

type AuditEntry = {
  id: string;
  adminId: string;
  actionType: string;
  target: string;
  createdAt: string;
};

type AdminPanelSnapshot = {
  session: { adminId: string };
  users: User[];
  moderationJobs: ModerationJob[];
  disputes: Dispute[];
  controls: {
    registrationsEnabled: boolean;
    jobPostingsEnabled: boolean;
  };
  auditLog: AuditEntry[];
};

type Filters = {
  search: string;
  role: string;
  status: string;
  joinedFrom: string;
  joinedTo: string;
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

function dollars(cents: number) {
  return money.format(cents / 100);
}

function formatAuditTime(isoDate: string) {
  return isoDate.replace("T", " ").slice(0, 16);
}

function nextAudit(adminId: string, actionType: string, target: string): AuditEntry {
  return {
    id: `aud_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    adminId,
    actionType,
    target,
    createdAt: new Date().toISOString()
  };
}

function StatusBadge({ value }: { value: string }) {
  return <span className={`status-badge status-${value.replace("_", "-")}`}>{value.replace("_", " ")}</span>;
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="admin-empty" role="status">
      {label}
    </div>
  );
}

export function AdminPanel({ initialState }: { initialState: AdminPanelSnapshot }) {
  const [users, setUsers] = useState(initialState.users);
  const [jobs, setJobs] = useState(initialState.moderationJobs);
  const [disputes, setDisputes] = useState(initialState.disputes);
  const [controls, setControls] = useState(initialState.controls);
  const [auditLog, setAuditLog] = useState(initialState.auditLog);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    role: "all",
    status: "all",
    joinedFrom: "",
    joinedTo: ""
  });
  const [selectedUserId, setSelectedUserId] = useState(initialState.users[0]?.id ?? "");
  const [selectedDisputeId, setSelectedDisputeId] = useState(initialState.disputes[0]?.id ?? "");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const adminId = initialState.session.adminId;

  const filteredUsers = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return users.filter((user) => {
      if (filters.role !== "all" && user.role !== filters.role) return false;
      if (filters.status !== "all" && user.status !== filters.status) return false;
      if (filters.joinedFrom && user.joinedAt < filters.joinedFrom) return false;
      if (filters.joinedTo && user.joinedAt > filters.joinedTo) return false;
      if (search) {
        const haystack = `${user.name} ${user.email} ${user.id}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
  }, [filters, users]);

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0];
  const selectedDispute = disputes.find((dispute) => dispute.id === selectedDisputeId) ?? disputes[0];
  const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
  const flaggedListings = jobs.filter((job) => job.status === "pending").length;
  const activeJobs = users.reduce((sum, user) => sum + user.activeJobs.length, 0);
  const trustBuckets = [
    { label: "0-49", count: users.filter((user) => user.trustScore <= 49).length },
    { label: "50-74", count: users.filter((user) => user.trustScore >= 50 && user.trustScore <= 74).length },
    { label: "75-89", count: users.filter((user) => user.trustScore >= 75 && user.trustScore <= 89).length },
    { label: "90-100", count: users.filter((user) => user.trustScore >= 90).length }
  ];

  function pushAudit(actionType: string, target: string) {
    setAuditLog((entries) => [nextAudit(adminId, actionType, target), ...entries]);
  }

  function handleRefresh() {
    setError("");
    setIsRefreshing(true);
    window.setTimeout(() => setIsRefreshing(false), 300);
  }

  function updateUser(userId: string, action: "suspend" | "reinstate" | "ban") {
    const nextStatus = action === "reinstate" ? "active" : action === "ban" ? "banned" : "suspended";
    setUsers((items) => items.map((user) => (user.id === userId ? { ...user, status: nextStatus } : user)));
    pushAudit(`user_${action}`, userId);
  }

  function moderateJob(jobId: string, action: "approve" | "reject" | "escalate") {
    const nextStatus = action === "approve" ? "approved" : action === "reject" ? "rejected" : "escalated";
    setJobs((items) => items.map((job) => (job.id === jobId ? { ...job, status: nextStatus } : job)));
    pushAudit(`job_${action}`, jobId);
  }

  function ruleDispute(disputeId: string, action: "favor_client" | "favor_freelancer" | "refund" | "escalate") {
    const nextStatus = action === "escalate" ? "under_review" : "resolved";
    setDisputes((items) =>
      items.map((dispute) => (dispute.id === disputeId ? { ...dispute, status: nextStatus } : dispute))
    );
    pushAudit(`dispute_${action}`, disputeId);
  }

  function toggleControl(key: "registrationsEnabled" | "jobPostingsEnabled") {
    const label = key === "registrationsEnabled" ? "new registrations" : "new job postings";
    if (!window.confirm(`Confirm change to ${label}?`)) return;
    setControls((current) => ({ ...current, [key]: !current[key] }));
    pushAudit("platform_controls_update", key);
  }

  return (
    <section className="admin-panel" aria-labelledby="admin-title">
      <div className="admin-toolbar">
        <div>
          <p className="eyebrow">Admin workspace</p>
          <h2 id="admin-title">Operations Control</h2>
        </div>
        <button className="admin-button primary" type="button" onClick={handleRefresh} aria-label="Refresh admin data">
          {isRefreshing ? "Refreshing" : "Refresh"}
        </button>
      </div>

      {error ? <div className="admin-error" role="alert">{error}</div> : null}

      <div className="metric-grid" aria-live="polite">
        <article>
          <span>Total users</span>
          <strong>{users.length}</strong>
        </article>
        <article>
          <span>Active jobs</span>
          <strong>{activeJobs}</strong>
        </article>
        <article>
          <span>Open disputes</span>
          <strong>{openDisputes}</strong>
        </article>
        <article>
          <span>Flagged listings</span>
          <strong>{flaggedListings}</strong>
        </article>
        <article>
          <span>Revenue</span>
          <strong>{money.format(128900)}</strong>
        </article>
      </div>

      <div className="admin-grid two">
        <section className="admin-section" aria-labelledby="trust-heading">
          <h3 id="trust-heading">Trust Distribution</h3>
          <div className="trust-chart" role="img" aria-label="Trust score distribution across users">
            {trustBuckets.map((bucket) => (
              <div key={bucket.label} className="trust-row">
                <span>{bucket.label}</span>
                <div>
                  <i style={{ width: `${Math.max(bucket.count * 30, 8)}%` }} />
                </div>
                <b>{bucket.count}</b>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-section" aria-labelledby="controls-heading">
          <h3 id="controls-heading">Platform Controls</h3>
          <div className="control-row">
            <span>New registrations</span>
            <button
              type="button"
              className="admin-button"
              aria-pressed={controls.registrationsEnabled}
              onClick={() => toggleControl("registrationsEnabled")}
            >
              {controls.registrationsEnabled ? "Enabled" : "Disabled"}
            </button>
          </div>
          <div className="control-row">
            <span>New job postings</span>
            <button
              type="button"
              className="admin-button"
              aria-pressed={controls.jobPostingsEnabled}
              onClick={() => toggleControl("jobPostingsEnabled")}
            >
              {controls.jobPostingsEnabled ? "Enabled" : "Disabled"}
            </button>
          </div>
        </section>
      </div>

      <section className="admin-section" aria-labelledby="users-heading">
        <div className="section-head">
          <h3 id="users-heading">User Management</h3>
          <span>Page 1 of {Math.max(Math.ceil(filteredUsers.length / 10), 1)}</span>
        </div>
        <div className="filter-bar">
          <label>
            Search
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              aria-label="Search users"
            />
          </label>
          <label>
            Role
            <select
              value={filters.role}
              onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))}
              aria-label="Filter users by role"
            >
              <option value="all">All</option>
              <option value="client">Client</option>
              <option value="freelancer">Freelancer</option>
            </select>
          </label>
          <label>
            Status
            <select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              aria-label="Filter users by status"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="under_review">Under review</option>
              <option value="banned">Banned</option>
            </select>
          </label>
          <label>
            Joined from
            <input
              type="date"
              value={filters.joinedFrom}
              onChange={(event) => setFilters((current) => ({ ...current, joinedFrom: event.target.value }))}
              aria-label="Filter users joined after"
            />
          </label>
          <label>
            Joined to
            <input
              type="date"
              value={filters.joinedTo}
              onChange={(event) => setFilters((current) => ({ ...current, joinedTo: event.target.value }))}
              aria-label="Filter users joined before"
            />
          </label>
        </div>

        {filteredUsers.length === 0 ? (
          <EmptyState label="No users match these filters." />
        ) : (
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
                      <button type="button" className="link-button" onClick={() => setSelectedUserId(user.id)}>
                        {user.name}
                      </button>
                      <small>{user.email}</small>
                    </td>
                    <td>{user.role}</td>
                    <td><StatusBadge value={user.status} /></td>
                    <td>{user.joinedAt}</td>
                    <td>{user.trustScore}</td>
                    <td className="action-cell">
                      <button type="button" className="admin-button" onClick={() => updateUser(user.id, "suspend")}>
                        Suspend
                      </button>
                      <button type="button" className="admin-button" onClick={() => updateUser(user.id, "reinstate")}>
                        Reinstate
                      </button>
                      <button type="button" className="admin-button danger" onClick={() => updateUser(user.id, "ban")}>
                        Ban
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedUser ? (
          <aside className="detail-panel" aria-label="Selected user profile">
            <h4>{selectedUser.name}</h4>
            <p>{selectedUser.role} profile with {selectedUser.activeJobs.length} active jobs and {selectedUser.disputes.length} dispute records.</p>
            <dl>
              <dt>Active jobs</dt>
              <dd>{selectedUser.activeJobs.join(", ") || "None"}</dd>
              <dt>Dispute history</dt>
              <dd>{selectedUser.disputes.join(", ") || "None"}</dd>
            </dl>
          </aside>
        ) : null}
      </section>

      <section className="admin-section" aria-labelledby="moderation-heading">
        <h3 id="moderation-heading">Job Moderation</h3>
        {jobs.length === 0 ? (
          <EmptyState label="No flagged jobs are waiting." />
        ) : (
          <div className="queue-grid">
            {jobs.map((job) => (
              <article key={job.id} className="queue-item">
                <div>
                  <h4>{job.title}</h4>
                  <p>{job.reason}</p>
                  <span>{job.reports} reports by {job.flaggedAt}</span>
                </div>
                <StatusBadge value={job.status} />
                <div className="action-cell">
                  <button type="button" className="admin-button" onClick={() => moderateJob(job.id, "approve")}>
                    Approve
                  </button>
                  <button type="button" className="admin-button danger" onClick={() => moderateJob(job.id, "reject")}>
                    Reject
                  </button>
                  <button type="button" className="admin-button" onClick={() => moderateJob(job.id, "escalate")}>
                    Escalate
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="admin-section" aria-labelledby="disputes-heading">
        <h3 id="disputes-heading">Dispute Resolution</h3>
        <div className="queue-grid">
          {disputes.map((dispute) => (
            <article key={dispute.id} className="queue-item">
              <div>
                <h4>{dispute.jobTitle}</h4>
                <p>{dispute.clientName} vs {dispute.freelancerName}</p>
                <span>{dollars(dispute.amountCents)} opened {dispute.openedAt}</span>
              </div>
              <StatusBadge value={dispute.status} />
              <button type="button" className="admin-button" onClick={() => setSelectedDisputeId(dispute.id)}>
                View
              </button>
            </article>
          ))}
        </div>
        {selectedDispute ? (
          <aside className="detail-panel" aria-label="Selected dispute thread">
            <h4>{selectedDispute.jobTitle}</h4>
            <p>{selectedDispute.transaction}</p>
            <ul>
              {selectedDispute.thread.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <p>Evidence: {selectedDispute.evidence.join(", ")}</p>
            <div className="action-cell">
              <button type="button" className="admin-button" onClick={() => ruleDispute(selectedDispute.id, "favor_client")}>
                Favor Client
              </button>
              <button type="button" className="admin-button" onClick={() => ruleDispute(selectedDispute.id, "favor_freelancer")}>
                Favor Freelancer
              </button>
              <button type="button" className="admin-button" onClick={() => ruleDispute(selectedDispute.id, "refund")}>
                Refund
              </button>
              <button type="button" className="admin-button" onClick={() => ruleDispute(selectedDispute.id, "escalate")}>
                Escalate
              </button>
            </div>
          </aside>
        ) : null}
      </section>

      <section className="admin-section" aria-labelledby="audit-heading">
        <div className="section-head">
          <h3 id="audit-heading">Audit Log</h3>
          <span>Page 1 of {Math.max(Math.ceil(auditLog.length / 10), 1)}</span>
        </div>
        {auditLog.length === 0 ? (
          <EmptyState label="No admin actions have been logged." />
        ) : (
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
                {auditLog.slice(0, 10).map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatAuditTime(entry.createdAt)}</td>
                    <td>{entry.adminId}</td>
                    <td>{entry.actionType}</td>
                    <td>{entry.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
