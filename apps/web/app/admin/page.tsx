"use client";

import { useMemo, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  role: "client" | "freelancer";
  status: "active" | "suspended" | "banned";
  joinedAt: string;
  activeJobs: number;
  disputes: number;
  trustScore: number;
};

type ModerationItem = {
  id: string;
  title: string;
  owner: string;
  status: "flagged" | "under_review" | "approved" | "rejected" | "escalated";
  reason: string;
};

type Dispute = {
  id: string;
  parties: string;
  amount: number;
  status: "open" | "under_review" | "resolved";
  evidence: string;
};

type AuditEntry = {
  id: string;
  admin: string;
  action: string;
  target: string;
  createdAt: string;
};

const initialUsers: User[] = [
  {
    id: "usr_client_1",
    name: "Avery Client",
    email: "avery@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-04-08",
    activeJobs: 3,
    disputes: 1,
    trustScore: 92
  },
  {
    id: "usr_freelancer_1",
    name: "Maya Dev",
    email: "maya@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-03-20",
    activeJobs: 2,
    disputes: 0,
    trustScore: 97
  },
  {
    id: "usr_freelancer_2",
    name: "Jordan UX",
    email: "jordan@example.com",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2026-02-14",
    activeJobs: 0,
    disputes: 2,
    trustScore: 64
  },
  {
    id: "usr_client_2",
    name: "Beacon Labs",
    email: "ops@beacon.example",
    role: "client",
    status: "active",
    joinedAt: "2026-05-01",
    activeJobs: 1,
    disputes: 0,
    trustScore: 88
  }
];

const initialModeration: ModerationItem[] = [
  {
    id: "mod_101",
    title: "Scrape private customer portals",
    owner: "Avery Client",
    status: "flagged",
    reason: "Potentially prohibited data access request"
  },
  {
    id: "mod_102",
    title: "Migrate legacy API to Node.js",
    owner: "Beacon Labs",
    status: "under_review",
    reason: "Scope changed after proposal acceptance"
  }
];

const initialDisputes: Dispute[] = [
  {
    id: "dsp_201",
    parties: "Avery Client / Jordan UX",
    amount: 900,
    status: "open",
    evidence: "Scope brief, milestone delivery, message thread"
  },
  {
    id: "dsp_202",
    parties: "Beacon Labs / Maya Dev",
    amount: 1500,
    status: "under_review",
    evidence: "Contract, demo recording, invoice"
  }
];

export default function AdminPanelPage() {
  const [users, setUsers] = useState(initialUsers);
  const [moderation, setModeration] = useState(initialModeration);
  const [disputes, setDisputes] = useState(initialDisputes);
  const [registrationsEnabled, setRegistrationsEnabled] = useState(true);
  const [jobPostingEnabled, setJobPostingEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState("users");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [refreshedAt, setRefreshedAt] = useState(new Date().toLocaleTimeString());
  const [audit, setAudit] = useState<AuditEntry[]>([
    {
      id: "aud_1",
      admin: "usr_admin",
      action: "panel.open",
      target: "admin",
      createdAt: new Date().toLocaleString()
    }
  ]);

  const metrics = useMemo(() => ({
    totalUsers: users.length,
    activeJobs: users.reduce((sum, user) => sum + user.activeJobs, 0),
    openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
    flaggedListings: moderation.filter((item) => !["approved", "rejected"].includes(item.status)).length,
    revenue: "$128.9k"
  }), [disputes, moderation, users]);

  const filteredUsers = users.filter((user) => {
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    const matchesSearch = `${user.name} ${user.email}`.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesStatus && matchesSearch;
  });

  function addAudit(action: string, target: string) {
    setAudit((entries) => [
      {
        id: `aud_${entries.length + 1}`,
        admin: "usr_admin",
        action,
        target,
        createdAt: new Date().toLocaleString()
      },
      ...entries
    ]);
  }

  function setUserStatus(userId: string, status: User["status"]) {
    setUsers((rows) => rows.map((user) => (user.id === userId ? { ...user, status } : user)));
    addAudit(`user.${status}`, userId);
  }

  function setModerationStatus(itemId: string, status: ModerationItem["status"]) {
    setModeration((rows) => rows.map((item) => (item.id === itemId ? { ...item, status } : item)));
    addAudit(`moderation.${status}`, itemId);
  }

  function setDisputeStatus(disputeId: string, status: Dispute["status"]) {
    setDisputes((rows) => rows.map((dispute) => (dispute.id === disputeId ? { ...dispute, status } : dispute)));
    addAudit(`dispute.${status}`, disputeId);
  }

  function toggleControl(name: "registrations" | "jobs", nextValue: boolean) {
    const confirmed = window.confirm(`Apply ${name} control change?`);
    if (!confirmed) {
      return;
    }

    if (name === "registrations") {
      setRegistrationsEnabled(nextValue);
    } else {
      setJobPostingEnabled(nextValue);
    }
    addAudit(`controls.${name}`, "platform");
  }

  function refreshData() {
    setRefreshedAt(new Date().toLocaleTimeString());
    addAudit("panel.refresh", "admin");
  }

  return (
    <section className="admin-panel" aria-labelledby="admin-title">
      <div className="admin-toolbar">
        <div>
          <h2 id="admin-title">Admin Operations</h2>
          <p>Last refresh {refreshedAt}</p>
        </div>
        <button type="button" onClick={refreshData} aria-label="Refresh admin data">
          Refresh
        </button>
      </div>

      <div className="admin-metrics" aria-label="Platform metrics">
        <Metric label="Users" value={metrics.totalUsers.toString()} />
        <Metric label="Active Jobs" value={metrics.activeJobs.toString()} />
        <Metric label="Open Disputes" value={metrics.openDisputes.toString()} />
        <Metric label="Flagged" value={metrics.flaggedListings.toString()} />
        <Metric label="Revenue" value={metrics.revenue} />
      </div>

      <div className="admin-tabs" role="tablist" aria-label="Admin sections">
        {["users", "moderation", "disputes", "controls", "audit"].map((tab) => (
          <button
            type="button"
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "users" && (
        <section className="admin-section" aria-label="User management">
          <div className="admin-filters">
            <input
              aria-label="Search users"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users"
            />
            <select aria-label="Filter users by role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              <option value="all">All roles</option>
              <option value="client">Clients</option>
              <option value="freelancer">Freelancers</option>
            </select>
            <select aria-label="Filter users by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </div>
          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Trust</th>
                  <th>Action</th>
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
                    <td>{user.status}</td>
                    <td>{user.joinedAt}</td>
                    <td>
                      <div className="trust-bar" aria-label={`Trust score ${user.trustScore}`}>
                        <span style={{ width: `${user.trustScore}%` }} />
                      </div>
                    </td>
                    <td className="admin-actions">
                      <button type="button" onClick={() => setUserStatus(user.id, "active")}>Reinstate</button>
                      <button type="button" onClick={() => setUserStatus(user.id, "suspended")}>Suspend</button>
                      <button type="button" onClick={() => setUserStatus(user.id, "banned")}>Ban</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "moderation" && (
        <QueueSection
          title="Moderation"
          rows={moderation}
          primaryKey="owner"
          secondaryKey="reason"
          actions={[
            ["Approve", (id) => setModerationStatus(id, "approved")],
            ["Reject", (id) => setModerationStatus(id, "rejected")],
            ["Escalate", (id) => setModerationStatus(id, "escalated")]
          ]}
        />
      )}

      {activeTab === "disputes" && (
        <QueueSection
          title="Disputes"
          rows={disputes.map((dispute) => ({
            id: dispute.id,
            title: dispute.parties,
            owner: `$${dispute.amount}`,
            status: dispute.status,
            reason: dispute.evidence
          }))}
          primaryKey="owner"
          secondaryKey="reason"
          actions={[
            ["Client", (id) => setDisputeStatus(id, "resolved")],
            ["Freelancer", (id) => setDisputeStatus(id, "resolved")],
            ["Escalate", (id) => setDisputeStatus(id, "under_review")]
          ]}
        />
      )}

      {activeTab === "controls" && (
        <section className="admin-section" aria-label="Platform controls">
          <label className="toggle-row">
            <span>Registrations</span>
            <input
              type="checkbox"
              checked={registrationsEnabled}
              onChange={(event) => toggleControl("registrations", event.target.checked)}
            />
          </label>
          <label className="toggle-row">
            <span>Job postings</span>
            <input
              type="checkbox"
              checked={jobPostingEnabled}
              onChange={(event) => toggleControl("jobs", event.target.checked)}
            />
          </label>
        </section>
      )}

      {activeTab === "audit" && (
        <section className="admin-section" aria-label="Audit log">
          <div className="admin-table-wrap">
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
                {audit.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.createdAt}</td>
                    <td>{entry.admin}</td>
                    <td>{entry.action}</td>
                    <td>{entry.target}</td>
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function QueueSection({
  title,
  rows,
  primaryKey,
  secondaryKey,
  actions
}: {
  title: string;
  rows: Array<{ id: string; title: string; owner: string; status: string; reason: string }>;
  primaryKey: "owner";
  secondaryKey: "reason";
  actions: Array<[string, (id: string) => void]>;
}) {
  return (
    <section className="admin-section" aria-label={title}>
      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>{title}</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Context</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td><strong>{row.title}</strong></td>
                <td>{row[primaryKey]}</td>
                <td>{row.status}</td>
                <td>{row[secondaryKey]}</td>
                <td className="admin-actions">
                  {actions.map(([label, action]) => (
                    <button type="button" key={label} onClick={() => action(row.id)}>
                      {label}
                    </button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
