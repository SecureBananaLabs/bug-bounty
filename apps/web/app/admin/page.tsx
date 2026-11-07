"use client";

import { useEffect, useMemo, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  role: "client" | "freelancer" | "admin";
  status: string;
  verified: boolean;
  trustScore: number;
  flags: number;
  totalSpend: number;
  totalEarned: number;
};

type Job = {
  id: string;
  title: string;
  client: string;
  category: string;
  status: string;
  moderationStatus: string;
  budget: number;
  proposals: number;
  risk: string;
  featured?: boolean;
};

type Dispute = {
  id: string;
  jobId: string;
  client: string;
  freelancer: string;
  amount: number;
  status: string;
  priority: string;
  reason: string;
  resolution?: string;
};

type Control = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
};

type AuditEvent = {
  id: string;
  actor: string;
  type: string;
  target: string;
  reason: string;
  createdAt: string;
};

const initialUsers: User[] = [
  { id: "usr_1001", name: "Maya Chen", email: "maya@example.com", role: "freelancer", status: "active", verified: true, trustScore: 94, flags: 0, totalSpend: 0, totalEarned: 38200 },
  { id: "usr_1002", name: "Northstar Labs", email: "ops@northstar.example", role: "client", status: "active", verified: true, trustScore: 88, flags: 1, totalSpend: 74600, totalEarned: 0 },
  { id: "usr_1003", name: "Owen Park", email: "owen@example.com", role: "freelancer", status: "flagged", verified: false, trustScore: 52, flags: 3, totalSpend: 0, totalEarned: 6400 },
  { id: "usr_1004", name: "Aster Studio", email: "hello@aster.example", role: "client", status: "suspended", verified: false, trustScore: 41, flags: 4, totalSpend: 18900, totalEarned: 0 }
];

const initialJobs: Job[] = [
  { id: "job_2001", title: "Refactor billing reconciliation flow", client: "Northstar Labs", category: "Backend", status: "open", moderationStatus: "clean", budget: 6200, proposals: 18, risk: "low" },
  { id: "job_2002", title: "Build AI dashboard prototype", client: "Aster Studio", category: "Frontend", status: "paused", moderationStatus: "flagged", budget: 3100, proposals: 7, risk: "high" },
  { id: "job_2003", title: "Audit marketplace notification templates", client: "Northstar Labs", category: "Operations", status: "closed", moderationStatus: "approved", budget: 900, proposals: 4, risk: "medium" }
];

const initialDisputes: Dispute[] = [
  { id: "dsp_3001", jobId: "job_2002", client: "Aster Studio", freelancer: "Owen Park", amount: 1250, status: "open", priority: "high", reason: "Milestone delivered without required source files" },
  { id: "dsp_3002", jobId: "job_2003", client: "Northstar Labs", freelancer: "Maya Chen", amount: 450, status: "reviewing", priority: "medium", reason: "Scope change after final approval" }
];

const initialControls: Control[] = [
  { id: "new_signups", label: "New signups", description: "Allow new client and freelancer registrations", enabled: true },
  { id: "job_posting", label: "Job posting", description: "Allow clients to publish new job listings", enabled: true },
  { id: "instant_payouts", label: "Instant payouts", description: "Allow eligible freelancers to request instant payouts", enabled: false }
];

export default function AdminPanelPage() {
  const [token, setToken] = useState("");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState(initialUsers);
  const [jobs, setJobs] = useState(initialJobs);
  const [disputes, setDisputes] = useState(initialDisputes);
  const [controls, setControls] = useState(initialControls);
  const [auditLog, setAuditLog] = useState<AuditEvent[]>([
    createAudit("platform_control.updated", "instant_payouts", "Risk review window")
  ]);

  useEffect(() => {
    setToken(window.localStorage.getItem("ff_admin_token") ?? "");
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const text = `${user.name} ${user.email} ${user.role} ${user.status}`.toLowerCase();
      return text.includes(query.toLowerCase())
        && (role === "all" || user.role === role)
        && (status === "all" || user.status === status);
    });
  }, [query, role, status, users]);

  const pagedUsers = filteredUsers.slice((page - 1) * 3, page * 3);
  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / 3));
  const activeUsers = users.filter((user) => user.status === "active").length;
  const flaggedUsers = users.filter((user) => user.status === "flagged" || user.flags > 0).length;
  const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
  const monthlyVolume = users.reduce((sum, user) => sum + user.totalSpend + user.totalEarned, 0);
  const averageTrust = Math.round(users.reduce((sum, user) => sum + user.trustScore, 0) / users.length);

  async function refreshFromApi() {
    if (!token) {
      setError("No admin token found; showing local review data.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [userResult, jobResult, disputeResult, controlResult, auditResult] = await Promise.all([
        adminFetch("/api/admin/users?limit=20", token),
        adminFetch("/api/admin/jobs?limit=20", token),
        adminFetch("/api/admin/disputes?limit=20", token),
        adminFetch("/api/admin/platform-controls", token),
        adminFetch("/api/admin/audit-log?limit=10", token)
      ]);

      setUsers(userResult.data.data);
      setJobs(jobResult.data.data);
      setDisputes(disputeResult.data.data);
      setControls(controlResult.data);
      setAuditLog(auditResult.data.data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load admin API data.");
    } finally {
      setLoading(false);
    }
  }

  function startDemoSession() {
    window.localStorage.setItem("ff_admin_token", "demo-admin-token");
    setToken("demo-admin-token");
    setError("Demo session active. API calls still require a real signed admin token.");
  }

  function updateUser(userId: string, action: "activate" | "suspend" | "verify") {
    setUsers((current) => current.map((user) => {
      if (user.id !== userId) {
        return user;
      }

      return {
        ...user,
        status: action === "suspend" ? "suspended" : action === "activate" ? "active" : user.status,
        verified: action === "verify" ? true : user.verified
      };
    }));
    pushAudit("user.action", userId, `${action} from admin panel`);
  }

  function updateJob(jobId: string, action: "approve" | "hide" | "feature") {
    setJobs((current) => current.map((job) => {
      if (job.id !== jobId) {
        return job;
      }

      return {
        ...job,
        featured: action === "feature" ? true : job.featured,
        moderationStatus: action === "approve" ? "approved" : action === "hide" ? "hidden" : job.moderationStatus,
        status: action === "hide" ? "paused" : job.status
      };
    }));
    pushAudit("job.action", jobId, `${action} from admin panel`);
  }

  function resolveDispute(disputeId: string) {
    setDisputes((current) => current.map((dispute) => dispute.id === disputeId
      ? { ...dispute, status: "resolved", resolution: "split_payment" }
      : dispute));
    pushAudit("dispute.resolved", disputeId, "Resolved from admin panel");
  }

  function toggleControl(controlId: string) {
    setControls((current) => current.map((control) => control.id === controlId
      ? { ...control, enabled: !control.enabled }
      : control));
    pushAudit("platform_control.updated", controlId, "Toggled from admin panel");
  }

  function pushAudit(type: string, target: string, reason: string) {
    setAuditLog((current) => [createAudit(type, target, reason), ...current].slice(0, 8));
  }

  return (
    <section className="admin-panel" aria-labelledby="admin-title">
      <div className="admin-hero">
        <div>
          <p className="eyebrow">Admin console</p>
          <h2 id="admin-title">Trust, moderation, and platform controls</h2>
        </div>
        <div className="admin-session" aria-label="Admin route guard status">
          <span className={token ? "status-pill good" : "status-pill warn"}>
            {token ? "Guarded session" : "Token required"}
          </span>
          <button className="admin-button secondary" type="button" onClick={startDemoSession}>
            Demo session
          </button>
          <button className="admin-button" type="button" onClick={refreshFromApi} disabled={loading}>
            {loading ? "Loading" : "Refresh API"}
          </button>
        </div>
      </div>

      {error ? <p className="admin-alert" role="status">{error}</p> : null}

      <div className="metric-grid" aria-label="Platform metrics">
        <Metric label="Active users" value={activeUsers.toLocaleString()} />
        <Metric label="Flagged users" value={flaggedUsers.toLocaleString()} />
        <Metric label="Open disputes" value={openDisputes.toLocaleString()} />
        <Metric label="Monthly volume" value={`$${monthlyVolume.toLocaleString()}`} />
        <Metric label="Average trust" value={averageTrust.toString()} />
      </div>

      <div className="admin-layout">
        <section className="admin-card wide" aria-labelledby="users-title">
          <div className="admin-card-header">
            <div>
              <p className="eyebrow">Users</p>
              <h3 id="users-title">Account review queue</h3>
            </div>
            <div className="admin-filters">
              <input aria-label="Search users" placeholder="Search users" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} />
              <select aria-label="Filter role" value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }}>
                <option value="all">All roles</option>
                <option value="client">Clients</option>
                <option value="freelancer">Freelancers</option>
                <option value="admin">Admins</option>
              </select>
              <select aria-label="Filter status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="flagged">Flagged</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {pagedUsers.length === 0 ? (
            <p className="empty-state">No users match the current filters.</p>
          ) : (
            <div className="admin-table" role="table" aria-label="Admin users">
              {pagedUsers.map((user) => (
                <div className="admin-row" role="row" key={user.id}>
                  <div>
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                  <span className="status-pill">{user.role}</span>
                  <span className={user.status === "active" ? "status-pill good" : "status-pill warn"}>{user.status}</span>
                  <span>Trust {user.trustScore}</span>
                  <div className="action-row">
                    <button type="button" onClick={() => updateUser(user.id, "verify")}>Verify</button>
                    <button type="button" onClick={() => updateUser(user.id, "activate")}>Activate</button>
                    <button type="button" onClick={() => updateUser(user.id, "suspend")}>Suspend</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pagination">
            <button type="button" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Prev</button>
            <span>Page {page} of {pageCount}</span>
            <button type="button" disabled={page === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</button>
          </div>
        </section>

        <section className="admin-card" aria-labelledby="jobs-title">
          <p className="eyebrow">Jobs</p>
          <h3 id="jobs-title">Moderation queue</h3>
          <div className="stack">
            {jobs.map((job) => (
              <article className="compact-item" key={job.id}>
                <div>
                  <strong>{job.title}</strong>
                  <span>{job.client} · ${job.budget.toLocaleString()} · {job.proposals} proposals</span>
                </div>
                <span className={job.risk === "high" ? "status-pill warn" : "status-pill"}>{job.moderationStatus}</span>
                <div className="action-row">
                  <button type="button" onClick={() => updateJob(job.id, "approve")}>Approve</button>
                  <button type="button" onClick={() => updateJob(job.id, "feature")}>Feature</button>
                  <button type="button" onClick={() => updateJob(job.id, "hide")}>Hide</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-card" aria-labelledby="disputes-title">
          <p className="eyebrow">Disputes</p>
          <h3 id="disputes-title">Resolution desk</h3>
          <div className="stack">
            {disputes.map((dispute) => (
              <article className="compact-item" key={dispute.id}>
                <div>
                  <strong>{dispute.client} vs {dispute.freelancer}</strong>
                  <span>{dispute.reason}</span>
                </div>
                <span className={dispute.priority === "high" ? "status-pill warn" : "status-pill"}>{dispute.status}</span>
                <button type="button" onClick={() => resolveDispute(dispute.id)} disabled={dispute.status === "resolved"}>
                  Resolve
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-card" aria-labelledby="controls-title">
          <p className="eyebrow">Controls</p>
          <h3 id="controls-title">Platform switches</h3>
          <div className="stack">
            {controls.map((control) => (
              <label className="switch-row" key={control.id}>
                <span>
                  <strong>{control.label}</strong>
                  <small>{control.description}</small>
                </span>
                <input type="checkbox" checked={control.enabled} onChange={() => toggleControl(control.id)} />
              </label>
            ))}
          </div>
        </section>

        <section className="admin-card" aria-labelledby="audit-title">
          <p className="eyebrow">Audit</p>
          <h3 id="audit-title">Append-only activity</h3>
          <ol className="audit-list">
            {auditLog.map((event) => (
              <li key={event.id}>
                <strong>{event.type}</strong>
                <span>{event.target} · {event.reason}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function createAudit(type: string, target: string, reason: string): AuditEvent {
  return {
    id: `aud_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    actor: "admin",
    type,
    target,
    reason,
    createdAt: new Date().toISOString()
  };
}

async function adminFetch(path: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000";
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error(`Admin API returned ${response.status}`);
  }

  return response.json();
}
