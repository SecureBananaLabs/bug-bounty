"use client";

import { useMemo, useState } from "react";

type UserStatus = "active" | "suspended" | "banned";
type ModerationStatus = "pending" | "approved" | "rejected" | "escalated";
type DisputeStatus = "open" | "under_review" | "resolved";

type User = {
  id: string;
  name: string;
  email: string;
  role: "client" | "freelancer";
  status: UserStatus;
  joinedAt: string;
  trustScore: number;
};

type Job = {
  id: string;
  title: string;
  client: string;
  status: ModerationStatus;
  reason: string;
  reports: number;
};

type Dispute = {
  id: string;
  job: string;
  parties: string;
  status: DisputeStatus;
  amount: string;
  evidence: string;
};

type AuditEntry = {
  id: string;
  admin: string;
  action: string;
  target: string;
  at: string;
};

const initialUsers: User[] = [
  {
    id: "usr_101",
    name: "Maya Chen",
    email: "maya@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-01-12",
    trustScore: 94
  },
  {
    id: "usr_102",
    name: "Northstar Studio",
    email: "ops@northstar.example",
    role: "client",
    status: "active",
    joinedAt: "2026-02-02",
    trustScore: 81
  },
  {
    id: "usr_103",
    name: "Ravi Patel",
    email: "ravi@example.com",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2025-12-18",
    trustScore: 52
  },
  {
    id: "usr_104",
    name: "Atlas Retail",
    email: "finance@atlas.example",
    role: "client",
    status: "active",
    joinedAt: "2026-03-08",
    trustScore: 73
  }
];

const initialJobs: Job[] = [
  {
    id: "job_201",
    title: "Rebuild checkout analytics dashboard",
    client: "Northstar Studio",
    status: "pending",
    reason: "External payment language detected",
    reports: 2
  },
  {
    id: "job_202",
    title: "Design onboarding screens",
    client: "Northstar Studio",
    status: "pending",
    reason: "Unusually broad scope",
    reports: 1
  },
  {
    id: "job_204",
    title: "Build warehouse mobile workflow",
    client: "Atlas Retail",
    status: "escalated",
    reason: "Reported by freelancer",
    reports: 3
  }
];

const initialDisputes: Dispute[] = [
  {
    id: "disp_301",
    job: "Rebuild checkout analytics dashboard",
    parties: "Northstar Studio / Maya Chen",
    status: "open",
    amount: "$1,200",
    evidence: "contract-v3.pdf, delivery-video.mp4"
  },
  {
    id: "disp_302",
    job: "Build warehouse mobile workflow",
    parties: "Atlas Retail / Ravi Patel",
    status: "under_review",
    amount: "$800",
    evidence: "qa-report.csv"
  }
];

function statusClass(status: string) {
  if (["active", "approved", "resolved"].includes(status)) return "admin-badge admin-badge-good";
  if (["pending", "under_review", "suspended", "escalated"].includes(status)) return "admin-badge admin-badge-warn";
  return "admin-badge admin-badge-bad";
}

export default function AdminPanelPage() {
  const [users, setUsers] = useState(initialUsers);
  const [jobs, setJobs] = useState(initialJobs);
  const [disputes, setDisputes] = useState(initialDisputes);
  const [audit, setAudit] = useState<AuditEntry[]>([
    {
      id: "audit_100",
      admin: "admin_1",
      action: "dashboard.opened",
      target: "admin-panel",
      at: "2026-05-20 00:00"
    }
  ]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [registrationsEnabled, setRegistrationsEnabled] = useState(true);
  const [jobPostingsEnabled, setJobPostingsEnabled] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(users[0].id);
  const [activity, setActivity] = useState("Ready");

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesQuery =
        !normalized ||
        user.name.toLowerCase().includes(normalized) ||
        user.email.toLowerCase().includes(normalized);
      const matchesRole = role === "all" || user.role === role;
      const matchesStatus = status === "all" || user.status === status;
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [query, role, status, users]);

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0];
  const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
  const flaggedListings = jobs.filter((job) => job.status !== "approved").length;
  const trustBuckets = [
    { label: "0-49", count: users.filter((user) => user.trustScore < 50).length },
    { label: "50-69", count: users.filter((user) => user.trustScore >= 50 && user.trustScore < 70).length },
    { label: "70-89", count: users.filter((user) => user.trustScore >= 70 && user.trustScore < 90).length },
    { label: "90-100", count: users.filter((user) => user.trustScore >= 90).length }
  ];

  function record(action: string, target: string) {
    setAudit((current) => [
      {
        id: `audit_${Date.now()}`,
        admin: "admin_1",
        action,
        target,
        at: new Date().toLocaleString()
      },
      ...current
    ]);
  }

  function updateUserStatus(userId: string, nextStatus: UserStatus) {
    setActivity("Saving user action...");
    setUsers((current) =>
      current.map((user) => (user.id === userId ? { ...user, status: nextStatus } : user))
    );
    record(`user.${nextStatus}`, userId);
    setActivity(`User ${userId} set to ${nextStatus}`);
  }

  function moderateJob(jobId: string, nextStatus: ModerationStatus) {
    setActivity("Saving moderation decision...");
    setJobs((current) =>
      current.map((job) => (job.id === jobId ? { ...job, status: nextStatus } : job))
    );
    record(`job.${nextStatus}`, jobId);
    setActivity(`Listing ${jobId} marked ${nextStatus}`);
  }

  function resolveDispute(disputeId: string, ruling: string) {
    setActivity("Saving dispute ruling...");
    setDisputes((current) =>
      current.map((dispute) =>
        dispute.id === disputeId
          ? { ...dispute, status: ruling === "escalate" ? "under_review" : "resolved" }
          : dispute
      )
    );
    record(`dispute.${ruling}`, disputeId);
    setActivity(`Dispute ${disputeId} updated`);
  }

  function confirmToggle(label: string, enabled: boolean, commit: (enabled: boolean) => void) {
    if (window.confirm(`Apply platform control change: ${label}?`)) {
      commit(enabled);
      record(`control.${label}`, "platform");
      setActivity(`${label} set to ${enabled ? "enabled" : "disabled"}`);
    }
  }

  return (
    <section className="admin-shell" aria-label="Admin panel">
      <div className="admin-toolbar">
        <div>
          <h1>Admin Panel</h1>
          <p>{activity}</p>
        </div>
        <button className="admin-button" type="button" onClick={() => setActivity("Data refreshed")}>
          Refresh
        </button>
      </div>

      <div className="admin-metrics" aria-label="Platform metrics">
        {[
          ["Total users", users.length],
          ["Active jobs", 4],
          ["Open disputes", openDisputes],
          ["Flagged listings", flaggedListings],
          ["Revenue", "$13.8k"]
        ].map(([label, value]) => (
          <div className="admin-panel admin-metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="admin-layout">
        <div className="admin-panel">
          <div className="admin-panel-head">
            <h2>Users</h2>
            <span>{filteredUsers.length} shown</span>
          </div>
          <div className="admin-filters" aria-label="User filters">
            <input
              aria-label="Search users"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
            />
            <select aria-label="Filter by role" value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="all">All roles</option>
              <option value="client">Clients</option>
              <option value="freelancer">Freelancers</option>
            </select>
            <select
              aria-label="Filter by status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
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
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <button className="admin-link" type="button" onClick={() => setSelectedUserId(user.id)}>
                        {user.name}
                      </button>
                      <small>{user.email}</small>
                    </td>
                    <td>{user.role}</td>
                    <td>
                      <span className={statusClass(user.status)}>{user.status}</span>
                    </td>
                    <td>{user.joinedAt}</td>
                    <td>
                      <div className="admin-actions">
                        <button type="button" onClick={() => updateUserStatus(user.id, "suspended")}>
                          Suspend
                        </button>
                        <button type="button" onClick={() => updateUserStatus(user.id, "active")}>
                          Reinstate
                        </button>
                        <button type="button" onClick={() => updateUserStatus(user.id, "banned")}>
                          Ban
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="admin-panel">
          <div className="admin-panel-head">
            <h2>Profile</h2>
            <span>{selectedUser.id}</span>
          </div>
          <dl className="admin-profile">
            <div>
              <dt>Name</dt>
              <dd>{selectedUser.name}</dd>
            </div>
            <div>
              <dt>Trust</dt>
              <dd>{selectedUser.trustScore}</dd>
            </div>
            <div>
              <dt>Active jobs</dt>
              <dd>{selectedUser.role === "client" ? 2 : selectedUser.status === "active" ? 1 : 0}</dd>
            </div>
            <div>
              <dt>Disputes</dt>
              <dd>{selectedUser.id === "usr_101" || selectedUser.id === "usr_103" ? 1 : 0}</dd>
            </div>
          </dl>
          <h3>Trust Distribution</h3>
          <div className="admin-bars">
            {trustBuckets.map((bucket) => (
              <div key={bucket.label}>
                <span>{bucket.label}</span>
                <meter min={0} max={users.length} value={bucket.count} />
                <strong>{bucket.count}</strong>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <div className="admin-layout">
        <div className="admin-panel">
          <div className="admin-panel-head">
            <h2>Moderation</h2>
            <span>{flaggedListings} open</span>
          </div>
          {jobs.map((job) => (
            <article className="admin-row-card" key={job.id}>
              <div>
                <strong>{job.title}</strong>
                <span>{job.client}</span>
                <small>{job.reason}</small>
              </div>
              <span className={statusClass(job.status)}>{job.status}</span>
              <div className="admin-actions">
                <button type="button" onClick={() => moderateJob(job.id, "approved")}>
                  Approve
                </button>
                <button type="button" onClick={() => moderateJob(job.id, "rejected")}>
                  Reject
                </button>
                <button type="button" onClick={() => moderateJob(job.id, "escalated")}>
                  Escalate
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="admin-panel">
          <div className="admin-panel-head">
            <h2>Disputes</h2>
            <span>{openDisputes} open</span>
          </div>
          {disputes.map((dispute) => (
            <article className="admin-row-card" key={dispute.id}>
              <div>
                <strong>{dispute.job}</strong>
                <span>{dispute.parties}</span>
                <small>
                  {dispute.amount} · {dispute.evidence}
                </small>
              </div>
              <span className={statusClass(dispute.status)}>{dispute.status}</span>
              <div className="admin-actions">
                <button type="button" onClick={() => resolveDispute(dispute.id, "client")}>
                  Client
                </button>
                <button type="button" onClick={() => resolveDispute(dispute.id, "freelancer")}>
                  Freelancer
                </button>
                <button type="button" onClick={() => resolveDispute(dispute.id, "refund")}>
                  Refund
                </button>
                <button type="button" onClick={() => resolveDispute(dispute.id, "escalate")}>
                  Escalate
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="admin-layout">
        <div className="admin-panel">
          <div className="admin-panel-head">
            <h2>Controls</h2>
            <span>Admin approval required</span>
          </div>
          <label className="admin-toggle">
            <span>New registrations</span>
            <input
              type="checkbox"
              checked={registrationsEnabled}
              onChange={(event) =>
                confirmToggle("registrationsEnabled", event.target.checked, setRegistrationsEnabled)
              }
            />
          </label>
          <label className="admin-toggle">
            <span>New job postings</span>
            <input
              type="checkbox"
              checked={jobPostingsEnabled}
              onChange={(event) =>
                confirmToggle("jobPostingsEnabled", event.target.checked, setJobPostingsEnabled)
              }
            />
          </label>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-head">
            <h2>Audit Log</h2>
            <span>{audit.length} entries</span>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Admin</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.action}</td>
                    <td>{entry.target}</td>
                    <td>{entry.admin}</td>
                    <td>{entry.at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
