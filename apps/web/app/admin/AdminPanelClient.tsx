"use client";

import { useMemo, useState } from "react";

type UserStatus = "active" | "suspended" | "banned";
type JobStatus = "flagged" | "approved" | "rejected" | "escalated";
type DisputeStatus = "open" | "under_review" | "resolved";

type AdminUser = {
  id: string;
  name: string;
  role: "Admin" | "Freelancer" | "Client";
  status: UserStatus;
  joinedAt: string;
  trustScore: number;
  profile: string;
  activeJobs: string[];
  disputes: string[];
};

type FlaggedJob = {
  id: string;
  title: string;
  risk: "Low" | "Medium" | "High";
  reason: string;
  status: JobStatus;
};

type Dispute = {
  id: string;
  title: string;
  status: DisputeStatus;
  transaction: string;
  evidence: string;
  ruling?: string;
};

const initialUsers: AdminUser[] = [
  {
    id: "usr_free_1",
    name: "Ari Patel",
    role: "Freelancer",
    status: "active",
    joinedAt: "2026-02-12",
    trustScore: 91,
    profile: "Verified frontend specialist in Austin with $18.4k lifetime earnings.",
    activeJobs: ["Website refresh and Webflow migration"],
    disputes: ["Landing page conversion audit"]
  },
  {
    id: "usr_client_1",
    name: "Northstar Labs",
    role: "Client",
    status: "active",
    joinedAt: "2026-03-08",
    trustScore: 76,
    profile: "Verified client in Boston with $42.8k lifetime spend.",
    activeJobs: ["Website refresh and Webflow migration", "Analytics pipeline for marketplace data"],
    disputes: ["Landing page conversion audit"]
  },
  {
    id: "usr_client_2",
    name: "LaunchBox Studio",
    role: "Client",
    status: "suspended",
    joinedAt: "2026-04-18",
    trustScore: 42,
    profile: "Unverified remote client with one open moderation hold.",
    activeJobs: [],
    disputes: ["Brand kit and logo refresh"]
  }
];

const initialJobs: FlaggedJob[] = [
  {
    id: "job_website_refresh",
    title: "Website refresh and Webflow migration",
    risk: "Medium",
    reason: "Repeated off-platform payment language",
    status: "flagged"
  },
  {
    id: "job_crypto_clone",
    title: "Clone trading dashboard in 24 hours",
    risk: "High",
    reason: "High-risk financial claims and unrealistic delivery",
    status: "escalated"
  }
];

const initialDisputes: Dispute[] = [
  {
    id: "dsp_landing_refund",
    title: "Landing page conversion audit",
    status: "open",
    transaction: "$2,400 held",
    evidence: "Mobile QA report and Lighthouse before/after archive"
  },
  {
    id: "dsp_logo_scope",
    title: "Brand kit and logo refresh",
    status: "under_review",
    transaction: "$900 held",
    evidence: "Revision history and milestone contract"
  }
];

const initialControls = {
  "New registrations": true,
  "Job posting": true,
  "Payout processing": true,
  "Maintenance mode": false
};

function StatusBadge({ children }: { children: React.ReactNode }) {
  return <span className="status-badge">{children}</span>;
}

export function AdminPanelClient() {
  const [users, setUsers] = useState(initialUsers);
  const [jobs, setJobs] = useState(initialJobs);
  const [disputes, setDisputes] = useState(initialDisputes);
  const [controls, setControls] = useState(initialControls);
  const [selectedUserId, setSelectedUserId] = useState(initialUsers[0].id);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [joinedAfter, setJoinedAfter] = useState("");
  const [notice, setNotice] = useState("Dashboard data refreshed.");

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = `${user.name} ${user.profile}`.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      const matchesJoined = !joinedAfter || user.joinedAt >= joinedAfter;
      return matchesSearch && matchesRole && matchesStatus && matchesJoined;
    });
  }, [joinedAfter, roleFilter, search, statusFilter, users]);

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0];
  const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
  const flaggedListings = jobs.filter((job) => job.status === "flagged").length;
  const activeJobs = jobs.filter((job) => job.status !== "rejected").length;
  const trustBuckets = [
    { label: "0-49", height: users.filter((user) => user.trustScore < 50).length * 35 },
    { label: "50-79", height: users.filter((user) => user.trustScore >= 50 && user.trustScore < 80).length * 35 },
    { label: "80-100", height: users.filter((user) => user.trustScore >= 80).length * 35 }
  ];

  function refreshData() {
    setUsers(initialUsers);
    setJobs(initialJobs);
    setDisputes(initialDisputes);
    setControls(initialControls);
    setSelectedUserId(initialUsers[0].id);
    setNotice("Dashboard data refreshed.");
  }

  function updateUserStatus(userId: string, status: UserStatus) {
    setUsers((current) => current.map((user) => (user.id === userId ? { ...user, status } : user)));
    setNotice(`User status changed to ${status}.`);
  }

  function moderateJob(jobId: string, status: JobStatus) {
    setJobs((current) => current.map((job) => (job.id === jobId ? { ...job, status } : job)));
    setNotice(`Listing moved to ${status}.`);
  }

  function ruleDispute(disputeId: string, ruling: string) {
    setDisputes((current) =>
      current.map((dispute) =>
        dispute.id === disputeId
          ? { ...dispute, status: ruling === "escalated" ? "under_review" : "resolved", ruling }
          : dispute
      )
    );
    setNotice(`Dispute ruling saved: ${ruling}.`);
  }

  return (
    <section className="admin-shell">
      <div className="admin-header">
        <div>
          <p className="eyebrow">Admin console</p>
          <h2>Trust, moderation, and platform operations</h2>
          <p className="notice">{notice}</p>
        </div>
        <button className="secondary-button" type="button" onClick={refreshData}>Refresh</button>
      </div>

      <div className="metric-grid">
        {[
          ["Total users", users.length.toString()],
          ["Active jobs", activeJobs.toString()],
          ["Open disputes", openDisputes.toString()],
          ["Flagged listings", flaggedListings.toString()],
          ["Revenue", "$3.3k"]
        ].map(([label, value]) => (
          <article className="metric-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <div className="admin-grid">
        <article className="panel panel-wide">
          <div className="panel-heading">
            <h3>User management</h3>
            <div className="filter-row">
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users" />
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                <option value="all">All roles</option>
                <option value="Freelancer">Freelancers</option>
                <option value="Client">Clients</option>
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </select>
              <input type="date" value={joinedAfter} onChange={(event) => setJoinedAfter(event.target.value)} />
            </div>
          </div>
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
                  <td>{user.name}</td>
                  <td>{user.role}</td>
                  <td><StatusBadge>{user.status}</StatusBadge></td>
                  <td>{user.trustScore}</td>
                  <td>
                    <div className="action-row">
                      <button type="button" onClick={() => setSelectedUserId(user.id)}>View</button>
                      <button type="button" onClick={() => updateUserStatus(user.id, "suspended")}>Suspend</button>
                      <button type="button" onClick={() => updateUserStatus(user.id, "active")}>Reinstate</button>
                      <button type="button" onClick={() => updateUserStatus(user.id, "banned")}>Ban</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="panel">
          <h3>User profile</h3>
          <div className="queue-item">
            <strong>{selectedUser.name}</strong>
            <span>{selectedUser.profile}</span>
            <p>Active jobs: {selectedUser.activeJobs.join(", ") || "None"}</p>
            <p>Disputes: {selectedUser.disputes.join(", ") || "None"}</p>
          </div>
        </article>

        <article className="panel">
          <h3>Moderation queue</h3>
          <div className="stack">
            {jobs.map((job) => (
              <div className="queue-item" key={job.id}>
                <strong>{job.title}</strong>
                <span>{job.risk} risk - {job.status}</span>
                <p>{job.reason}</p>
                <div className="action-row">
                  <button type="button" onClick={() => moderateJob(job.id, "approved")}>Approve</button>
                  <button type="button" onClick={() => moderateJob(job.id, "rejected")}>Reject</button>
                  <button type="button" onClick={() => moderateJob(job.id, "escalated")}>Escalate</button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <h3>Dispute resolution</h3>
          <div className="stack">
            {disputes.map((dispute) => (
              <div className="queue-item" key={dispute.id}>
                <strong>{dispute.title}</strong>
                <span>{dispute.status} - {dispute.transaction}</span>
                <p>{dispute.evidence}</p>
                {dispute.ruling ? <p>Ruling: {dispute.ruling}</p> : null}
                <div className="action-row">
                  <button type="button" onClick={() => ruleDispute(dispute.id, "freelancer")}>Freelancer</button>
                  <button type="button" onClick={() => ruleDispute(dispute.id, "refund")}>Refund</button>
                  <button type="button" onClick={() => ruleDispute(dispute.id, "escalated")}>Escalate</button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <h3>Trust distribution</h3>
          <div className="bar-chart">
            {trustBuckets.map((bucket) => (
              <div key={bucket.label} style={{ height: `${Math.max(bucket.height, 30)}%` }}>
                <span>{bucket.label}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <h3>Platform controls</h3>
          <div className="stack">
            {Object.entries(controls).map(([label, enabled]) => (
              <label className="toggle-row" key={label}>
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(event) => {
                    setControls((current) => ({ ...current, [label]: event.target.checked }));
                    setNotice(`${label} ${event.target.checked ? "enabled" : "disabled"}.`);
                  }}
                />
              </label>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
