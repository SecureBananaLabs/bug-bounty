"use client";

import { useMemo, useState } from "react";

type UserStatus = "active" | "suspended" | "banned";
type ListingStatus = "flagged" | "approved" | "rejected" | "escalated";
type DisputeStatus = "open" | "under_review" | "resolved" | "escalated";

type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "client" | "freelancer";
  status: UserStatus;
  joinedAt: string;
  trustScore: number;
  activeJobs: string[];
  disputes: string[];
};

type ModerationJob = {
  id: string;
  title: string;
  ownerName: string;
  status: ListingStatus;
  reportCount: number;
  rule: string;
  notification: string | null;
};

type Dispute = {
  id: string;
  client: string;
  freelancer: string;
  status: DisputeStatus;
  amount: number;
  evidence: string[];
  thread: string[];
  ruling: string | null;
};

type AuditEntry = {
  id: string;
  adminId: string;
  action: string;
  targetId: string;
  detail: string;
  createdAt: string;
};

const initialUsers: User[] = [
  {
    id: "usr_admin",
    name: "Avery Admin",
    email: "admin@freelanceflow.test",
    role: "admin",
    status: "active",
    joinedAt: "2026-01-04",
    trustScore: 98,
    activeJobs: [],
    disputes: []
  },
  {
    id: "usr_client_1",
    name: "Mina Client",
    email: "mina@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-02-12",
    trustScore: 87,
    activeJobs: ["job-201", "job-204"],
    disputes: ["disp-301"]
  },
  {
    id: "usr_freelancer_1",
    name: "Devon Freelancer",
    email: "devon@example.com",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2026-03-01",
    trustScore: 59,
    activeJobs: ["job-201"],
    disputes: ["disp-301", "disp-302"]
  },
  {
    id: "usr_client_2",
    name: "Iris Studio",
    email: "ops@iris.example",
    role: "client",
    status: "active",
    joinedAt: "2026-03-28",
    trustScore: 73,
    activeJobs: ["job-205"],
    disputes: []
  },
  {
    id: "usr_freelancer_2",
    name: "Ravi Builder",
    email: "ravi@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-04-08",
    trustScore: 91,
    activeJobs: ["job-204"],
    disputes: []
  }
];

const initialJobs: ModerationJob[] = [
  {
    id: "job-201",
    title: "Build escrow reconciliation dashboard",
    ownerName: "Mina Client",
    status: "flagged",
    reportCount: 4,
    rule: "Payment terms mention external transfer",
    notification: null
  },
  {
    id: "job-204",
    title: "Migrate support widget to server components",
    ownerName: "Mina Client",
    status: "flagged",
    reportCount: 2,
    rule: "Budget mismatch against required skills",
    notification: null
  },
  {
    id: "job-205",
    title: "Logo refresh with expedited payout",
    ownerName: "Iris Studio",
    status: "escalated",
    reportCount: 8,
    rule: "High dispute risk from similar listings",
    notification: "Escalated to senior admin queue"
  }
];

const initialDisputes: Dispute[] = [
  {
    id: "disp-301",
    client: "Mina Client",
    freelancer: "Devon Freelancer",
    status: "open",
    amount: 640,
    evidence: ["loom-demo.mp4", "commit-7ac91.txt", "scope-change.pdf"],
    thread: [
      "Client says milestone two was incomplete.",
      "Freelancer attached a walkthrough and commit hash.",
      "Escrow release is paused until admin ruling."
    ],
    ruling: null
  },
  {
    id: "disp-302",
    client: "Beacon Labs",
    freelancer: "Devon Freelancer",
    status: "under_review",
    amount: 1200,
    evidence: ["contract.json", "chat-export.txt", "invoice.pdf"],
    thread: [
      "Freelancer claims client changed acceptance criteria after delivery.",
      "Client account was banned after repeated off-platform payment attempts."
    ],
    ruling: null
  }
];

const seedAudit: AuditEntry[] = [
  {
    id: "audit-001",
    adminId: "usr_admin",
    action: "platform.control.updated",
    targetId: "registrations",
    detail: "Enabled new user registrations",
    createdAt: "2026-05-18T14:20:00.000Z"
  },
  {
    id: "audit-002",
    adminId: "usr_admin",
    action: "moderation.job.escalated",
    targetId: "job-205",
    detail: "Escalated high-risk listing",
    createdAt: "2026-05-20T09:30:00.000Z"
  }
];

function statusClass(status: string) {
  return `status-pill status-${status.replace("_", "-")}`;
}

export default function AdminPanelPage() {
  const [users, setUsers] = useState(initialUsers);
  const [jobs, setJobs] = useState(initialJobs);
  const [disputes, setDisputes] = useState(initialDisputes);
  const [auditLog, setAuditLog] = useState(seedAudit);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [joinedAfter, setJoinedAfter] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [adminFilter, setAdminFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(users[1].id);
  const [registrationsEnabled, setRegistrationsEnabled] = useState(true);
  const [jobPostingsEnabled, setJobPostingsEnabled] = useState(true);
  const [lastRefresh, setLastRefresh] = useState("Just now");
  const [userPage, setUserPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [panelError, setPanelError] = useState("");

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0];

  const filteredUsers = useMemo(() => {
    const needle = userSearch.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = needle
        ? [user.name, user.email, user.id].some((value) => value.toLowerCase().includes(needle))
        : true;
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      const matchesJoinedDate = joinedAfter ? user.joinedAt >= joinedAfter : true;
      return matchesSearch && matchesRole && matchesStatus && matchesJoinedDate;
    });
  }, [joinedAfter, roleFilter, statusFilter, userSearch, users]);

  const usersPerPage = 3;
  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
  const currentUserPage = Math.min(userPage, totalUserPages);
  const paginatedUsers = filteredUsers.slice(
    (currentUserPage - 1) * usersPerPage,
    currentUserPage * usersPerPage
  );

  const filteredAudit = useMemo(() => {
    return auditLog.filter((entry) => {
      const createdAt = entry.createdAt.slice(0, 10);
      const matchesAction = actionFilter === "all" || entry.action.includes(actionFilter);
      const matchesAdmin = adminFilter ? entry.adminId.includes(adminFilter) : true;
      const afterFrom = dateFrom ? createdAt >= dateFrom : true;
      const beforeTo = dateTo ? createdAt <= dateTo : true;
      return matchesAction && matchesAdmin && afterFrom && beforeTo;
    });
  }, [actionFilter, adminFilter, auditLog, dateFrom, dateTo]);

  const metrics = useMemo(() => {
    const activeJobs = new Set(users.flatMap((user) => user.activeJobs)).size;
    const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
    const flaggedListings = jobs.filter((job) => job.status === "flagged").length;
    const revenue = disputes.reduce((sum, dispute) => sum + dispute.amount, 0);
    const highTrust = users.filter((user) => user.trustScore >= 80).length;
    const mediumTrust = users.filter((user) => user.trustScore >= 60 && user.trustScore < 80).length;
    const lowTrust = users.filter((user) => user.trustScore < 60).length;

    return [
      ["Total users", users.length.toString()],
      ["Active jobs", activeJobs.toString()],
      ["Open disputes", openDisputes.toString()],
      ["Flagged listings", flaggedListings.toString()],
      ["Revenue", `$${revenue.toLocaleString()}`],
      ["Trust spread", `${highTrust}/${mediumTrust}/${lowTrust}`]
    ];
  }, [disputes, jobs, users]);

  function appendAudit(action: string, targetId: string, detail: string) {
    setAuditLog((current) => [
      {
        id: `audit-${String(current.length + 1).padStart(3, "0")}`,
        adminId: "usr_admin",
        action,
        targetId,
        detail,
        createdAt: new Date().toISOString()
      },
      ...current
    ]);
  }

  function changeUserStatus(id: string, status: UserStatus) {
    setUsers((current) =>
      current.map((user) => (user.id === id ? { ...user, status } : user))
    );
    appendAudit(`user.${status}`, id, `User account changed to ${status}`);
  }

  function decideListing(id: string, status: ListingStatus) {
    setJobs((current) =>
      current.map((job) =>
        job.id === id
          ? {
              ...job,
              status,
              notification: status === "rejected" ? "Posting user notified with rejection reason" : job.notification
            }
          : job
      )
    );
    appendAudit(`moderation.job.${status}`, id, `Listing ${status}`);
  }

  function decideDispute(id: string, ruling: string) {
    setDisputes((current) =>
      current.map((dispute) =>
        dispute.id === id
          ? {
              ...dispute,
              status: ruling === "escalated" ? "escalated" : "resolved",
              ruling
            }
          : dispute
      )
    );
    appendAudit(`dispute.${ruling}`, id, `Dispute ruled ${ruling}; both parties notified`);
  }

  function toggleControl(key: "registrations" | "jobs") {
    const label = key === "registrations" ? "registrations" : "job postings";
    const confirmed = window.confirm(`Apply platform control change for ${label}?`);
    if (!confirmed) return;

    if (key === "registrations") {
      setRegistrationsEnabled((current) => {
        appendAudit("platform.control.updated", key, `${label} ${current ? "disabled" : "enabled"}`);
        return !current;
      });
    } else {
      setJobPostingsEnabled((current) => {
        appendAudit("platform.control.updated", key, `${label} ${current ? "disabled" : "enabled"}`);
        return !current;
      });
    }
  }

  function refreshData() {
    setPanelError("");
    setIsLoading(true);
    window.setTimeout(() => {
      setLastRefresh(new Date().toLocaleTimeString());
      setIsLoading(false);
      appendAudit("admin.panel.refreshed", "admin-panel", "Manual refresh requested");
    }, 350);
  }

  return (
    <section className="admin-shell">
      <div className="admin-header">
        <div>
          <p className="eyebrow">Admin operations</p>
          <h2>Moderation Console</h2>
          <p className="muted">Signed in as Avery Admin. Server API routes require an admin token.</p>
        </div>
        <button className="primary-button" type="button" onClick={refreshData}>
          Refresh
        </button>
      </div>
      {isLoading ? <p className="state-banner" role="status">Refreshing admin data...</p> : null}
      {panelError ? <p className="state-banner error" role="alert">{panelError}</p> : null}

      <div className="metrics-grid" aria-label="Trust and platform metrics">
        {metrics.map(([label, value]) => (
          <article className="metric-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <div className="admin-grid">
        <section className="panel wide-panel">
          <div className="panel-heading">
            <h3>User management</h3>
            <span>{filteredUsers.length} shown</span>
          </div>
          <div className="toolbar" role="search">
            <input
              aria-label="Search users"
              placeholder="Search users"
              value={userSearch}
              onChange={(event) => {
                setUserPage(1);
                setUserSearch(event.target.value);
              }}
            />
            <select
              aria-label="Filter by role"
              value={roleFilter}
              onChange={(event) => {
                setUserPage(1);
                setRoleFilter(event.target.value);
              }}
            >
              <option value="all">All roles</option>
              <option value="client">Clients</option>
              <option value="freelancer">Freelancers</option>
              <option value="admin">Admins</option>
            </select>
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) => {
                setUserPage(1);
                setStatusFilter(event.target.value);
              }}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
            <input
              aria-label="Filter by joined after date"
              type="date"
              value={joinedAfter}
              onChange={(event) => {
                setUserPage(1);
                setJoinedAfter(event.target.value);
              }}
            />
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
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No users match the selected filters.</td>
                  </tr>
                ) : null}
                {paginatedUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <button className="text-button" type="button" onClick={() => setSelectedUserId(user.id)}>
                        {user.name}
                      </button>
                      <span className="subtle">{user.email}</span>
                    </td>
                    <td>{user.role}</td>
                    <td><span className={statusClass(user.status)}>{user.status}</span></td>
                    <td>{user.joinedAt}</td>
                    <td>{user.trustScore}</td>
                    <td>
                      <div className="action-row">
                        <button type="button" onClick={() => changeUserStatus(user.id, "active")}>Reinstate</button>
                        <button type="button" onClick={() => changeUserStatus(user.id, "suspended")}>Suspend</button>
                        <button type="button" onClick={() => changeUserStatus(user.id, "banned")}>Ban</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination-row">
            <button
              type="button"
              disabled={currentUserPage === 1}
              onClick={() => setUserPage((page) => Math.max(1, page - 1))}
            >
              Previous
            </button>
            <span>Page {currentUserPage} of {totalUserPages}</span>
            <button
              type="button"
              disabled={currentUserPage === totalUserPages}
              onClick={() => setUserPage((page) => Math.min(totalUserPages, page + 1))}
            >
              Next
            </button>
          </div>
        </section>

        <aside className="panel">
          <div className="panel-heading">
            <h3>User detail</h3>
          </div>
          <dl className="detail-list">
            <div><dt>Name</dt><dd>{selectedUser.name}</dd></div>
            <div><dt>Profile</dt><dd>{selectedUser.email}</dd></div>
            <div><dt>Active jobs</dt><dd>{selectedUser.activeJobs.join(", ") || "None"}</dd></div>
            <div><dt>Disputes</dt><dd>{selectedUser.disputes.join(", ") || "None"}</dd></div>
          </dl>
        </aside>
      </div>

      <div className="admin-grid">
        <section className="panel">
          <div className="panel-heading">
            <h3>Job moderation</h3>
          </div>
          {jobs.map((job) => (
            <article className="queue-item" key={job.id}>
              <div>
                <h4>{job.title}</h4>
                <p>{job.ownerName} - {job.rule}</p>
                <span className={statusClass(job.status)}>{job.status}</span>
                {job.notification ? <p className="subtle">{job.notification}</p> : null}
              </div>
              <div className="action-row">
                <button type="button" onClick={() => decideListing(job.id, "approved")}>Approve</button>
                <button type="button" onClick={() => decideListing(job.id, "rejected")}>Reject</button>
                <button type="button" onClick={() => decideListing(job.id, "escalated")}>Escalate</button>
              </div>
            </article>
          ))}
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h3>Disputes</h3>
          </div>
          {disputes.map((dispute) => (
            <article className="queue-item" key={dispute.id}>
              <div>
                <h4>{dispute.id} - ${dispute.amount}</h4>
                <p>{dispute.client} vs {dispute.freelancer}</p>
                <span className={statusClass(dispute.status)}>{dispute.status}</span>
                <ul>
                  {dispute.thread.map((item) => <li key={item}>{item}</li>)}
                </ul>
                <p className="subtle">Evidence: {dispute.evidence.join(", ")}</p>
              </div>
              <div className="action-row">
                <button type="button" onClick={() => decideDispute(dispute.id, "client")}>Client</button>
                <button type="button" onClick={() => decideDispute(dispute.id, "freelancer")}>Freelancer</button>
                <button type="button" onClick={() => decideDispute(dispute.id, "refund")}>Refund</button>
                <button type="button" onClick={() => decideDispute(dispute.id, "escalated")}>Escalate</button>
              </div>
            </article>
          ))}
        </section>
      </div>

      <div className="admin-grid">
        <section className="panel">
          <div className="panel-heading">
            <h3>Platform controls</h3>
            <span>Last refresh {lastRefresh}</span>
          </div>
          <label className="switch-row">
            <input
              type="checkbox"
              checked={registrationsEnabled}
              onChange={() => toggleControl("registrations")}
            />
            <span>New user registrations</span>
          </label>
          <label className="switch-row">
            <input
              type="checkbox"
              checked={jobPostingsEnabled}
              onChange={() => toggleControl("jobs")}
            />
            <span>New job postings</span>
          </label>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h3>Audit log</h3>
            <select
              aria-label="Filter audit actions"
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value)}
            >
              <option value="all">All actions</option>
              <option value="user">Users</option>
              <option value="moderation">Moderation</option>
              <option value="dispute">Disputes</option>
              <option value="platform">Controls</option>
            </select>
          </div>
          <div className="toolbar compact-toolbar">
            <input
              aria-label="Filter audit by admin"
              placeholder="Admin ID"
              value={adminFilter}
              onChange={(event) => setAdminFilter(event.target.value)}
            />
            <input
              aria-label="Audit date from"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
            <input
              aria-label="Audit date to"
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>
          <div className="audit-list">
            {filteredAudit.length === 0 ? (
              <article>
                <strong>No audit entries</strong>
                <span>Adjust the filters to review earlier admin actions.</span>
              </article>
            ) : null}
            {filteredAudit.map((entry) => (
              <article key={entry.id}>
                <strong>{entry.action}</strong>
                <span>{entry.targetId} - {entry.detail}</span>
                <time>{new Date(entry.createdAt).toLocaleString()}</time>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
