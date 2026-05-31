"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const DEFAULT_PAGE_SIZE = 5;

type Paginated<T> = {
  page: number;
  pageSize: number;
  total: number;
  items: T[];
};

type AdminMetrics = {
  totalUsers: number;
  activeJobs: number;
  openDisputes: number;
  flaggedListings: number;
  revenueCurrentPeriod: number;
  trustScoreDistribution: Array<{ label: string; count: number }>;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
  trustScore: number;
  activeJobs: number;
  disputes: number;
  profile: string;
};

type FlaggedJob = {
  id: string;
  title: string;
  clientId: string;
  reason: string;
  risk: string;
  status: string;
  reportedAt: string;
  notification?: string | null;
};

type Dispute = {
  id: string;
  clientId: string;
  freelancerId: string;
  status: string;
  amount: number;
  thread: string[];
  evidence: string[];
  transactionId: string;
  notification?: string;
  ruling?: string;
};

type AuditEntry = {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
  details?: Record<string, unknown>;
};

type AdminResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

class AdminRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const emptyPage = <T,>(): Paginated<T> => ({
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  total: 0,
  items: []
});

async function adminRequest<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(new URL(path, API_BASE_URL), {
    ...options,
    headers
  });
  const payload = await response.json() as AdminResponse<T>;

  if (!response.ok || !payload.success) {
    throw new AdminRequestError(response.status, payload.message ?? "Admin request failed");
  }

  return payload.data;
}

function currency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export default function AdminPanelPage() {
  const [token, setToken] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [users, setUsers] = useState<Paginated<AdminUser>>(emptyPage);
  const [flaggedJobs, setFlaggedJobs] = useState<Paginated<FlaggedJob>>(emptyPage);
  const [disputes, setDisputes] = useState<Paginated<Dispute>>(emptyPage);
  const [controls, setControls] = useState<Record<string, boolean>>({});
  const [auditLog, setAuditLog] = useState<Paginated<AuditEntry>>(emptyPage);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [joinedAfter, setJoinedAfter] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [auditAction, setAuditAction] = useState("");
  const [auditAdmin, setAuditAdmin] = useState("");
  const [auditPage, setAuditPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);

  const trustTotal = useMemo(() => (
    metrics?.trustScoreDistribution.reduce((sum, bucket) => sum + bucket.count, 0) ?? 0
  ), [metrics]);

  const loadDashboard = useCallback(async (adminToken: string, background = false) => {
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    const userQuery = new URLSearchParams({
      page: String(userPage),
      pageSize: String(DEFAULT_PAGE_SIZE)
    });
    if (search) userQuery.set("search", search);
    if (roleFilter !== "all") userQuery.set("role", roleFilter);
    if (statusFilter !== "all") userQuery.set("status", statusFilter);
    if (joinedAfter) userQuery.set("joinedAfter", joinedAfter);

    const auditQuery = new URLSearchParams({
      page: String(auditPage),
      pageSize: String(DEFAULT_PAGE_SIZE)
    });
    if (auditAction) auditQuery.set("action", auditAction);
    if (auditAdmin) auditQuery.set("adminId", auditAdmin);

    try {
      const [
        nextMetrics,
        nextUsers,
        nextFlaggedJobs,
        nextDisputes,
        nextControls,
        nextAuditLog
      ] = await Promise.all([
        adminRequest<AdminMetrics>("/api/admin/metrics", adminToken),
        adminRequest<Paginated<AdminUser>>(`/api/admin/users?${userQuery.toString()}`, adminToken),
        adminRequest<Paginated<FlaggedJob>>(`/api/admin/flagged-jobs?page=1&pageSize=${DEFAULT_PAGE_SIZE}`, adminToken),
        adminRequest<Paginated<Dispute>>(`/api/admin/disputes?page=1&pageSize=${DEFAULT_PAGE_SIZE}`, adminToken),
        adminRequest<Record<string, boolean>>("/api/admin/controls", adminToken),
        adminRequest<Paginated<AuditEntry>>(`/api/admin/audit-log?${auditQuery.toString()}`, adminToken)
      ]);

      setMetrics(nextMetrics);
      setUsers(nextUsers);
      setFlaggedJobs(nextFlaggedJobs);
      setDisputes(nextDisputes);
      setControls(nextControls);
      setAuditLog(nextAuditLog);
      setSelectedUser((current) => {
        if (!current) return nextUsers.items[0] ?? null;
        return nextUsers.items.find((user) => user.id === current.id) ?? nextUsers.items[0] ?? null;
      });
      setForbidden(false);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Admin dashboard failed to load";
      setError(message);
      setForbidden(caught instanceof AdminRequestError && (caught.status === 401 || caught.status === 403));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [auditAction, auditAdmin, auditPage, joinedAfter, roleFilter, search, statusFilter, userPage]);

  useEffect(() => {
    const storedToken = window.localStorage.getItem("adminToken")
      ?? window.localStorage.getItem("accessToken")
      ?? window.localStorage.getItem("token");

    if (!storedToken) {
      setForbidden(true);
      setLoading(false);
      return;
    }

    setToken(storedToken);
  }, []);

  useEffect(() => {
    if (token) {
      void loadDashboard(token);
    }
  }, [loadDashboard, token]);

  async function updateUserStatus(userId: string, status: string) {
    if (!token) return;
    await adminRequest<AdminUser>(`/api/admin/users/${userId}/status`, token, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    await loadDashboard(token, true);
  }

  async function moderateJob(jobId: string, decision: string) {
    if (!token) return;
    const reason = decision === "rejected" ? window.prompt("Rejection reason", "Violates platform policy") : "";
    await adminRequest<FlaggedJob>(`/api/admin/flagged-jobs/${jobId}/moderate`, token, {
      method: "PATCH",
      body: JSON.stringify({ decision, reason })
    });
    await loadDashboard(token, true);
  }

  async function ruleDispute(disputeId: string, ruling: string) {
    if (!token) return;
    await adminRequest<Dispute>(`/api/admin/disputes/${disputeId}/rule`, token, {
      method: "PATCH",
      body: JSON.stringify({ ruling })
    });
    await loadDashboard(token, true);
  }

  async function updateControl(key: string, nextValue: boolean) {
    if (!token) return;
    if (!window.confirm(`Apply platform control change: ${key} ${nextValue ? "enabled" : "disabled"}?`)) return;

    await adminRequest(`/api/admin/controls/${key}`, token, {
      method: "PATCH",
      body: JSON.stringify({ enabled: nextValue })
    });
    await loadDashboard(token, true);
  }

  if (forbidden) {
    return (
      <section className="card state-card" aria-labelledby="admin-forbidden-title">
        <p className="eyebrow">403</p>
        <h2 id="admin-forbidden-title">Admin access required</h2>
        <p>Only authenticated admin sessions can open the operations panel.</p>
      </section>
    );
  }

  return (
    <section className="admin-panel" aria-labelledby="admin-title">
      <div className="admin-header">
        <div>
          <p className="eyebrow">Admin only</p>
          <h2 id="admin-title">Operations Control Panel</h2>
        </div>
        <button type="button" onClick={() => token && loadDashboard(token, true)} disabled={refreshing || loading}>
          {refreshing ? "Refreshing" : "Refresh"}
        </button>
      </div>

      {error ? <p className="error-banner" role="alert">{error}</p> : null}

      <div className="metric-grid" aria-label="Trust and platform metrics">
        {loading && !metrics ? <p className="state-line">Loading metrics...</p> : null}
        {metrics ? (
          <>
            <MetricCard label="Total users" value={String(metrics.totalUsers)} />
            <MetricCard label="Active jobs" value={String(metrics.activeJobs)} />
            <MetricCard label="Open disputes" value={String(metrics.openDisputes)} />
            <MetricCard label="Flagged listings" value={String(metrics.flaggedListings)} />
            <MetricCard label="Revenue" value={currency(metrics.revenueCurrentPeriod)} />
          </>
        ) : null}
      </div>

      <section className="card" aria-labelledby="trust-title">
        <div className="section-heading">
          <h3 id="trust-title">Trust score distribution</h3>
          <span>{trustTotal} users scored</span>
        </div>
        <div className="trust-bars">
          {metrics?.trustScoreDistribution.map((bucket) => {
            const width = trustTotal === 0 ? 0 : Math.round((bucket.count / trustTotal) * 100);
            return (
              <div className="trust-bar" key={bucket.label}>
                <span>{bucket.label}</span>
                <div><strong style={{ width: `${width}%` }} /></div>
                <em>{bucket.count}</em>
              </div>
            );
          })}
        </div>
      </section>

      <div className="admin-grid">
        <section className="card" aria-labelledby="users-title">
          <div className="section-heading">
            <h3 id="users-title">User management</h3>
            <div className="filters">
              <input aria-label="Search users" placeholder="Search users" value={search} onChange={(event) => { setSearch(event.target.value); setUserPage(1); }} />
              <input aria-label="Joined after" type="date" value={joinedAfter} onChange={(event) => { setJoinedAfter(event.target.value); setUserPage(1); }} />
              <select aria-label="Filter users by role" value={roleFilter} onChange={(event) => { setRoleFilter(event.target.value); setUserPage(1); }}>
                <option value="all">All roles</option>
                <option value="client">Clients</option>
                <option value="freelancer">Freelancers</option>
              </select>
              <select aria-label="Filter users by status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setUserPage(1); }}>
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </select>
            </div>
          </div>

          {users.items.length === 0 && !loading ? <p className="state-line">No users match the current filters.</p> : null}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Trust</th>
                  <th>Jobs</th>
                  <th>Disputes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.items.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <button className="link-button" type="button" onClick={() => setSelectedUser(user)}>{user.name}</button>
                      <span>{user.email} / {user.joinedAt}</span>
                    </td>
                    <td>{user.role}</td>
                    <td><span className={`status ${user.status}`}>{user.status}</span></td>
                    <td>{user.trustScore}</td>
                    <td>{user.activeJobs}</td>
                    <td>{user.disputes}</td>
                    <td>
                      <div className="button-row">
                        <button type="button" onClick={() => updateUserStatus(user.id, "suspended")}>Suspend</button>
                        <button type="button" onClick={() => updateUserStatus(user.id, "active")}>Reinstate</button>
                        <button type="button" onClick={() => updateUserStatus(user.id, "banned")}>Ban</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={users.page} pageSize={users.pageSize} total={users.total} onPageChange={setUserPage} />
        </section>

        <section className="card" aria-labelledby="profile-title">
          <h3 id="profile-title">Selected user profile</h3>
          {selectedUser ? (
            <div className="detail-stack">
              <strong>{selectedUser.name}</strong>
              <span>{selectedUser.profile}</span>
              <span>{selectedUser.activeJobs} active jobs / {selectedUser.disputes} dispute records</span>
            </div>
          ) : (
            <p className="state-line">No user selected.</p>
          )}
        </section>
      </div>

      <div className="admin-grid">
        <section className="card" aria-labelledby="moderation-title">
          <h3 id="moderation-title">Flagged listings</h3>
          {flaggedJobs.items.length === 0 && !loading ? <p className="state-line">No flagged listings.</p> : null}
          {flaggedJobs.items.map((job) => (
            <article className="queue-item" key={job.id}>
              <div>
                <strong>{job.title}</strong>
                <span>{job.reason} / {job.risk} risk / {job.status}</span>
                {job.notification ? <span>{job.notification}</span> : null}
              </div>
              <div className="button-row">
                <button type="button" onClick={() => moderateJob(job.id, "approved")}>Approve</button>
                <button type="button" onClick={() => moderateJob(job.id, "rejected")}>Reject</button>
                <button type="button" onClick={() => moderateJob(job.id, "escalated")}>Escalate</button>
              </div>
            </article>
          ))}
        </section>

        <section className="card" aria-labelledby="disputes-title">
          <h3 id="disputes-title">Dispute resolution</h3>
          {disputes.items.length === 0 && !loading ? <p className="state-line">No open disputes.</p> : null}
          {disputes.items.map((dispute) => (
            <article className="queue-item" key={dispute.id}>
              <div>
                <strong>{dispute.clientId} / {dispute.freelancerId}</strong>
                <span>{currency(dispute.amount)} / {dispute.status} / {dispute.transactionId}</span>
                <span>{dispute.thread.join(" ")}</span>
                <span>Evidence: {dispute.evidence.join(", ")}</span>
                {dispute.notification ? <span>{dispute.notification}</span> : null}
              </div>
              <div className="button-row">
                <button type="button" onClick={() => ruleDispute(dispute.id, "client")}>Client</button>
                <button type="button" onClick={() => ruleDispute(dispute.id, "freelancer")}>Freelancer</button>
                <button type="button" onClick={() => ruleDispute(dispute.id, "refund")}>Refund</button>
                <button type="button" onClick={() => ruleDispute(dispute.id, "escalated")}>Escalate</button>
              </div>
            </article>
          ))}
        </section>
      </div>

      <div className="admin-grid">
        <section className="card" aria-labelledby="controls-title">
          <h3 id="controls-title">Platform controls</h3>
          {Object.entries(controls).map(([key, enabled]) => (
            <div className="control-row" key={key}>
              <span>{key}</span>
              <button type="button" onClick={() => updateControl(key, !enabled)}>
                {enabled ? "Enabled" : "Disabled"}
              </button>
            </div>
          ))}
        </section>

        <section className="card" aria-labelledby="audit-title">
          <div className="section-heading">
            <h3 id="audit-title">Audit log</h3>
            <div className="filters">
              <input aria-label="Filter audit by admin" placeholder="Admin ID" value={auditAdmin} onChange={(event) => { setAuditAdmin(event.target.value); setAuditPage(1); }} />
              <input aria-label="Filter audit by action" placeholder="Action" value={auditAction} onChange={(event) => { setAuditAction(event.target.value); setAuditPage(1); }} />
            </div>
          </div>
          {auditLog.items.length === 0 && !loading ? <p className="state-line">No audit entries match the current filters.</p> : null}
          <ol className="audit-log">
            {auditLog.items.map((entry) => (
              <li key={entry.id}>
                <strong>{entry.action}</strong>
                <span>{entry.adminId} / {entry.targetType}:{entry.targetId} / {new Date(entry.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ol>
          <Pagination page={auditLog.page} pageSize={auditLog.pageSize} total={auditLog.total} onPageChange={setAuditPage} />
        </section>
      </div>
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

function Pagination({ page, pageSize, total, onPageChange }: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <div className="pagination" aria-label="Pagination">
      <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</button>
      <span>Page {page} of {totalPages}</span>
      <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</button>
    </div>
  );
}
