"use client";

import { useMemo, useState } from "react";

type AdminTab = "overview" | "users" | "jobs" | "disputes" | "controls" | "audit";
type UserStatus = "active" | "review" | "suspended" | "banned";
type JobStatus = "queued" | "flagged" | "approved" | "rejected";
type DisputeStatus = "open" | "evidence" | "refunded" | "released" | "escalated";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "client" | "freelancer";
  status: UserStatus;
  trustScore: number;
  joinedAt: string;
};

type ModerationJob = {
  id: string;
  title: string;
  client: string;
  status: JobStatus;
  risk: "low" | "medium" | "high";
  budget: number;
  reason: string;
};

type Dispute = {
  id: string;
  jobTitle: string;
  client: string;
  freelancer: string;
  status: DisputeStatus;
  amount: number;
  openedAt: string;
};

type AuditEvent = {
  id: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
};

const initialUsers: AdminUser[] = [
  { id: "usr_101", name: "Maya Chen", email: "maya@example.com", role: "freelancer", status: "active", trustScore: 98, joinedAt: "2026-03-15" },
  { id: "usr_102", name: "Jordan Lee", email: "jordan@example.com", role: "client", status: "active", trustScore: 91, joinedAt: "2026-03-21" },
  { id: "usr_103", name: "Priya Raman", email: "priya@example.com", role: "freelancer", status: "review", trustScore: 72, joinedAt: "2026-04-02" },
  { id: "usr_104", name: "Northstar Labs", email: "ops@northstar.test", role: "client", status: "suspended", trustScore: 48, joinedAt: "2026-04-18" }
];

const initialJobs: ModerationJob[] = [
  { id: "job_201", title: "AI customer support widget", client: "Northstar Labs", status: "flagged", risk: "high", budget: 1500, reason: "External payment request" },
  { id: "job_202", title: "Node.js API migration", client: "AtlasWorks", status: "queued", risk: "medium", budget: 2800, reason: "Large fixed scope" },
  { id: "job_203", title: "SaaS onboarding redesign", client: "HaloStart", status: "approved", risk: "low", budget: 900, reason: "Clean listing" }
];

const initialDisputes: Dispute[] = [
  { id: "dsp_301", jobTitle: "Backend audit", client: "Northstar Labs", freelancer: "Maya Chen", status: "open", amount: 640, openedAt: "2026-05-22" },
  { id: "dsp_302", jobTitle: "Landing page copy", client: "HaloStart", freelancer: "Priya Raman", status: "evidence", amount: 280, openedAt: "2026-05-24" }
];

const initialAudit: AuditEvent[] = [
  { id: "aud_001", actor: "system", action: "daily_metrics_refreshed", target: "platform", createdAt: "2026-05-29T08:15:00.000Z" },
  { id: "aud_002", actor: "admin_1", action: "job_flag_reviewed", target: "job_201", createdAt: "2026-05-29T09:30:00.000Z" }
];

const tabs: Array<{ id: AdminTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "jobs", label: "Jobs" },
  { id: "disputes", label: "Disputes" },
  { id: "controls", label: "Controls" },
  { id: "audit", label: "Audit" }
];

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function titleCase(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status: string) {
  return `status status-${status}`;
}

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [users, setUsers] = useState(initialUsers);
  const [jobs, setJobs] = useState(initialJobs);
  const [disputes, setDisputes] = useState(initialDisputes);
  const [audit, setAudit] = useState(initialAudit);
  const [userFilter, setUserFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");
  const [controls, setControls] = useState({
    registrationOpen: true,
    jobPostingOpen: true,
    payoutReviewRequired: true,
    maintenanceMode: false
  });

  const metrics = useMemo(() => {
    const activeFreelancers = users.filter((user) => user.role === "freelancer" && user.status === "active").length;
    const flaggedAccounts = users.filter((user) => ["review", "suspended", "banned"].includes(user.status)).length;
    const openJobs = jobs.filter((job) => job.status !== "rejected").length;
    const openDisputes = disputes.filter((dispute) => ["open", "evidence"].includes(dispute.status)).length;
    const monthlyVolume = jobs.reduce((total, job) => total + job.budget, 0);

    return [
      { label: "Open Jobs", value: String(openJobs), tone: "teal" },
      { label: "Active Freelancers", value: String(activeFreelancers), tone: "green" },
      { label: "Flagged Accounts", value: String(flaggedAccounts), tone: "amber" },
      { label: "Open Disputes", value: String(openDisputes), tone: "rose" },
      { label: "Monthly Volume", value: formatMoney(monthlyVolume), tone: "blue" }
    ];
  }, [disputes, jobs, users]);

  const visibleUsers = users.filter((user) => userFilter === "all" || user.status === userFilter);
  const visibleJobs = jobs.filter((job) => jobFilter === "all" || job.status === jobFilter);

  function record(action: string, target: string) {
    setAudit((events) => [
      {
        id: `aud_ui_${Date.now()}`,
        actor: "admin_1",
        action,
        target,
        createdAt: new Date().toISOString()
      },
      ...events
    ]);
  }

  function setUserStatus(id: string, status: UserStatus) {
    setUsers((items) => items.map((user) => (user.id === id ? { ...user, status } : user)));
    record(`user_status_${status}`, id);
  }

  function setJobStatus(id: string, status: JobStatus) {
    setJobs((items) => items.map((job) => (job.id === id ? { ...job, status } : job)));
    record(`job_${status}`, id);
  }

  function setDisputeStatus(id: string, status: DisputeStatus) {
    setDisputes((items) => items.map((dispute) => (dispute.id === id ? { ...dispute, status } : dispute)));
    record(`dispute_${status}`, id);
  }

  function toggleControl(key: keyof typeof controls) {
    setControls((current) => {
      const next = { ...current, [key]: !current[key] };
      return next;
    });
    record("platform_controls_updated", titleCase(key));
  }

  return (
    <section className="admin-shell">
      <div className="admin-header">
        <div>
          <h2>Admin Operations</h2>
          <p>Monitor marketplace health, review queues, and govern sensitive platform actions.</p>
        </div>
        <div className="admin-health">
          <span className={controls.maintenanceMode ? "status status-rejected" : "status status-active"}>
            {controls.maintenanceMode ? "Maintenance" : "Live"}
          </span>
          <strong>{audit.length}</strong>
          <span>audit events</span>
        </div>
      </div>

      <div className="admin-tabs" role="tablist" aria-label="Admin sections">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? "active" : ""}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-grid">
        <div className="admin-main">
          {(activeTab === "overview" || activeTab === "users") && (
            <>
              <div className="metric-grid">
                {metrics.map((metric) => (
                  <article className={`metric metric-${metric.tone}`} key={metric.label}>
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                  </article>
                ))}
              </div>

              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>User Management</h3>
                    <p>Filter accounts and apply review actions without leaving the queue.</p>
                  </div>
                  <select aria-label="Filter users by status" value={userFilter} onChange={(event) => setUserFilter(event.target.value)}>
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="review">Review</option>
                    <option value="suspended">Suspended</option>
                    <option value="banned">Banned</option>
                  </select>
                </div>
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
                      {visibleUsers.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <strong>{user.name}</strong>
                            <span>{user.email}</span>
                          </td>
                          <td>{titleCase(user.role)}</td>
                          <td><span className={statusClass(user.status)}>{titleCase(user.status)}</span></td>
                          <td>{user.trustScore}</td>
                          <td>
                            <div className="row-actions">
                              <button type="button" onClick={() => setUserStatus(user.id, "active")}>Approve</button>
                              <button type="button" onClick={() => setUserStatus(user.id, "suspended")}>Suspend</button>
                              <button type="button" onClick={() => setUserStatus(user.id, "banned")}>Ban</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {(activeTab === "overview" || activeTab === "jobs") && (
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h3>Job Moderation</h3>
                  <p>Review flagged listings and keep risky marketplace posts out of circulation.</p>
                </div>
                <select aria-label="Filter jobs by status" value={jobFilter} onChange={(event) => setJobFilter(event.target.value)}>
                  <option value="all">All jobs</option>
                  <option value="queued">Queued</option>
                  <option value="flagged">Flagged</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="queue-list">
                {visibleJobs.map((job) => (
                  <article className="queue-row" key={job.id}>
                    <div>
                      <strong>{job.title}</strong>
                      <span>{job.client} - {formatMoney(job.budget)} - {job.reason}</span>
                    </div>
                    <span className={statusClass(job.risk)}>{titleCase(job.risk)}</span>
                    <span className={statusClass(job.status)}>{titleCase(job.status)}</span>
                    <div className="row-actions">
                      <button type="button" onClick={() => setJobStatus(job.id, "approved")}>Approve</button>
                      <button type="button" onClick={() => setJobStatus(job.id, "rejected")}>Reject</button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {activeTab === "disputes" && (
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h3>Dispute Resolution</h3>
                  <p>Track evidence, resolve escrow outcomes, and document rulings.</p>
                </div>
              </div>
              <div className="queue-list">
                {disputes.map((dispute) => (
                  <article className="queue-row" key={dispute.id}>
                    <div>
                      <strong>{dispute.jobTitle}</strong>
                      <span>{dispute.client} vs {dispute.freelancer} - {formatMoney(dispute.amount)}</span>
                    </div>
                    <span className={statusClass(dispute.status)}>{titleCase(dispute.status)}</span>
                    <div className="row-actions">
                      <button type="button" onClick={() => setDisputeStatus(dispute.id, "released")}>Release</button>
                      <button type="button" onClick={() => setDisputeStatus(dispute.id, "refunded")}>Refund</button>
                      <button type="button" onClick={() => setDisputeStatus(dispute.id, "escalated")}>Escalate</button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {activeTab === "controls" && (
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h3>Platform Controls</h3>
                  <p>Change high-impact platform switches with immediate audit logging.</p>
                </div>
              </div>
              <div className="control-grid">
                {Object.entries(controls).map(([key, enabled]) => (
                  <label className="control-row" key={key}>
                    <span>
                      <strong>{titleCase(key)}</strong>
                      <small>{enabled ? "Enabled" : "Disabled"}</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => toggleControl(key as keyof typeof controls)}
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeTab === "audit" && (
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h3>Audit Log</h3>
                  <p>Append-only activity generated by moderation actions and controls.</p>
                </div>
              </div>
              <AuditList events={audit} />
            </div>
          )}
        </div>

        <aside className="panel admin-rail">
          <div className="panel-heading compact">
            <div>
              <h3>Recent Activity</h3>
              <p>Latest admin actions</p>
            </div>
          </div>
          <AuditList events={audit.slice(0, 6)} />
        </aside>
      </div>
    </section>
  );
}

function AuditList({ events }: { events: AuditEvent[] }) {
  return (
    <ol className="audit-list">
      {events.map((event) => (
        <li key={event.id}>
          <span>{titleCase(event.action)}</span>
          <strong>{event.target}</strong>
          <small>{new Date(event.createdAt).toLocaleString()}</small>
        </li>
      ))}
    </ol>
  );
}
