"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type Metrics = {
  totalUsers: number;
  activeJobs: number;
  openDisputes: number;
  flaggedListings: number;
  revenueCurrentPeriod: number;
  refreshedAt: string;
  trustScoreDistribution: Array<{ label: string; count: number }>;
};

type User = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  trustScore: number;
  createdAt: string;
  activeJobs?: Job[];
  disputeHistory?: Dispute[];
};

type Job = {
  id: string;
  title: string;
  clientName: string;
  clientId: string;
  status: string;
  moderationStatus: string;
  flagReason: string | null;
  reportCount: number;
  budget: number;
  createdAt: string;
};

type Dispute = {
  id: string;
  jobTitle: string;
  clientName: string;
  freelancerName: string;
  amount: number;
  status: string;
  evidence: string[];
  thread: Array<{ author: string; body: string; createdAt: string }>;
  transaction: { paymentId: string; escrowStatus: string; currency: string };
  ruling: null | { ruling: string; note?: string; adminId: string; ruledAt: string };
};

type Control = {
  key: string;
  label: string;
  enabled: boolean;
  updatedAt: string;
  updatedBy: string;
};

type AuditEntry = {
  id: string;
  adminId: string;
  actionType: string;
  targetType: string;
  targetId: string;
  message: string;
  createdAt: string;
};

type Paged<T> = {
  items: T[];
  pagination: Pagination;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
};

const userStatuses = ["ACTIVE", "SUSPENDED", "BANNED"];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

function StatusBadge({ value }: { value: string }) {
  return <span className={`admin-badge admin-badge-${value.toLowerCase()}`}>{value.replaceAll("_", " ")}</span>;
}

export function AdminPanelClient({ apiBaseUrl }: { apiBaseUrl: string }) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<Paged<User> | null>(null);
  const [jobs, setJobs] = useState<Paged<Job> | null>(null);
  const [disputes, setDisputes] = useState<Paged<Dispute> | null>(null);
  const [controls, setControls] = useState<Control[]>([]);
  const [audit, setAudit] = useState<Paged<AuditEntry> | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userFilters, setUserFilters] = useState({ search: "", role: "", status: "", joinedFrom: "", joinedTo: "", page: 1 });
  const [auditFilters, setAuditFilters] = useState({ adminId: "", actionType: "", from: "", to: "" });

  const request = useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<T> => {
      const response = await fetch(`${apiBaseUrl}${path}`, {
        ...init,
        headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }
      });
      const payload = (await response.json()) as ApiEnvelope<T>;

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Admin request failed");
      }

      return payload.data;
    },
    [apiBaseUrl]
  );

  const loadPanel = useCallback(async () => {
    setRefreshing(true);
    setError("");

    try {
      const [nextMetrics, nextUsers, nextJobs, nextDisputes, nextControls, nextAudit] = await Promise.all([
        request<Metrics>("/admin/metrics"),
        request<Paged<User>>(`/admin/users${buildQuery({ ...userFilters, pageSize: 5 })}`),
        request<Paged<Job>>("/admin/moderation/jobs?pageSize=5"),
        request<Paged<Dispute>>("/admin/disputes?pageSize=5"),
        request<{ controls: Control[] }>("/admin/controls"),
        request<Paged<AuditEntry>>(`/admin/audit-log${buildQuery({ ...auditFilters, pageSize: 8 })}`)
      ]);

      setMetrics(nextMetrics);
      setUsers(nextUsers);
      setJobs(nextJobs);
      setDisputes(nextDisputes);
      setControls(nextControls.controls);
      setAudit(nextAudit);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load admin panel");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [auditFilters, request, userFilters]);

  useEffect(() => {
    void loadPanel();
  }, [loadPanel]);

  async function handleUserStatus(user: User, status: string) {
    const confirmed = window.confirm(`Change ${user.fullName}'s status to ${status}?`);
    if (!confirmed) return;

    await request<User>(`/admin/users/${user.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    await loadPanel();
  }

  async function handleModeration(job: Job, action: "approve" | "reject" | "escalate") {
    const reason =
      action === "reject"
        ? window.prompt("Reason sent to the posting user:")
        : window.prompt("Moderation note:");
    if (reason === null) return;

    await request<Job>(`/admin/moderation/jobs/${job.id}`, {
      method: "POST",
      body: JSON.stringify({ action, reason })
    });
    await loadPanel();
  }

  async function handleDispute(dispute: Dispute, ruling: "client" | "freelancer" | "refund" | "escalate") {
    const note = window.prompt(`Record ruling "${ruling}" for ${dispute.id}:`);
    if (note === null) return;

    await request<Dispute>(`/admin/disputes/${dispute.id}/ruling`, {
      method: "POST",
      body: JSON.stringify({ ruling, note })
    });
    await loadPanel();
  }

  async function handleControl(control: Control) {
    const nextValue = !control.enabled;
    const confirmed = window.confirm(
      `${nextValue ? "Enable" : "Disable"} ${control.label}? This action will be logged.`
    );
    if (!confirmed) return;

    await request<Control>(`/admin/controls/${control.key}`, {
      method: "PATCH",
      body: JSON.stringify({ enabled: nextValue })
    });
    await loadPanel();
  }

  async function handleUserSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUserFilters((current) => ({ ...current, page: 1 }));
  }

  async function viewProfile(user: User) {
    setSelectedUser(await request<User>(`/admin/users/${user.id}`));
  }

  const emptyState = !loading && !error;

  return (
    <section className="admin-shell" aria-labelledby="admin-panel-title">
      <div className="admin-header">
        <div>
          <p className="admin-eyebrow">Operations</p>
          <h2 id="admin-panel-title">Admin Panel</h2>
        </div>
        <button className="admin-button" disabled={refreshing} onClick={() => void loadPanel()} type="button">
          {refreshing ? "Refreshing" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="admin-status admin-status-error" role="alert">
          <strong>Unable to load admin data</strong>
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="admin-status" role="status">
          <strong>Loading admin workspace</strong>
          <span>Fetching metrics, moderation queues, controls, and audit entries.</span>
        </div>
      )}

      {metrics && (
        <div className="admin-metrics" aria-label="Trust and platform metrics">
          {[
            ["Total users", metrics.totalUsers],
            ["Active jobs", metrics.activeJobs],
            ["Open disputes", metrics.openDisputes],
            ["Flagged listings", metrics.flaggedListings],
            ["Current revenue", formatCurrency(metrics.revenueCurrentPeriod)]
          ].map(([label, value]) => (
            <article className="admin-card" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
          <article className="admin-card admin-chart">
            <span>Trust score distribution</span>
            <div className="admin-bars" aria-label="Trust score distribution chart">
              {metrics.trustScoreDistribution.map((item) => (
                <div className="admin-bar-row" key={item.label}>
                  <span>{item.label}</span>
                  <div>
                    <i style={{ width: `${Math.max(item.count * 24, 8)}px` }} />
                  </div>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
          </article>
        </div>
      )}

      <div className="admin-section">
        <div className="admin-section-title">
          <h3>User Management</h3>
          {users && <span>{users.pagination.total} users</span>}
        </div>
        <form className="admin-filter-grid" onSubmit={(event) => void handleUserSearch(event)}>
          <label>
            Search
            <input
              aria-label="Search users"
              onChange={(event) => setUserFilters((current) => ({ ...current, search: event.target.value }))}
              value={userFilters.search}
            />
          </label>
          <label>
            Role
            <select
              aria-label="Filter users by role"
              onChange={(event) => setUserFilters((current) => ({ ...current, role: event.target.value }))}
              value={userFilters.role}
            >
              <option value="">All roles</option>
              <option value="CLIENT">Client</option>
              <option value="FREELANCER">Freelancer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
          <label>
            Status
            <select
              aria-label="Filter users by status"
              onChange={(event) => setUserFilters((current) => ({ ...current, status: event.target.value }))}
              value={userFilters.status}
            >
              <option value="">All statuses</option>
              {userStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label>
            Joined from
            <input
              aria-label="Filter users joined from"
              onChange={(event) => setUserFilters((current) => ({ ...current, joinedFrom: event.target.value }))}
              type="date"
              value={userFilters.joinedFrom}
            />
          </label>
          <label>
            Joined to
            <input
              aria-label="Filter users joined to"
              onChange={(event) => setUserFilters((current) => ({ ...current, joinedTo: event.target.value }))}
              type="date"
              value={userFilters.joinedTo}
            />
          </label>
          <button className="admin-button" type="submit">
            Apply
          </button>
        </form>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Trust</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.items.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.fullName}</strong>
                    <span>{user.email}</span>
                  </td>
                  <td>{user.role}</td>
                  <td>
                    <StatusBadge value={user.status} />
                  </td>
                  <td>{user.trustScore}</td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <div className="admin-actions">
                      <button type="button" onClick={() => void viewProfile(user)}>
                        View
                      </button>
                      {userStatuses.map((status) => (
                        <button
                          disabled={status === user.status}
                          key={status}
                          onClick={() => void handleUserStatus(user, status)}
                          type="button"
                        >
                          {status === "ACTIVE" ? "Reinstate" : status[0] + status.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {emptyState && users?.items.length === 0 && (
                <tr>
                  <td colSpan={6}>No users match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {users && (
          <div className="admin-pagination">
            <button
              disabled={users.pagination.page <= 1}
              onClick={() => setUserFilters((current) => ({ ...current, page: current.page - 1 }))}
              type="button"
            >
              Previous
            </button>
            <span>
              Page {users.pagination.page} of {users.pagination.totalPages}
            </span>
            <button
              disabled={users.pagination.page >= users.pagination.totalPages}
              onClick={() => setUserFilters((current) => ({ ...current, page: current.page + 1 }))}
              type="button"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {selectedUser && (
        <aside className="admin-section" aria-label="Selected user profile">
          <div className="admin-section-title">
            <h3>{selectedUser.fullName}</h3>
            <button onClick={() => setSelectedUser(null)} type="button">
              Close
            </button>
          </div>
          <div className="admin-detail-grid">
            <div>
              <strong>Active jobs</strong>
              {selectedUser.activeJobs?.length ? (
                selectedUser.activeJobs.map((job) => <p key={job.id}>{job.title}</p>)
              ) : (
                <p>No active jobs.</p>
              )}
            </div>
            <div>
              <strong>Dispute history</strong>
              {selectedUser.disputeHistory?.length ? (
                selectedUser.disputeHistory.map((dispute) => (
                  <p key={dispute.id}>
                    {dispute.id}: {dispute.status}
                  </p>
                ))
              ) : (
                <p>No dispute history.</p>
              )}
            </div>
          </div>
        </aside>
      )}

      <div className="admin-section">
        <div className="admin-section-title">
          <h3>Job & Listing Moderation</h3>
          {jobs && <span>{jobs.pagination.total} flagged listings</span>}
        </div>
        <div className="admin-list">
          {jobs?.items.map((job) => (
            <article className="admin-row-card" key={job.id}>
              <div>
                <strong>{job.title}</strong>
                <span>
                  {job.clientName} - {job.reportCount} reports - {formatCurrency(job.budget)}
                </span>
                <p>{job.flagReason}</p>
              </div>
              <StatusBadge value={job.moderationStatus} />
              <div className="admin-actions">
                <button onClick={() => void handleModeration(job, "approve")} type="button">
                  Approve
                </button>
                <button onClick={() => void handleModeration(job, "reject")} type="button">
                  Reject
                </button>
                <button onClick={() => void handleModeration(job, "escalate")} type="button">
                  Escalate
                </button>
              </div>
            </article>
          ))}
          {emptyState && jobs?.items.length === 0 && <p>No listings are waiting for moderation.</p>}
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">
          <h3>Dispute Resolution</h3>
          {disputes && <span>{disputes.pagination.total} disputes</span>}
        </div>
        <div className="admin-list">
          {disputes?.items.map((dispute) => (
            <article className="admin-row-card" key={dispute.id}>
              <div>
                <strong>{dispute.jobTitle}</strong>
                <span>
                  {dispute.clientName} vs {dispute.freelancerName} - {formatCurrency(dispute.amount)}
                </span>
                <p>
                  Evidence: {dispute.evidence.join(", ")}. Transaction {dispute.transaction.paymentId} is{" "}
                  {dispute.transaction.escrowStatus}.
                </p>
                {dispute.thread.map((message) => (
                  <blockquote key={`${dispute.id}-${message.createdAt}`}>
                    {message.author}: {message.body}
                  </blockquote>
                ))}
              </div>
              <StatusBadge value={dispute.status} />
              <div className="admin-actions">
                <button onClick={() => void handleDispute(dispute, "client")} type="button">
                  Client
                </button>
                <button onClick={() => void handleDispute(dispute, "freelancer")} type="button">
                  Freelancer
                </button>
                <button onClick={() => void handleDispute(dispute, "refund")} type="button">
                  Refund
                </button>
                <button onClick={() => void handleDispute(dispute, "escalate")} type="button">
                  Escalate
                </button>
              </div>
            </article>
          ))}
          {emptyState && disputes?.items.length === 0 && <p>No disputes match the current filter.</p>}
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">
          <h3>Platform Controls</h3>
        </div>
        <div className="admin-controls">
          {controls.map((control) => (
            <label className="admin-toggle" key={control.key}>
              <span>
                <strong>{control.label}</strong>
                <small>
                  Updated by {control.updatedBy} on {formatDate(control.updatedAt)}
                </small>
              </span>
              <input
                aria-label={`Toggle ${control.label}`}
                checked={control.enabled}
                onChange={() => void handleControl(control)}
                type="checkbox"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">
          <h3>Audit Log</h3>
          {audit && <span>{audit.pagination.total} entries</span>}
        </div>
        <form className="admin-filter-grid" onSubmit={(event) => event.preventDefault()}>
          <label>
            Admin ID
            <input
              aria-label="Filter audit log by admin"
              onChange={(event) => setAuditFilters((current) => ({ ...current, adminId: event.target.value }))}
              value={auditFilters.adminId}
            />
          </label>
          <label>
            Action
            <input
              aria-label="Filter audit log by action type"
              onChange={(event) => setAuditFilters((current) => ({ ...current, actionType: event.target.value }))}
              value={auditFilters.actionType}
            />
          </label>
          <label>
            From
            <input
              aria-label="Filter audit log from date"
              onChange={(event) => setAuditFilters((current) => ({ ...current, from: event.target.value }))}
              type="date"
              value={auditFilters.from}
            />
          </label>
          <label>
            To
            <input
              aria-label="Filter audit log to date"
              onChange={(event) => setAuditFilters((current) => ({ ...current, to: event.target.value }))}
              type="date"
              value={auditFilters.to}
            />
          </label>
        </form>
        <div className="admin-list">
          {audit?.items.map((entry) => (
            <article className="admin-audit-entry" key={entry.id}>
              <strong>{entry.actionType}</strong>
              <span>
                {entry.adminId} - {entry.targetType}:{entry.targetId} - {formatDate(entry.createdAt)}
              </span>
              <p>{entry.message}</p>
            </article>
          ))}
          {emptyState && audit?.items.length === 0 && <p>No audit entries match the current filters.</p>}
        </div>
      </div>
    </section>
  );
}
