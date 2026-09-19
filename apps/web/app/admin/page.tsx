"use client";

import { useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "client" | "freelancer";
  status: "active" | "suspended" | "banned";
  joinedAt: string;
  trustScore: number;
  activeJobs: string[];
  disputes: string[];
};

type ModerationItem = {
  id: string;
  title: string;
  status: "flagged" | "approved" | "rejected" | "escalated";
  reports: number;
  reason: string;
  owner: string;
};

type Dispute = {
  id: string;
  status: "open" | "under_review" | "resolved";
  amount: number;
  parties: string;
  transactionId: string;
  evidence: string[];
  thread: string[];
};

type AuditEntry = {
  id: string;
  adminId: string;
  actionType: string;
  targetId: string;
  message: string;
  createdAt: string;
};

const seedUsers: User[] = [
  {
    id: "usr_admin",
    name: "Admin Operator",
    email: "admin@freelanceflow.test",
    role: "admin",
    status: "active",
    joinedAt: "2026-01-04",
    trustScore: 96,
    activeJobs: [],
    disputes: []
  },
  {
    id: "usr_client_1",
    name: "Acme Client",
    email: "client@acme.test",
    role: "client",
    status: "active",
    joinedAt: "2026-02-12",
    trustScore: 82,
    activeJobs: ["job_flagged_1", "job_live_2"],
    disputes: ["dsp_1"]
  },
  {
    id: "usr_freelancer_1",
    name: "Maya Dev",
    email: "maya@freelance.test",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-03-01",
    trustScore: 91,
    activeJobs: ["job_live_2"],
    disputes: ["dsp_1", "dsp_2"]
  },
  {
    id: "usr_client_2",
    name: "Market Safety Client",
    email: "safety@market.test",
    role: "client",
    status: "suspended",
    joinedAt: "2026-04-08",
    trustScore: 47,
    activeJobs: ["job_flagged_2"],
    disputes: ["dsp_2"]
  }
];

const seedModeration: ModerationItem[] = [
  {
    id: "mod_1",
    title: "Scrape private freelancer contact lists",
    status: "flagged",
    reports: 3,
    reason: "Automated privacy-risk classifier matched disallowed scraping language.",
    owner: "Acme Client"
  },
  {
    id: "mod_2",
    title: "Payment dispute recovery specialist",
    status: "escalated",
    reports: 5,
    reason: "Multiple user reports mention off-platform payment requests.",
    owner: "Market Safety Client"
  }
];

const seedDisputes: Dispute[] = [
  {
    id: "dsp_1",
    status: "open",
    amount: 2400,
    parties: "Acme Client / Maya Dev",
    transactionId: "txn_7781",
    evidence: ["Approved milestone checklist", "Client scope-change request"],
    thread: ["Client says delivery was late.", "Freelancer says scope changed after approval."]
  },
  {
    id: "dsp_2",
    status: "under_review",
    amount: 875,
    parties: "Market Safety Client / Maya Dev",
    transactionId: "txn_7794",
    evidence: ["Off-platform payment request"],
    thread: ["Freelancer reports off-platform refund routing."]
  }
];

const seedAudit: AuditEntry[] = [
  {
    id: "aud_1",
    adminId: "usr_admin",
    actionType: "system.seeded",
    targetId: "initial-state",
    message: "Initial admin panel audit state loaded.",
    createdAt: "2026-05-24T08:00:00.000Z"
  }
];

export default function AdminPanelPage() {
  const [users, setUsers] = useState(seedUsers);
  const [moderation, setModeration] = useState(seedModeration);
  const [disputes, setDisputes] = useState(seedDisputes);
  const [audit, setAudit] = useState(seedAudit);
  const [registrationsEnabled, setRegistrationsEnabled] = useState(true);
  const [jobPostingsEnabled, setJobPostingsEnabled] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(seedUsers[1].id);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [auditFilter, setAuditFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [lastRefresh, setLastRefresh] = useState(new Date().toISOString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredUsers = users.filter((user) => {
    const text = `${user.name} ${user.email} ${user.id}`.toLowerCase();
    return (roleFilter === "all" || user.role === roleFilter)
      && (statusFilter === "all" || user.status === statusFilter)
      && (!search || text.includes(search.toLowerCase()));
  });
  const filteredAudit = audit.filter((entry) => auditFilter === "all" || entry.actionType === auditFilter);
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0];
  const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
  const flaggedListings = moderation.filter((item) => item.status !== "approved").length;
  const revenue = disputes.reduce((sum, dispute) => sum + dispute.amount, 0);

  function writeAudit(actionType: string, targetId: string, message: string) {
    setAudit((entries) => [
      {
        id: `aud_${entries.length + 1}`,
        adminId: "usr_admin",
        actionType,
        targetId,
        message,
        createdAt: new Date().toISOString()
      },
      ...entries
    ]);
  }

  function refreshData() {
    setLoading(true);
    setError("");
    window.setTimeout(() => {
      setLastRefresh(new Date().toISOString());
      setLoading(false);
    }, 250);
  }

  function updateUserStatus(id: string, status: User["status"]) {
    setUsers((items) => items.map((user) => (user.id === id ? { ...user, status } : user)));
    writeAudit("user.status", id, `User status set to ${status}`);
  }

  function decideListing(id: string, status: ModerationItem["status"]) {
    const reason = status === "rejected" ? window.prompt("Reason for rejection", "Policy violation confirmed") : "";
    if (status === "rejected" && !reason) {
      setError("Rejected listings require a reason.");
      return;
    }

    setModeration((items) => items.map((item) => (item.id === id ? { ...item, status } : item)));
    writeAudit("listing.decision", id, `Listing marked ${status}${reason ? `: ${reason}` : ""}`);
  }

  function ruleDispute(id: string, ruling: string) {
    const reason = window.prompt("Ruling reason", "Evidence reviewed by admin");
    if (!reason) {
      setError("Dispute rulings require a reason.");
      return;
    }

    setDisputes((items) => items.map((dispute) => (
      dispute.id === id
        ? { ...dispute, status: ruling === "escalate" ? "under_review" : "resolved" }
        : dispute
    )));
    writeAudit("dispute.ruling", id, `Dispute ruling: ${ruling}. ${reason}`);
  }

  function toggleControl(key: "registrations" | "jobPostings") {
    const label = key === "registrations" ? "new user registrations" : "new job postings";
    if (!window.confirm(`Change platform control for ${label}?`)) {
      return;
    }

    if (key === "registrations") {
      setRegistrationsEnabled((value) => !value);
      writeAudit("platform.control", key, `Changed ${label}`);
    } else {
      setJobPostingsEnabled((value) => !value);
      writeAudit("platform.control", key, `Changed ${label}`);
    }
  }

  return (
    <section className="admin-ops" aria-labelledby="admin-title">
      <header className="admin-hero">
        <div>
          <p className="admin-kicker">Seed data from the admin mock service</p>
          <h2 id="admin-title">Admin Operations Panel</h2>
          <p>
            User controls, job moderation, dispute rulings, platform switches, trust metrics, and append-only audit events
            are grouped into independent sections.
          </p>
        </div>
        <div className="admin-refresh">
          <span>Last refresh</span>
          <strong>{new Date(lastRefresh).toLocaleString()}</strong>
          <button type="button" onClick={refreshData} aria-label="Refresh admin panel data">
            {loading ? "Refreshing" : "Refresh"}
          </button>
        </div>
      </header>

      {error ? (
        <div className="admin-alert" role="alert">
          {error}
        </div>
      ) : null}

      <div className="admin-grid metrics-grid" aria-label="Trust and platform metrics">
        <MetricCard label="Total users" value={users.length.toString()} />
        <MetricCard label="Active jobs" value="2" />
        <MetricCard label="Open disputes" value={openDisputes.toString()} />
        <MetricCard label="Flagged listings" value={flaggedListings.toString()} />
        <MetricCard label="Revenue current period" value={`$${revenue.toLocaleString()}`} />
      </div>

      <section className="admin-panel">
        <div className="section-heading">
          <h3>User Management</h3>
          <span>Server-side route: GET /api/admin/users</span>
        </div>
        <div className="admin-controls-row">
          <label>
            Search
            <input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search users" />
          </label>
          <label>
            Role
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} aria-label="Filter users by role">
              <option value="all">All roles</option>
              <option value="admin">Admin</option>
              <option value="client">Client</option>
              <option value="freelancer">Freelancer</option>
            </select>
          </label>
          <label>
            Status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter users by status">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </label>
        </div>
        {filteredUsers.length === 0 ? (
          <EmptyState label="No users match the active filters." />
        ) : (
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
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
                      <span>{user.email}</span>
                    </td>
                    <td>{user.role}</td>
                    <td>{user.status}</td>
                    <td>{user.joinedAt}</td>
                    <td>{user.trustScore}</td>
                    <td className="button-cluster">
                      <button type="button" onClick={() => updateUserStatus(user.id, "suspended")}>Suspend</button>
                      <button type="button" onClick={() => updateUserStatus(user.id, "active")}>Reinstate</button>
                      <button type="button" onClick={() => updateUserStatus(user.id, "banned")}>Ban</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <aside className="detail-card" aria-label="Selected user profile">
          <h4>{selectedUser.name}</h4>
          <p>{selectedUser.email}</p>
          <p>Active jobs: {selectedUser.activeJobs.length ? selectedUser.activeJobs.join(", ") : "None"}</p>
          <p>Dispute history: {selectedUser.disputes.length ? selectedUser.disputes.join(", ") : "None"}</p>
        </aside>
      </section>

      <section className="admin-grid two-column">
        <div className="admin-panel">
          <div className="section-heading">
            <h3>Job Moderation</h3>
            <span>Paginated queue from /api/admin/moderation</span>
          </div>
          {moderation.map((item) => (
            <article key={item.id} className="queue-card">
              <h4>{item.title}</h4>
              <p>{item.reason}</p>
              <dl>
                <dt>Owner</dt>
                <dd>{item.owner}</dd>
                <dt>Status</dt>
                <dd>{item.status}</dd>
                <dt>Reports</dt>
                <dd>{item.reports}</dd>
              </dl>
              <div className="button-cluster">
                <button type="button" onClick={() => decideListing(item.id, "approved")}>Approve</button>
                <button type="button" onClick={() => decideListing(item.id, "rejected")}>Reject</button>
                <button type="button" onClick={() => decideListing(item.id, "escalated")}>Escalate</button>
              </div>
            </article>
          ))}
        </div>

        <div className="admin-panel">
          <div className="section-heading">
            <h3>Dispute Resolution</h3>
            <span>Thread, evidence, transaction detail</span>
          </div>
          {disputes.map((dispute) => (
            <article key={dispute.id} className="queue-card">
              <h4>{dispute.id}: {dispute.parties}</h4>
              <p>Transaction {dispute.transactionId}, ${dispute.amount.toLocaleString()}, status {dispute.status}</p>
              <p>Evidence: {dispute.evidence.join(", ")}</p>
              <p>Thread: {dispute.thread.join(" / ")}</p>
              <div className="button-cluster">
                <button type="button" onClick={() => ruleDispute(dispute.id, "client")}>Rule for client</button>
                <button type="button" onClick={() => ruleDispute(dispute.id, "freelancer")}>Rule for freelancer</button>
                <button type="button" onClick={() => ruleDispute(dispute.id, "refund")}>Trigger refund</button>
                <button type="button" onClick={() => ruleDispute(dispute.id, "escalate")}>Escalate</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-grid two-column">
        <div className="admin-panel">
          <div className="section-heading">
            <h3>Trust Distribution</h3>
            <span>Current seed population</span>
          </div>
          {[
            ["0-49", users.filter((user) => user.trustScore < 50).length],
            ["50-79", users.filter((user) => user.trustScore >= 50 && user.trustScore < 80).length],
            ["80-100", users.filter((user) => user.trustScore >= 80).length]
          ].map(([range, count]) => (
            <div className="bar-row" key={range}>
              <span>{range}</span>
              <div><i style={{ width: `${Number(count) * 25}%` }} /></div>
              <strong>{count}</strong>
            </div>
          ))}
        </div>

        <div className="admin-panel">
          <div className="section-heading">
            <h3>Platform Controls</h3>
            <span>Confirmation required before changes</span>
          </div>
          <button type="button" className="control-toggle" onClick={() => toggleControl("registrations")} aria-pressed={registrationsEnabled}>
            New user registrations: {registrationsEnabled ? "enabled" : "disabled"}
          </button>
          <button type="button" className="control-toggle" onClick={() => toggleControl("jobPostings")} aria-pressed={jobPostingsEnabled}>
            New job postings: {jobPostingsEnabled ? "enabled" : "disabled"}
          </button>
        </div>
      </section>

      <section className="admin-panel">
        <div className="section-heading">
          <h3>Audit Log</h3>
          <span>Append-only entries for admin actions</span>
        </div>
        <div className="admin-controls-row">
          <label>
            Action type
            <select value={auditFilter} onChange={(event) => setAuditFilter(event.target.value)} aria-label="Filter audit entries by action type">
              <option value="all">All action types</option>
              {[...new Set(audit.map((entry) => entry.actionType))].map((action) => (
                <option value={action} key={action}>{action}</option>
              ))}
            </select>
          </label>
        </div>
        {filteredAudit.length === 0 ? (
          <EmptyState label="No audit entries match the active filters." />
        ) : (
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {filteredAudit.map((entry) => (
                  <tr key={entry.id}>
                    <td>{new Date(entry.createdAt).toLocaleString()}</td>
                    <td>{entry.adminId}</td>
                    <td>{entry.actionType}</td>
                    <td>{entry.targetId}</td>
                    <td>{entry.message}</td>
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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function EmptyState({ label }: { label: string }) {
  return <p className="empty-state">{label}</p>;
}
