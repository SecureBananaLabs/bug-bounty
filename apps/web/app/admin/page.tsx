"use client";

import { useMemo, useState } from "react";

type UserStatus = "active" | "suspended" | "banned";
type UserRole = "client" | "freelancer";
type ModerationStatus = "flagged" | "under_review" | "approved" | "rejected" | "escalated";
type DisputeStatus = "open" | "under_review" | "resolved";

type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
  trustScore: number;
  activeJobs: number;
  disputes: number;
};

type ModerationJob = {
  id: string;
  title: string;
  clientName: string;
  reason: string;
  status: ModerationStatus;
};

type Dispute = {
  id: string;
  jobId: string;
  status: DisputeStatus;
  amount: number;
  summary: string;
  evidence: string[];
};

type AuditEntry = {
  id: string;
  admin: string;
  action: string;
  target: string;
  summary: string;
  at: string;
};

const initialUsers: User[] = [
  {
    id: "usr_1001",
    name: "Maya Ortiz",
    email: "maya@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-05-01",
    trustScore: 92,
    activeJobs: 3,
    disputes: 0
  },
  {
    id: "usr_1002",
    name: "Theo Banks",
    email: "theo@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-05-03",
    trustScore: 86,
    activeJobs: 2,
    disputes: 1
  },
  {
    id: "usr_1003",
    name: "Rin Carter",
    email: "rin@example.com",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2026-05-04",
    trustScore: 41,
    activeJobs: 0,
    disputes: 2
  },
  {
    id: "usr_1004",
    name: "Ari Singh",
    email: "ari@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-05-07",
    trustScore: 78,
    activeJobs: 1,
    disputes: 1
  }
];

const initialModeration: ModerationJob[] = [
  {
    id: "job_2001",
    title: "Scrape private marketplace leads",
    clientName: "Ari Singh",
    reason: "Automated rule flagged private-data scraping language",
    status: "flagged"
  },
  {
    id: "job_2002",
    title: "Emergency payment integration",
    clientName: "Maya Ortiz",
    reason: "User report: unclear escrow terms",
    status: "under_review"
  }
];

const initialDisputes: Dispute[] = [
  {
    id: "dsp_3001",
    jobId: "job_2002",
    status: "open",
    amount: 850,
    summary: "Milestone completion dispute with API-test evidence.",
    evidence: ["handoff.md", "api-test-output.txt"]
  },
  {
    id: "dsp_3002",
    jobId: "job_2003",
    status: "under_review",
    amount: 420,
    summary: "Copied-work claim with commit history attached.",
    evidence: ["commit-log.txt", "screen-recording.mp4"]
  }
];

export default function AdminPanelPage() {
  const [users, setUsers] = useState(initialUsers);
  const [moderation, setModeration] = useState(initialModeration);
  const [disputes, setDisputes] = useState(initialDisputes);
  const [registrationsEnabled, setRegistrationsEnabled] = useState(true);
  const [jobPostingsEnabled, setJobPostingsEnabled] = useState(true);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");
  const [joinedAfter, setJoinedAfter] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(initialUsers[0]?.id ?? "");
  const [auditFilter, setAuditFilter] = useState("all");
  const [auditAdminFilter, setAuditAdminFilter] = useState("");
  const [auditFrom, setAuditFrom] = useState("");
  const [auditTo, setAuditTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [audit, setAudit] = useState<AuditEntry[]>([
    {
      id: "aud_1",
      admin: "admin_test",
      action: "control.updated",
      target: "registrations",
      summary: "Registrations enabled",
      at: "2026-05-18T12:00:00.000Z"
    }
  ]);

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesQuery =
        !normalized ||
        user.name.toLowerCase().includes(normalized) ||
        user.email.toLowerCase().includes(normalized) ||
        user.id.toLowerCase().includes(normalized);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      const matchesJoinedAfter = !joinedAfter || new Date(user.joinedAt) >= new Date(joinedAfter);
      return matchesQuery && matchesRole && matchesStatus && matchesJoinedAfter;
    });
  }, [joinedAfter, query, roleFilter, statusFilter, users]);

  const metrics = useMemo(() => {
    const trust = {
      high: users.filter((user) => user.trustScore >= 80).length,
      medium: users.filter((user) => user.trustScore >= 50 && user.trustScore < 80).length,
      low: users.filter((user) => user.trustScore < 50).length
    };

    return {
      totalUsers: users.length,
      activeJobs: users.reduce((sum, user) => sum + user.activeJobs, 0),
      openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
      flaggedListings: moderation.filter((job) => job.status !== "approved").length,
      revenue: "$128.9K",
      trust
    };
  }, [disputes, moderation, users]);

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0];
  const filteredAudit = audit.filter((entry) => {
    const matchesAction = auditFilter === "all" || entry.action === auditFilter;
    const matchesAdmin =
      !auditAdminFilter || entry.admin.toLowerCase().includes(auditAdminFilter.trim().toLowerCase());
    const entryDate = new Date(entry.at);
    const matchesFrom = !auditFrom || entryDate >= new Date(auditFrom);
    const matchesTo = !auditTo || entryDate <= new Date(`${auditTo}T23:59:59`);
    return matchesAction && matchesAdmin && matchesFrom && matchesTo;
  });

  function log(action: string, target: string, summary: string) {
    setAudit((entries) => [
      {
        id: `aud_${entries.length + 1}`,
        admin: "admin_test",
        action,
        target,
        summary,
        at: new Date().toISOString()
      },
      ...entries
    ]);
  }

  function setUserStatus(userId: string, status: UserStatus) {
    setUsers((items) =>
      items.map((user) => (user.id === userId ? { ...user, status } : user))
    );
    log("user.status_updated", userId, `User marked ${status}`);
  }

  function decideListing(jobId: string, status: ModerationStatus) {
    setModeration((items) =>
      items.map((job) => (job.id === jobId ? { ...job, status } : job))
    );
    log("listing.moderated", jobId, `Listing ${status}`);
  }

  function ruleDispute(disputeId: string, ruling: "client" | "freelancer" | "senior_admin") {
    setDisputes((items) =>
      items.map((dispute) =>
        dispute.id === disputeId
          ? { ...dispute, status: ruling === "senior_admin" ? "under_review" : "resolved" }
          : dispute
      )
    );
    log("dispute.ruled", disputeId, `Ruling: ${ruling}`);
  }

  function toggleControl(control: "registrations" | "jobPostings") {
    const label = control === "registrations" ? "new user registrations" : "new job postings";
    if (!window.confirm(`Change ${label}?`)) return;

    if (control === "registrations") {
      setRegistrationsEnabled((value) => {
        log("control.updated", control, `Registrations ${value ? "disabled" : "enabled"}`);
        return !value;
      });
      return;
    }

    setJobPostingsEnabled((value) => {
      log("control.updated", control, `Job postings ${value ? "disabled" : "enabled"}`);
      return !value;
    });
  }

  function refresh() {
    setLoading(true);
    setError("");
    window.setTimeout(() => setLoading(false), 250);
  }

  return (
    <section className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">FreelanceFlow ops</p>
          <h1>Admin Panel</h1>
        </div>
        <div className="admin-actions">
          <span className="status-pill">Admin session</span>
          <button type="button" onClick={refresh} aria-label="Refresh admin data">
            Refresh
          </button>
        </div>
      </header>

      {loading ? <div className="notice">Refreshing admin data...</div> : null}
      {error ? <div className="notice error">{error}</div> : null}

      <div className="metric-grid" aria-label="Admin metrics">
        <Metric label="Total users" value={metrics.totalUsers} />
        <Metric label="Active jobs" value={metrics.activeJobs} />
        <Metric label="Open disputes" value={metrics.openDisputes} />
        <Metric label="Flagged listings" value={metrics.flaggedListings} />
        <Metric label="Revenue" value={metrics.revenue} />
      </div>

      <section className="admin-panel">
        <div>
          <h2>Trust Distribution</h2>
          <div className="trust-bars" aria-label="Trust score distribution">
            <TrustBar label="High" count={metrics.trust.high} tone="good" />
            <TrustBar label="Medium" count={metrics.trust.medium} tone="warn" />
            <TrustBar label="Low" count={metrics.trust.low} tone="bad" />
          </div>
        </div>
        <div>
          <h2>Platform Controls</h2>
          <div className="control-row">
            <span>New registrations</span>
            <button type="button" onClick={() => toggleControl("registrations")}>
              {registrationsEnabled ? "Enabled" : "Disabled"}
            </button>
          </div>
          <div className="control-row">
            <span>New job postings</span>
            <button type="button" onClick={() => toggleControl("jobPostings")}>
              {jobPostingsEnabled ? "Enabled" : "Disabled"}
            </button>
          </div>
        </div>
      </section>

      <section className="admin-panel">
        <div className="section-heading">
          <h2>User Management</h2>
          <div className="filters">
            <input
              aria-label="Search users"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
            />
            <select
              aria-label="Filter by role"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as "all" | UserRole)}
            >
              <option value="all">All roles</option>
              <option value="client">Clients</option>
              <option value="freelancer">Freelancers</option>
            </select>
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | UserStatus)}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
            <input
              aria-label="Filter by join date"
              type="date"
              value={joinedAfter}
              onChange={(event) => setJoinedAfter(event.target.value)}
            />
          </div>
        </div>
        {filteredUsers.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Trust</th>
                  <th>Jobs</th>
                  <th>Disputes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </td>
                    <td>{user.role}</td>
                    <td>
                      <span className={`badge ${user.status}`}>{user.status}</span>
                    </td>
                    <td>{user.joinedAt}</td>
                    <td>{user.trustScore}</td>
                    <td>{user.activeJobs}</td>
                    <td>{user.disputes}</td>
                    <td>
                      <div className="button-row">
                        <button type="button" onClick={() => setSelectedUserId(user.id)}>
                          View
                        </button>
                        <button type="button" onClick={() => setUserStatus(user.id, "active")}>
                          Reinstate
                        </button>
                        <button type="button" onClick={() => setUserStatus(user.id, "suspended")}>
                          Suspend
                        </button>
                        <button type="button" onClick={() => setUserStatus(user.id, "banned")}>
                          Ban
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">No users match the current filters.</div>
        )}
        {selectedUser ? (
          <article className="detail-panel" aria-label="Selected user profile">
            <div>
              <span>Profile</span>
              <strong>{selectedUser.name}</strong>
              <p>{selectedUser.email}</p>
            </div>
            <div>
              <span>Active jobs</span>
              <strong>{selectedUser.activeJobs}</strong>
              <p>{selectedUser.role === "client" ? "Client-side postings" : "Freelancer engagements"}</p>
            </div>
            <div>
              <span>Dispute history</span>
              <strong>{selectedUser.disputes}</strong>
              <p>Status: {selectedUser.status}</p>
            </div>
          </article>
        ) : null}
      </section>

      <section className="admin-panel">
        <h2>Job Moderation</h2>
        <div className="queue">
          {moderation.map((job) => (
            <article key={job.id} className="queue-item">
              <div>
                <strong>{job.title}</strong>
                <p>{job.reason}</p>
                <span>{job.clientName}</span>
              </div>
              <div className="queue-actions">
                <span className={`badge ${job.status}`}>{job.status}</span>
                <button type="button" onClick={() => decideListing(job.id, "approved")}>
                  Approve
                </button>
                <button type="button" onClick={() => decideListing(job.id, "rejected")}>
                  Reject
                </button>
                <button type="button" onClick={() => decideListing(job.id, "escalated")}>
                  Escalate
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <h2>Dispute Resolution</h2>
        <div className="queue">
          {disputes.map((dispute) => (
            <article key={dispute.id} className="queue-item">
              <div>
                <strong>{dispute.id} · {dispute.jobId}</strong>
                <p>{dispute.summary}</p>
                <span>${dispute.amount} · {dispute.evidence.join(", ")}</span>
              </div>
              <div className="queue-actions">
                <span className={`badge ${dispute.status}`}>{dispute.status}</span>
                <button type="button" onClick={() => ruleDispute(dispute.id, "client")}>
                  Refund client
                </button>
                <button type="button" onClick={() => ruleDispute(dispute.id, "freelancer")}>
                  Freelancer
                </button>
                <button type="button" onClick={() => ruleDispute(dispute.id, "senior_admin")}>
                  Escalate
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <div className="section-heading">
          <h2>Audit Log</h2>
          <select
            aria-label="Filter audit log"
            value={auditFilter}
            onChange={(event) => setAuditFilter(event.target.value)}
          >
            <option value="all">All actions</option>
            <option value="user.status_updated">User actions</option>
            <option value="listing.moderated">Listing decisions</option>
            <option value="dispute.ruled">Dispute rulings</option>
            <option value="control.updated">Control changes</option>
          </select>
          <input
            aria-label="Filter audit by admin"
            value={auditAdminFilter}
            onChange={(event) => setAuditAdminFilter(event.target.value)}
            placeholder="Admin"
          />
          <input
            aria-label="Filter audit from date"
            type="date"
            value={auditFrom}
            onChange={(event) => setAuditFrom(event.target.value)}
          />
          <input
            aria-label="Filter audit to date"
            type="date"
            value={auditTo}
            onChange={(event) => setAuditTo(event.target.value)}
          />
        </div>
        <div className="audit-list">
          {filteredAudit.length ? (
            filteredAudit.map((entry) => (
              <article key={entry.id}>
                <strong>{entry.action}</strong>
                <span>{entry.target}</span>
                <p>{entry.summary}</p>
                <time dateTime={entry.at}>{new Date(entry.at).toLocaleString()}</time>
              </article>
            ))
          ) : (
            <div className="empty-state">No audit entries match the current filter.</div>
          )}
        </div>
      </section>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function TrustBar({ label, count, tone }: { label: string; count: number; tone: string }) {
  return (
    <div className="trust-row">
      <span>{label}</span>
      <div aria-label={`${label} trust count ${count}`}>
        <i className={tone} style={{ width: `${Math.max(count * 24, 10)}%` }} />
      </div>
      <strong>{count}</strong>
    </div>
  );
}
