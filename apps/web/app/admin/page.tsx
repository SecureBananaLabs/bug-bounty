"use client";

import { useEffect, useMemo, useState } from "react";

type UserStatus = "active" | "suspended" | "banned";
type UserRole = "admin" | "client" | "freelancer";
type QueueStatus = "flagged" | "approved" | "rejected" | "escalated";
type DisputeStatus = "open" | "under_review" | "resolved";

type User = {
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

type FlaggedJob = {
  id: string;
  jobId: string;
  title: string;
  clientId: string;
  status: QueueStatus;
  reason: string;
  reportCount: number;
};

type Dispute = {
  id: string;
  jobTitle: string;
  clientId: string;
  freelancerId: string;
  status: DisputeStatus;
  amount: number;
  thread: { by: string; body: string; at: string }[];
  evidence: string[];
};

type AuditEntry = {
  id: string;
  adminId: string;
  actionType: string;
  targetId: string;
  detail: string;
  at: string;
};

type Controls = {
  registrations: boolean;
  jobPostings: boolean;
};

const seedUsers: User[] = [
  {
    id: "usr_admin",
    name: "Avery Admin",
    email: "avery.admin@example.com",
    role: "admin",
    status: "active",
    joinedAt: "2026-01-04",
    trustScore: 97,
    activeJobs: ["job_101"],
    disputeHistory: []
  },
  {
    id: "usr_client_1",
    name: "Nora Client",
    email: "nora.client@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-02-11",
    trustScore: 86,
    activeJobs: ["job_101", "job_204"],
    disputeHistory: ["dsp_1"]
  },
  {
    id: "usr_freelancer_1",
    name: "Mika Freelancer",
    email: "mika.freelancer@example.com",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2026-03-08",
    trustScore: 62,
    activeJobs: ["job_204"],
    disputeHistory: ["dsp_1", "dsp_2"]
  }
];

const seedJobs: FlaggedJob[] = [
  {
    id: "flag_1",
    jobId: "job_101",
    title: "Build payment dashboard",
    clientId: "usr_client_1",
    status: "flagged",
    reason: "Automated rule detected payment-account language",
    reportCount: 2
  },
  {
    id: "flag_2",
    jobId: "job_204",
    title: "Scrape competitor marketplace",
    clientId: "usr_client_2",
    status: "escalated",
    reason: "User report: possible ToS violation",
    reportCount: 5
  }
];

const seedDisputes: Dispute[] = [
  {
    id: "dsp_1",
    jobTitle: "Migrate dashboard widgets",
    clientId: "usr_client_1",
    freelancerId: "usr_freelancer_1",
    status: "open",
    amount: 1800,
    thread: [
      { by: "client", body: "Milestone two is incomplete.", at: "2026-05-05" },
      { by: "freelancer", body: "The reviewed scope was delivered yesterday.", at: "2026-05-05" }
    ],
    evidence: ["scope-change.pdf", "handoff-video.mp4"]
  },
  {
    id: "dsp_2",
    jobTitle: "Landing page copy review",
    clientId: "usr_client_2",
    freelancerId: "usr_freelancer_1",
    status: "under_review",
    amount: 450,
    thread: [{ by: "freelancer", body: "Client requested work outside the contract.", at: "2026-05-06" }],
    evidence: ["original-brief.md", "revision-thread.txt"]
  }
];

export default function AdminPanelPage() {
  const [role, setRole] = useState("admin");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [users, setUsers] = useState(seedUsers);
  const [jobs, setJobs] = useState(seedJobs);
  const [disputes, setDisputes] = useState(seedDisputes);
  const [controls, setControls] = useState<Controls>({ registrations: true, jobPostings: true });
  const [audit, setAudit] = useState<AuditEntry[]>([
    {
      id: "aud_1",
      adminId: "usr_admin",
      actionType: "panel.loaded",
      targetId: "admin",
      detail: "Admin panel opened",
      at: new Date().toISOString()
    }
  ]);

  useEffect(() => {
    const storedRole = window.localStorage.getItem("freelanceflow_role");
    if (storedRole) {
      setRole(storedRole);
    }
    refresh();
  }, []);

  const metrics = useMemo(() => {
    const activeJobs = users.reduce((count, user) => count + user.activeJobs.length, 0);
    return {
      totalUsers: users.length,
      activeJobs,
      openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
      flaggedListings: jobs.filter((job) => ["flagged", "escalated"].includes(job.status)).length,
      revenue: "$128,900"
    };
  }, [disputes, jobs, users]);

  const filteredUsers = users.filter((user) => {
    const haystack = `${user.name} ${user.email} ${user.id}`.toLowerCase();
    return (
      haystack.includes(search.toLowerCase()) &&
      (roleFilter === "all" || user.role === roleFilter) &&
      (statusFilter === "all" || user.status === statusFilter)
    );
  });

  function refresh() {
    setLoading(true);
    setError("");
    window.setTimeout(() => {
      setAudit((entries) => addAudit(entries, "data.refresh", "admin-panel", "Manual or page-load data refresh"));
      setLoading(false);
    }, 250);
  }

  function changeUserStatus(id: string, status: UserStatus) {
    const reason = window.prompt(`Reason for ${status} action`);
    if (!reason) {
      return;
    }

    setUsers((current) => current.map((user) => (user.id === id ? { ...user, status } : user)));
    setAudit((entries) => addAudit(entries, `user.${status}`, id, reason));
  }

  function moderateJob(id: string, status: QueueStatus) {
    const reason = window.prompt(`Reason for ${status}`);
    if (!reason) {
      return;
    }

    setJobs((current) => current.map((job) => (job.id === id ? { ...job, status } : job)));
    setAudit((entries) => addAudit(entries, `job.${status}`, id, reason));
  }

  function ruleDispute(id: string, outcome: "client" | "freelancer" | "refund" | "escalate") {
    const reason = window.prompt(`Reason for ${outcome} ruling`);
    if (!reason) {
      return;
    }

    setDisputes((current) =>
      current.map((dispute) =>
        dispute.id === id ? { ...dispute, status: outcome === "escalate" ? "under_review" : "resolved" } : dispute
      )
    );
    setAudit((entries) => addAudit(entries, `dispute.${outcome}`, id, reason));
  }

  function toggleControl(key: keyof Controls) {
    const next = !controls[key];
    if (!window.confirm(`Set ${key} to ${next ? "enabled" : "disabled"}?`)) {
      return;
    }

    setControls((current) => ({ ...current, [key]: next }));
    setAudit((entries) => addAudit(entries, `control.${key}`, key, `Set to ${next}`));
  }

  if (role !== "admin") {
    return (
      <section className="card" role="alert" aria-label="Forbidden">
        <h2>403</h2>
        <p>Admin access required.</p>
      </section>
    );
  }

  return (
    <section className="admin-shell" aria-label="Admin panel">
      <div className="admin-header">
        <div>
          <h2>Admin Operations</h2>
          <p>Users, moderation, disputes, controls, and audit activity.</p>
        </div>
        <button type="button" onClick={refresh} aria-label="Refresh admin data">
          Refresh
        </button>
      </div>

      {loading ? <div className="card">Loading admin data...</div> : null}
      {error ? <div className="card" role="alert">{error}</div> : null}

      <div className="metric-grid">
        {Object.entries(metrics).map(([label, value]) => (
          <article className="metric-card" key={label}>
            <span>{label.replace(/[A-Z]/g, (match) => ` ${match.toLowerCase()}`)}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <div className="card">
        <h3>Trust Score Distribution</h3>
        <div className="trust-bars" aria-label="Trust score distribution chart">
          {[30, 55, 80, 96].map((score) => (
            <div key={score}>
              <span>{score}</span>
              <meter min={0} max={100} value={score} aria-label={`Trust score ${score}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <input aria-label="Search users" placeholder="Search users" value={search} onChange={(event) => setSearch(event.target.value)} />
          <select aria-label="Filter by role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="all">All roles</option>
            <option value="admin">Admins</option>
            <option value="client">Clients</option>
            <option value="freelancer">Freelancers</option>
          </select>
          <select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
        </div>
        <AdminTable
          headers={["User", "Role", "Status", "Joined", "Profile", "Actions"]}
          empty="No users match the current filters."
          rows={filteredUsers.map((user) => [
            `${user.name} (${user.email})`,
            user.role,
            user.status,
            user.joinedAt,
            `${user.activeJobs.length} jobs, ${user.disputeHistory.length} disputes`,
            <div className="button-row" key={user.id}>
              <button type="button" onClick={() => changeUserStatus(user.id, "suspended")}>Suspend</button>
              <button type="button" onClick={() => changeUserStatus(user.id, "active")}>Reinstate</button>
              <button type="button" onClick={() => changeUserStatus(user.id, "banned")}>Ban</button>
            </div>
          ])}
        />
      </div>

      <QueueSection title="Job Moderation">
        <AdminTable
          headers={["Listing", "Reason", "Reports", "Status", "Actions"]}
          empty="No flagged listings."
          rows={jobs.map((job) => [
            job.title,
            job.reason,
            String(job.reportCount),
            job.status,
            <div className="button-row" key={job.id}>
              <button type="button" onClick={() => moderateJob(job.id, "approved")}>Approve</button>
              <button type="button" onClick={() => moderateJob(job.id, "rejected")}>Reject</button>
              <button type="button" onClick={() => moderateJob(job.id, "escalated")}>Escalate</button>
            </div>
          ])}
        />
      </QueueSection>

      <QueueSection title="Dispute Resolution">
        <AdminTable
          headers={["Dispute", "Status", "Evidence", "Thread", "Actions"]}
          empty="No open disputes."
          rows={disputes.map((dispute) => [
            `${dispute.jobTitle} ($${dispute.amount})`,
            dispute.status,
            dispute.evidence.join(", "),
            dispute.thread.map((item) => `${item.by}: ${item.body}`).join(" | "),
            <div className="button-row" key={dispute.id}>
              <button type="button" onClick={() => ruleDispute(dispute.id, "client")}>Client</button>
              <button type="button" onClick={() => ruleDispute(dispute.id, "freelancer")}>Freelancer</button>
              <button type="button" onClick={() => ruleDispute(dispute.id, "refund")}>Refund</button>
              <button type="button" onClick={() => ruleDispute(dispute.id, "escalate")}>Escalate</button>
            </div>
          ])}
        />
      </QueueSection>

      <QueueSection title="Platform Controls">
        <div className="controls-grid">
          <label>
            <input type="checkbox" checked={controls.registrations} onChange={() => toggleControl("registrations")} />
            New user registrations
          </label>
          <label>
            <input type="checkbox" checked={controls.jobPostings} onChange={() => toggleControl("jobPostings")} />
            New job postings
          </label>
        </div>
      </QueueSection>

      <QueueSection title="Audit Log">
        <AdminTable
          headers={["Time", "Admin", "Action", "Target", "Detail"]}
          empty="No audit entries."
          rows={audit.map((entry) => [entry.at, entry.adminId, entry.actionType, entry.targetId, entry.detail])}
        />
      </QueueSection>
    </section>
  );
}

function QueueSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function AdminTable({ headers, rows, empty }: { headers: string[]; rows: React.ReactNode[][]; empty: string }) {
  if (rows.length === 0) {
    return <p>{empty}</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination" aria-label="Server-side pagination summary">Page 1 of 1</div>
    </div>
  );
}

function addAudit(entries: AuditEntry[], actionType: string, targetId: string, detail: string) {
  return [
    {
      id: `aud_${entries.length + 1}`,
      adminId: "usr_admin",
      actionType,
      targetId,
      detail,
      at: new Date().toISOString()
    },
    ...entries
  ];
}
