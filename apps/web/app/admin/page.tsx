"use client";

import { useEffect, useMemo, useState } from "react";

type ApiEnvelope<T> = { success: boolean; data: T; message?: string };

type Metrics = {
  totalUsers: number;
  activeJobs: number;
  openDisputes: number;
  flaggedListings: number;
  revenueCurrentPeriod: number;
  trustScoreDistribution: { high: number; medium: number; low: number };
  controls: { registrationsEnabled: boolean; jobPostingEnabled: boolean };
};

type PageResult<T> = { items: T[]; page: number; pageSize: number; total: number };

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
  trustScore: number;
  activeJobs: string[];
  disputeHistory: string[];
};

type FlaggedJob = {
  id: string;
  title: string;
  status: string;
  reason: string;
  severity: string;
  reportedAt: string;
  notification?: string | null;
};

type Dispute = {
  id: string;
  jobId: string;
  status: string;
  amount: number;
  thread: string[];
  evidence: string[];
  ruling?: string;
};

type AuditEntry = {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt: string;
};

const token =
  typeof window === "undefined" ? "" : window.localStorage.getItem("access_token") || "";

async function adminApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/admin${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });
  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Admin request failed");
  }
  return payload.data;
}

function StatusBadge({ value }: { value: string }) {
  return <span className={`badge badge-${value.replace("_", "-")}`}>{value}</span>;
}

export default function AdminPanelPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<PageResult<AdminUser> | null>(null);
  const [jobs, setJobs] = useState<PageResult<FlaggedJob> | null>(null);
  const [disputes, setDisputes] = useState<PageResult<Dispute> | null>(null);
  const [audit, setAudit] = useState<PageResult<AuditEntry> | null>(null);
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const needsAuth = useMemo(() => !token, []);

  async function load() {
    if (needsAuth) {
      setError("403: admin access requires a valid admin token.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams();
      if (role) query.set("role", role);
      if (status) query.set("status", status);
      query.set("pageSize", "20");
      const [metricData, userData, jobData, disputeData, auditData] = await Promise.all([
        adminApi<Metrics>("/metrics"),
        adminApi<PageResult<AdminUser>>(`/users?${query.toString()}`),
        adminApi<PageResult<FlaggedJob>>("/moderation/jobs?pageSize=20"),
        adminApi<PageResult<Dispute>>("/disputes?pageSize=20"),
        adminApi<PageResult<AuditEntry>>("/audit-log?pageSize=20")
      ]);
      setMetrics(metricData);
      setUsers(userData);
      setJobs(jobData);
      setDisputes(disputeData);
      setAudit(auditData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  async function updateUser(userId: string, nextStatus: string) {
    await adminApi(`/users/${userId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus })
    });
    await load();
  }

  async function moderateJob(jobId: string, action: string) {
    const reason = action === "reject" ? "Rejected after admin review" : "Reviewed by admin";
    await adminApi(`/moderation/jobs/${jobId}`, {
      method: "POST",
      body: JSON.stringify({ action, reason })
    });
    await load();
  }

  async function ruleDispute(disputeId: string, ruling: string) {
    await adminApi(`/disputes/${disputeId}/ruling`, {
      method: "POST",
      body: JSON.stringify({ ruling, note: "Admin ruling submitted from operations panel" })
    });
    await load();
  }

  async function toggleControl(key: keyof Metrics["controls"], enabled: boolean) {
    const confirmed = window.confirm(`Confirm platform control change: ${key} = ${enabled}`);
    if (!confirmed) return;
    await adminApi(`/controls/${key}`, {
      method: "PATCH",
      body: JSON.stringify({ enabled })
    });
    await load();
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <section className="admin-shell" aria-label="Admin operations panel">
      <div className="admin-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Admin Panel</h1>
        </div>
        <button type="button" onClick={load} disabled={loading} aria-label="Refresh admin data">
          {loading ? "Refreshing" : "Refresh"}
        </button>
      </div>

      {error ? <div className="notice error">{error}</div> : null}
      {loading ? <div className="notice">Loading admin data...</div> : null}

      {metrics ? (
        <div className="metric-grid" aria-label="Trust and platform metrics">
          {[
            ["Total Users", metrics.totalUsers],
            ["Active Jobs", metrics.activeJobs],
            ["Open Disputes", metrics.openDisputes],
            ["Flagged Listings", metrics.flaggedListings],
            ["Revenue", `$${metrics.revenueCurrentPeriod.toLocaleString()}`]
          ].map(([label, value]) => (
            <article className="metric-card" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
          <article className="metric-card">
            <span>Trust Scores</span>
            <strong>
              {metrics.trustScoreDistribution.high}/{metrics.trustScoreDistribution.medium}/
              {metrics.trustScoreDistribution.low}
            </strong>
          </article>
        </div>
      ) : null}

      <div className="admin-section">
        <div className="section-title">
          <h2>User Management</h2>
          <div className="filters">
            <select aria-label="Filter users by role" value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="">All roles</option>
              <option value="client">Clients</option>
              <option value="freelancer">Freelancers</option>
            </select>
            <select aria-label="Filter users by status" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
            <button type="button" onClick={load}>Apply</button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Trust</th>
                <th>Activity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.items.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </td>
                  <td>{user.role}</td>
                  <td><StatusBadge value={user.status} /></td>
                  <td>{user.trustScore}</td>
                  <td>{user.activeJobs.length} jobs, {user.disputeHistory.length} disputes</td>
                  <td>
                    <button type="button" onClick={() => updateUser(user.id, "suspended")}>Suspend</button>
                    <button type="button" onClick={() => updateUser(user.id, "active")}>Reinstate</button>
                    <button type="button" onClick={() => updateUser(user.id, "banned")}>Ban</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-grid">
        <section className="admin-section">
          <h2>Job Moderation</h2>
          {jobs?.items.length ? (
            jobs.items.map((job) => (
              <article className="queue-card" key={job.id}>
                <div>
                  <strong>{job.title}</strong>
                  <p>{job.reason}</p>
                  <StatusBadge value={job.status} />
                </div>
                <div>
                  <button type="button" onClick={() => moderateJob(job.id, "approve")}>Approve</button>
                  <button type="button" onClick={() => moderateJob(job.id, "reject")}>Reject</button>
                  <button type="button" onClick={() => moderateJob(job.id, "escalate")}>Escalate</button>
                </div>
              </article>
            ))
          ) : <p>No flagged listings.</p>}
        </section>

        <section className="admin-section">
          <h2>Dispute Resolution</h2>
          {disputes?.items.length ? (
            disputes.items.map((dispute) => (
              <article className="queue-card" key={dispute.id}>
                <div>
                  <strong>{dispute.id} · ${dispute.amount}</strong>
                  <p>{dispute.thread.join(" ")}</p>
                  <p>Evidence: {dispute.evidence.join(", ")}</p>
                  <StatusBadge value={dispute.status} />
                </div>
                <div>
                  <button type="button" onClick={() => ruleDispute(dispute.id, "client")}>Client</button>
                  <button type="button" onClick={() => ruleDispute(dispute.id, "freelancer")}>Freelancer</button>
                  <button type="button" onClick={() => ruleDispute(dispute.id, "escalate")}>Escalate</button>
                </div>
              </article>
            ))
          ) : <p>No open disputes.</p>}
        </section>
      </div>

      {metrics ? (
        <section className="admin-section">
          <h2>Platform Controls</h2>
          <div className="control-row">
            <span>New registrations</span>
            <button
              type="button"
              aria-label="Toggle new user registrations"
              onClick={() => toggleControl("registrationsEnabled", !metrics.controls.registrationsEnabled)}
            >
              {metrics.controls.registrationsEnabled ? "Enabled" : "Disabled"}
            </button>
          </div>
          <div className="control-row">
            <span>New job postings</span>
            <button
              type="button"
              aria-label="Toggle new job postings"
              onClick={() => toggleControl("jobPostingEnabled", !metrics.controls.jobPostingEnabled)}
            >
              {metrics.controls.jobPostingEnabled ? "Enabled" : "Disabled"}
            </button>
          </div>
        </section>
      ) : null}

      <section className="admin-section">
        <h2>Audit Log</h2>
        {audit?.items.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {audit.items.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.createdAt}</td>
                    <td>{entry.adminId}</td>
                    <td>{entry.action}</td>
                    <td>{entry.targetType}:{entry.targetId}</td>
                    <td>{entry.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p>No audit entries found.</p>}
      </section>
    </section>
  );
}
