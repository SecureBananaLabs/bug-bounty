"use client";

import { useMemo, useState } from "react";

type UserStatus = "active" | "suspended" | "banned";
type UserRole = "admin" | "client" | "freelancer";
type ModerationStatus = "flagged" | "approved" | "rejected" | "escalated";
type DisputeStatus = "open" | "under_review" | "resolved";
type Tab = "overview" | "users" | "moderation" | "disputes" | "controls" | "audit";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
  trustScore: number;
  activeJobs: string[];
  disputeHistory: string[];
};

type ModerationJob = {
  id: string;
  title: string;
  clientId: string;
  status: ModerationStatus;
  reason: string;
  reportCount: number;
  budget: number;
  notificationStatus: string;
};

type Dispute = {
  id: string;
  jobId: string;
  clientId: string;
  freelancerId: string;
  status: DisputeStatus;
  amount: number;
  thread: string[];
  evidence: string[];
  refundPercent?: number;
  ruling?: string;
  notificationStatus?: string;
};

type AuditEvent = {
  id: string;
  action: string;
  target: string;
  adminId: string;
  details: string;
  createdAt: string;
};

const seedUsers: AdminUser[] = [
  {
    id: "usr_admin_1",
    name: "Nora Admin",
    email: "nora.admin@freelanceflow.test",
    role: "admin",
    status: "active",
    joinedAt: "2026-01-08",
    trustScore: 99,
    activeJobs: ["job_1001"],
    disputeHistory: []
  },
  {
    id: "usr_client_1",
    name: "Avery Client",
    email: "avery.client@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-02-14",
    trustScore: 88,
    activeJobs: ["job_1001", "job_flagged_1"],
    disputeHistory: ["dsp_1"]
  },
  {
    id: "usr_freelancer_1",
    name: "Mika Freelancer",
    email: "mika.freelancer@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-03-03",
    trustScore: 76,
    activeJobs: ["job_1001"],
    disputeHistory: ["dsp_1"]
  },
  {
    id: "usr_freelancer_2",
    name: "Devon Data",
    email: "devon.data@example.com",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2026-03-28",
    trustScore: 42,
    activeJobs: [],
    disputeHistory: []
  },
  {
    id: "usr_client_2",
    name: "Rowan Studio",
    email: "rowan.studio@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-04-16",
    trustScore: 91,
    activeJobs: ["job_flagged_2"],
    disputeHistory: []
  }
];

const seedJobs: ModerationJob[] = [
  {
    id: "job_flagged_1",
    title: "Clone a payment gateway dashboard",
    clientId: "usr_client_1",
    status: "flagged",
    reason: "Restricted payment language",
    reportCount: 3,
    budget: 2400,
    notificationStatus: "pending"
  },
  {
    id: "job_flagged_2",
    title: "Scrape private lead databases",
    clientId: "usr_client_2",
    status: "flagged",
    reason: "Private data collection reports",
    reportCount: 5,
    budget: 1800,
    notificationStatus: "pending"
  }
];

const seedDisputes: Dispute[] = [
  {
    id: "dsp_1",
    jobId: "job_1001",
    clientId: "usr_client_1",
    freelancerId: "usr_freelancer_1",
    status: "open",
    amount: 950,
    thread: [
      "Final handoff missed the reporting export.",
      "Export was marked out of scope in the proposal.",
      "Escrow is held until an admin ruling is recorded."
    ],
    evidence: ["scope.pdf", "handoff.zip", "messages-export.json"]
  },
  {
    id: "dsp_2",
    jobId: "job_1040",
    clientId: "usr_client_2",
    freelancerId: "usr_freelancer_2",
    status: "under_review",
    amount: 420,
    thread: ["Refund requested after milestone one.", "Partial source files and time logs uploaded."],
    evidence: ["time-log.csv", "milestone-1.zip"]
  }
];

const tabs: Array<[Tab, string]> = [
  ["overview", "Overview"],
  ["users", "Users"],
  ["moderation", "Moderation"],
  ["disputes", "Disputes"],
  ["controls", "Controls"],
  ["audit", "Audit"]
];

const initialAuditEvents: AuditEvent[] = [
  {
    id: "aud_initial",
    action: "platform.seeded",
    target: "admin-panel",
    adminId: "system",
    details: "Initial review dataset loaded",
    createdAt: "Initial load"
  }
];

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function makeAudit(action: string, target: string, details: string): AuditEvent {
  return {
    id: `aud_${Date.now()}`,
    action,
    target,
    adminId: "admin_test",
    details,
    createdAt: new Date().toLocaleString()
  };
}

export function AdminPanelClient() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [users, setUsers] = useState(seedUsers);
  const [jobs, setJobs] = useState(seedJobs);
  const [disputes, setDisputes] = useState(seedDisputes);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState(seedUsers[0].id);
  const [registrationsEnabled, setRegistrationsEnabled] = useState(true);
  const [jobPostingEnabled, setJobPostingEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState("not refreshed");
  const [audit, setAudit] = useState<AuditEvent[]>(initialAuditEvents);

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0];

  const filteredUsers = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !normalized ||
        [user.name, user.email, user.id].some((value) => value.toLowerCase().includes(normalized));
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const metrics = useMemo(() => {
    const activeUsers = users.filter((user) => user.status === "active").length;
    const activeJobs = users.reduce((sum, user) => sum + user.activeJobs.length, 0);
    const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
    const flaggedListings = jobs.filter((job) => job.status === "flagged").length;
    const revenue = [...jobs.map((job) => job.budget), ...disputes.map((dispute) => dispute.amount)].reduce(
      (sum, value) => sum + value,
      0
    );

    return [
      ["Total users", String(users.length)],
      ["Active jobs", String(activeJobs)],
      ["Open disputes", String(openDisputes)],
      ["Flagged listings", String(flaggedListings)],
      ["Current revenue", money(revenue)],
      ["Active users", String(activeUsers)]
    ];
  }, [users, jobs, disputes]);

  const trustDistribution = useMemo(() => {
    return [
      ["0-49", users.filter((user) => user.trustScore < 50).length],
      ["50-79", users.filter((user) => user.trustScore >= 50 && user.trustScore < 80).length],
      ["80-100", users.filter((user) => user.trustScore >= 80).length]
    ];
  }, [users]);

  function record(action: string, target: string, details: string) {
    setAudit((events) => [makeAudit(action, target, details), ...events]);
  }

  function refresh() {
    setLoading(true);
    window.setTimeout(() => {
      setLastRefresh(new Date().toLocaleTimeString());
      setLoading(false);
      record("dashboard.refreshed", "admin-panel", "Manual refresh requested");
    }, 250);
  }

  function changeUserStatus(userId: string, nextStatus: UserStatus) {
    const user = users.find((candidate) => candidate.id === userId);
    if (!user) return;
    if (!window.confirm(`Set ${user.name} to ${nextStatus}?`)) return;

    setUsers((current) =>
      current.map((candidate) =>
        candidate.id === userId ? { ...candidate, status: nextStatus } : candidate
      )
    );
    record("user.status_updated", userId, `${user.status} -> ${nextStatus}`);
  }

  function moderate(jobId: string, nextStatus: ModerationStatus) {
    const job = jobs.find((candidate) => candidate.id === jobId);
    if (!job) return;
    if (!window.confirm(`Mark "${job.title}" as ${nextStatus}?`)) return;

    setJobs((current) =>
      current.map((candidate) =>
        candidate.id === jobId
          ? {
              ...candidate,
              status: nextStatus,
              notificationStatus: nextStatus === "rejected" ? "sent" : "not required"
            }
          : candidate
      )
    );
    record(`job.${nextStatus}`, jobId, job.reason);
  }

  function rule(disputeId: string, ruling: string, refundPercent: number) {
    const dispute = disputes.find((candidate) => candidate.id === disputeId);
    if (!dispute) return;
    if (!window.confirm(`Record ${ruling} ruling for ${dispute.id}?`)) return;

    setDisputes((current) =>
      current.map((candidate) =>
        candidate.id === disputeId
          ? {
              ...candidate,
              status: ruling === "escalate" ? "under_review" : "resolved",
              ruling,
              refundPercent,
              notificationStatus: "sent"
            }
          : candidate
      )
    );
    record("dispute.ruling_recorded", disputeId, `${ruling}; refund ${refundPercent}%`);
  }

  function toggleControl(control: "registrations" | "jobPostings", enabled: boolean) {
    const label = control === "registrations" ? "registrations" : "job postings";
    if (!window.confirm(`${enabled ? "Enable" : "Disable"} ${label}?`)) return;

    if (control === "registrations") {
      setRegistrationsEnabled(enabled);
      record("platform.control_updated", "registrationsEnabled", String(enabled));
    } else {
      setJobPostingEnabled(enabled);
      record("platform.control_updated", "jobPostingEnabled", String(enabled));
    }
  }

  return (
    <section className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">FreelanceFlow Admin</p>
          <h2>Operations Console</h2>
        </div>
        <button type="button" className="primary-action" onClick={refresh} aria-label="Refresh admin data">
          {loading ? "Refreshing" : "Refresh"}
        </button>
      </header>

      <nav className="admin-tabs" aria-label="Admin sections">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={activeTab === id ? "tab active" : "tab"}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {activeTab === "overview" && (
        <section className="admin-panel" aria-labelledby="overview-title">
          <div className="panel-title-row">
            <h3 id="overview-title">Platform Health</h3>
            <span className="muted">Last refresh: {lastRefresh}</span>
          </div>
          <div className="metric-grid">
            {metrics.map(([label, value]) => (
              <article className="metric-card" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </article>
            ))}
          </div>
          <div className="chart-block" aria-label="Trust score distribution">
            {trustDistribution.map(([range, count]) => (
              <div className="bar-row" key={range}>
                <span>{range}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${Number(count) * 20}%` }} />
                </div>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "users" && (
        <section className="admin-panel" aria-labelledby="users-title">
          <div className="panel-title-row">
            <h3 id="users-title">User Management</h3>
            <span className="muted">{filteredUsers.length} visible</span>
          </div>
          <div className="filters">
            <label>
              Search
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, email, or id"
              />
            </label>
            <label>
              Role
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                <option value="all">All roles</option>
                <option value="admin">Admin</option>
                <option value="client">Client</option>
                <option value="freelancer">Freelancer</option>
              </select>
            </label>
            <label>
              Status
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </select>
            </label>
          </div>
          <div className="admin-grid-two">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
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
                      <td>
                        <span className={`status ${user.status}`}>{user.status}</span>
                      </td>
                      <td>{user.trustScore}</td>
                      <td className="action-row">
                        <button type="button" onClick={() => changeUserStatus(user.id, "suspended")}>
                          Suspend
                        </button>
                        <button type="button" onClick={() => changeUserStatus(user.id, "active")}>
                          Reinstate
                        </button>
                        <button type="button" onClick={() => changeUserStatus(user.id, "banned")}>
                          Ban
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <aside className="detail-panel" aria-label="Selected user profile">
              <h4>{selectedUser.name}</h4>
              <dl>
                <dt>Joined</dt>
                <dd>{selectedUser.joinedAt}</dd>
                <dt>Active jobs</dt>
                <dd>{selectedUser.activeJobs.join(", ") || "None"}</dd>
                <dt>Disputes</dt>
                <dd>{selectedUser.disputeHistory.join(", ") || "None"}</dd>
              </dl>
            </aside>
          </div>
        </section>
      )}

      {activeTab === "moderation" && (
        <section className="admin-panel" aria-labelledby="moderation-title">
          <div className="panel-title-row">
            <h3 id="moderation-title">Job Moderation</h3>
            <span className="muted">Server-side queue shape</span>
          </div>
          <div className="queue-list">
            {jobs.map((job) => (
              <article className="queue-item" key={job.id}>
                <div>
                  <h4>{job.title}</h4>
                  <p>{job.reason}</p>
                  <small>
                    {job.reportCount} reports - {money(job.budget)} - notification {job.notificationStatus}
                  </small>
                </div>
                <div className="action-row">
                  <span className={`status ${job.status}`}>{job.status}</span>
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
        </section>
      )}

      {activeTab === "disputes" && (
        <section className="admin-panel" aria-labelledby="disputes-title">
          <div className="panel-title-row">
            <h3 id="disputes-title">Dispute Resolution</h3>
            <span className="muted">Escrow-aware rulings</span>
          </div>
          <div className="queue-list">
            {disputes.map((dispute) => (
              <article className="queue-item" key={dispute.id}>
                <div>
                  <h4>
                    {dispute.id} - {money(dispute.amount)}
                  </h4>
                  <p>{dispute.thread[0]}</p>
                  <small>Evidence: {dispute.evidence.join(", ")}</small>
                </div>
                <div className="action-row">
                  <span className={`status ${dispute.status}`}>{dispute.status}</span>
                  <button type="button" onClick={() => rule(dispute.id, "client", 100)}>
                    Client
                  </button>
                  <button type="button" onClick={() => rule(dispute.id, "freelancer", 0)}>
                    Freelancer
                  </button>
                  <button type="button" onClick={() => rule(dispute.id, "split", 50)}>
                    Split
                  </button>
                  <button type="button" onClick={() => rule(dispute.id, "escalate", 0)}>
                    Escalate
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === "controls" && (
        <section className="admin-panel" aria-labelledby="controls-title">
          <div className="panel-title-row">
            <h3 id="controls-title">Platform Controls</h3>
            <span className="muted">Confirmation required</span>
          </div>
          <div className="control-grid">
            <label className="switch-row">
              <span>
                <strong>New user registrations</strong>
                <small>{registrationsEnabled ? "Enabled" : "Disabled"}</small>
              </span>
              <input
                type="checkbox"
                checked={registrationsEnabled}
                onChange={(event) => toggleControl("registrations", event.target.checked)}
              />
            </label>
            <label className="switch-row">
              <span>
                <strong>New job postings</strong>
                <small>{jobPostingEnabled ? "Enabled" : "Disabled"}</small>
              </span>
              <input
                type="checkbox"
                checked={jobPostingEnabled}
                onChange={(event) => toggleControl("jobPostings", event.target.checked)}
              />
            </label>
          </div>
        </section>
      )}

      {activeTab === "audit" && (
        <section className="admin-panel" aria-labelledby="audit-title">
          <div className="panel-title-row">
            <h3 id="audit-title">Audit Log</h3>
            <span className="muted">Append-only events</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Admin</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((event) => (
                  <tr key={event.id}>
                    <td>{event.createdAt}</td>
                    <td>{event.action}</td>
                    <td>{event.target}</td>
                    <td>{event.adminId}</td>
                    <td>{event.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </section>
  );
}
