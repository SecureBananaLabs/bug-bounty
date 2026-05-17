"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const PAGE_SIZE = 5;

type PageResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type AdminOverview = {
  totalUsers: number;
  activeJobs: number;
  openDisputes: number;
  flaggedListings: number;
  revenueCurrentPeriod: number;
  trustDistribution: { label: string; count: number }[];
  controls: PlatformControl[];
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
  trustScore: number;
};

type JobSummary = {
  id: string;
  title: string;
  status: string;
  budget: number;
};

type UserProfile = AdminUser & {
  activeJobs: JobSummary[];
  disputeHistory: Dispute[];
};

type ModerationItem = {
  id: string;
  jobId: string;
  title: string;
  reason: string;
  status: string;
  severity: string;
  reportedAt: string;
};

type Dispute = {
  id: string;
  jobId: string;
  status: string;
  amount: number;
  transactionId: string;
  openedAt: string;
};

type DisputeDetails = Dispute & {
  client: AdminUser;
  freelancer: AdminUser;
  job?: JobSummary;
  thread: { authorId: string; message: string; createdAt: string }[];
  evidence: { type: string; label: string; value: string }[];
};

type PlatformControl = {
  key: string;
  label: string;
  enabled: boolean;
  updatedAt: string;
  updatedBy: string;
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

type RefreshOptions = Partial<{
  usersPage: number;
  moderationPage: number;
  disputesPage: number;
  auditPage: number;
}>;

const tabs = ["Users", "Moderation", "Disputes", "Audit"];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function statusClass(status: string) {
  return `status status-${status.replace(/_/g, "-")}`;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function AdminPanelPage() {
  const [token, setToken] = useState("");
  const [activeTab, setActiveTab] = useState("Users");
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<PageResult<AdminUser> | null>(null);
  const [moderation, setModeration] = useState<PageResult<ModerationItem> | null>(null);
  const [disputes, setDisputes] = useState<PageResult<Dispute> | null>(null);
  const [audit, setAudit] = useState<PageResult<AuditEntry> | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<DisputeDetails | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userStatus, setUserStatus] = useState("");
  const [joinedAfter, setJoinedAfter] = useState("");
  const [joinedBefore, setJoinedBefore] = useState("");
  const [auditAdmin, setAuditAdmin] = useState("");
  const [auditAction, setAuditAction] = useState("");
  const [auditFrom, setAuditFrom] = useState("");
  const [auditTo, setAuditTo] = useState("");
  const [usersPage, setUsersPage] = useState(1);
  const [moderationPage, setModerationPage] = useState(1);
  const [disputesPage, setDisputesPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const headers = useMemo(
    () => ({
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    }),
    [token]
  );

  useEffect(() => {
    const savedToken = window.localStorage.getItem("adminToken") ?? "";
    setToken(savedToken);
  }, []);

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        ...headers,
        ...(init.headers ?? {})
      }
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.message ?? "Admin request failed");
    }
    return payload.data;
  }

  async function refresh(options: RefreshOptions = {}) {
    if (!token) {
      setMessage("Admin API token required.");
      return;
    }

    const nextUsersPage = options.usersPage ?? usersPage;
    const nextModerationPage = options.moderationPage ?? moderationPage;
    const nextDisputesPage = options.disputesPage ?? disputesPage;
    const nextAuditPage = options.auditPage ?? auditPage;

    setLoading(true);
    setMessage("");

    try {
      const userQuery = new URLSearchParams({ page: String(nextUsersPage), pageSize: String(PAGE_SIZE) });
      if (userSearch) userQuery.set("search", userSearch);
      if (userRole) userQuery.set("role", userRole);
      if (userStatus) userQuery.set("status", userStatus);
      if (joinedAfter) userQuery.set("joinedAfter", joinedAfter);
      if (joinedBefore) userQuery.set("joinedBefore", joinedBefore);

      const auditQuery = new URLSearchParams({ page: String(nextAuditPage), pageSize: String(PAGE_SIZE) });
      if (auditAdmin) auditQuery.set("adminId", auditAdmin);
      if (auditAction) auditQuery.set("action", auditAction);
      if (auditFrom) auditQuery.set("from", auditFrom);
      if (auditTo) auditQuery.set("to", auditTo);

      const [overviewData, usersData, moderationData, disputesData, auditData] = await Promise.all([
        request<AdminOverview>("/api/admin/overview"),
        request<PageResult<AdminUser>>(`/api/admin/users?${userQuery.toString()}`),
        request<PageResult<ModerationItem>>(
          `/api/admin/moderation?page=${nextModerationPage}&pageSize=${PAGE_SIZE}&status=pending`
        ),
        request<PageResult<Dispute>>(`/api/admin/disputes?page=${nextDisputesPage}&pageSize=${PAGE_SIZE}`),
        request<PageResult<AuditEntry>>(`/api/admin/audit?${auditQuery.toString()}`)
      ]);

      setOverview(overviewData);
      setUsers(usersData);
      setModeration(moderationData);
      setDisputes(disputesData);
      setAudit(auditData);
      setUsersPage(nextUsersPage);
      setModerationPage(nextModerationPage);
      setDisputesPage(nextDisputesPage);
      setAuditPage(nextAuditPage);
      setMessage("Admin data refreshed.");
    } catch (error) {
      setMessage(errorMessage(error, "Unable to load admin data."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      refresh();
    }
  }, [token]);

  function saveToken() {
    window.localStorage.setItem("adminToken", token);
    document.cookie = `ff_access_token=${token}; path=/; SameSite=Lax`;
    setMessage("Admin token saved.");
  }

  async function updateUserStatus(userId: string, status: string) {
    try {
      await request(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, reason: "Admin panel action" })
      });
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
      }
      await refresh();
    } catch (error) {
      setMessage(errorMessage(error, "Unable to update user."));
    }
  }

  async function decideModeration(itemId: string, decision: string) {
    try {
      await request(`/api/admin/moderation/${itemId}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision, reason: "Reviewed from admin panel" })
      });
      await refresh();
    } catch (error) {
      setMessage(errorMessage(error, "Unable to update moderation item."));
    }
  }

  async function ruleDispute(disputeId: string, ruling: string) {
    try {
      await request(`/api/admin/disputes/${disputeId}/ruling`, {
        method: "POST",
        body: JSON.stringify({ ruling, reason: "Reviewed from admin panel" })
      });
      if (selectedDispute?.id === disputeId) {
        await viewDispute(disputeId);
      }
      await refresh();
    } catch (error) {
      setMessage(errorMessage(error, "Unable to rule on dispute."));
    }
  }

  async function toggleControl(control: PlatformControl) {
    const confirmed = window.confirm(`Confirm ${control.enabled ? "disabling" : "enabling"} ${control.label}?`);
    if (!confirmed) return;

    try {
      await request(`/api/admin/controls/${control.key}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled: !control.enabled, confirmed: true })
      });
      await refresh();
    } catch (error) {
      setMessage(errorMessage(error, "Unable to update platform control."));
    }
  }

  async function viewUser(userId: string) {
    try {
      const profile = await request<UserProfile>(`/api/admin/users/${userId}`);
      setSelectedUser(profile);
      setActiveTab("Users");
      setMessage(`Loaded ${profile.name}.`);
    } catch (error) {
      setMessage(errorMessage(error, "Unable to load user profile."));
    }
  }

  async function viewDispute(disputeId: string) {
    try {
      const details = await request<DisputeDetails>(`/api/admin/disputes/${disputeId}`);
      setSelectedDispute(details);
      setActiveTab("Disputes");
      setMessage(`Loaded dispute ${details.id}.`);
    } catch (error) {
      setMessage(errorMessage(error, "Unable to load dispute details."));
    }
  }

  return (
    <section className="admin-shell">
      <div className="admin-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h2>Admin Panel</h2>
        </div>
        <button type="button" onClick={() => refresh()} disabled={loading} aria-label="Refresh admin data">
          {loading ? "Refreshing" : "Refresh"}
        </button>
      </div>

      <div className="admin-auth">
        <label htmlFor="admin-token">Admin API token</label>
        <input
          id="admin-token"
          type="password"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Bearer token value"
        />
        <button type="button" onClick={saveToken}>
          Save
        </button>
      </div>

      {message ? (
        <p className={message.includes("Unable") || message.includes("required") || message.includes("failed") ? "alert alert-error" : "alert"}>
          {message}
        </p>
      ) : null}

      {overview ? (
        <>
          <div className="metric-grid">
            <Metric label="Total users" value={overview.totalUsers.toLocaleString()} />
            <Metric label="Active jobs" value={overview.activeJobs.toLocaleString()} />
            <Metric label="Open disputes" value={overview.openDisputes.toLocaleString()} />
            <Metric label="Flagged listings" value={overview.flaggedListings.toLocaleString()} />
            <Metric label="Revenue" value={`$${overview.revenueCurrentPeriod.toLocaleString()}`} />
          </div>

          <div className="admin-layout">
            <section className="panel">
              <div className="panel-title">
                <h3>Trust distribution</h3>
              </div>
              <div className="trust-chart" aria-label="Trust score distribution chart">
                {overview.trustDistribution.map((bucket) => (
                  <div key={bucket.label} className="trust-row">
                    <span>{bucket.label}</span>
                    <div>
                      <i style={{ width: `${Math.max(8, bucket.count * 24)}%` }} />
                    </div>
                    <strong>{bucket.count}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="panel-title">
                <h3>Platform controls</h3>
              </div>
              <div className="control-list">
                {overview.controls.map((control) => (
                  <div className="control-row" key={control.key}>
                    <div>
                      <strong>{control.label}</strong>
                      <span>
                        {control.enabled ? "Enabled" : "Disabled"} by {control.updatedBy} at {formatDate(control.updatedAt)}
                      </span>
                    </div>
                    <button type="button" onClick={() => toggleControl(control)} aria-label={`Toggle ${control.label}`}>
                      {control.enabled ? "Disable" : "Enable"}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="tabs" role="tablist" aria-label="Admin sections">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                className={activeTab === tab ? "active" : ""}
                onClick={() => setActiveTab(tab)}
                role="tab"
                aria-selected={activeTab === tab}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "Users" ? (
            <section className="panel">
              <div className="panel-title">
                <h3>User management</h3>
                <div className="filters">
                  <input
                    value={userSearch}
                    onChange={(event) => setUserSearch(event.target.value)}
                    placeholder="Search users"
                    aria-label="Search users"
                  />
                  <select value={userRole} onChange={(event) => setUserRole(event.target.value)} aria-label="Filter users by role">
                    <option value="">All roles</option>
                    <option value="client">Client</option>
                    <option value="freelancer">Freelancer</option>
                    <option value="admin">Admin</option>
                  </select>
                  <select value={userStatus} onChange={(event) => setUserStatus(event.target.value)} aria-label="Filter users by status">
                    <option value="">All statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="banned">Banned</option>
                  </select>
                  <input
                    type="date"
                    value={joinedAfter}
                    onChange={(event) => setJoinedAfter(event.target.value)}
                    aria-label="Joined after"
                  />
                  <input
                    type="date"
                    value={joinedBefore}
                    onChange={(event) => setJoinedBefore(event.target.value)}
                    aria-label="Joined before"
                  />
                  <button type="button" onClick={() => refresh({ usersPage: 1 })}>
                    Apply
                  </button>
                </div>
              </div>
              <DataTable
                emptyLabel="No users match the current filters."
                headers={["User", "Role", "Status", "Trust", "Joined", "Actions"]}
                rows={(users?.items ?? []).map((user) => [
                  <span key="user">
                    <strong>{user.name}</strong>
                    <small>{user.email}</small>
                  </span>,
                  user.role,
                  <span key="status" className={statusClass(user.status)}>
                    {user.status}
                  </span>,
                  user.trustScore,
                  formatDate(user.joinedAt),
                  <div className="row-actions" key="actions">
                    <button type="button" onClick={() => viewUser(user.id)}>
                      View
                    </button>
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
                ])}
              />
              <Pagination result={users} onPageChange={(page) => refresh({ usersPage: page })} />
              {selectedUser ? <UserDetails user={selectedUser} /> : null}
            </section>
          ) : null}

          {activeTab === "Moderation" ? (
            <section className="panel">
              <div className="panel-title">
                <h3>Listing moderation</h3>
              </div>
              <DataTable
                emptyLabel="No pending moderation items."
                headers={["Listing", "Reason", "Severity", "Reported", "Actions"]}
                rows={(moderation?.items ?? []).map((item) => [
                  <span key="listing">
                    <strong>{item.title}</strong>
                    <small>{item.jobId}</small>
                  </span>,
                  item.reason,
                  <span key="severity" className={statusClass(item.severity)}>
                    {item.severity}
                  </span>,
                  formatDate(item.reportedAt),
                  <div className="row-actions" key="actions">
                    <button type="button" onClick={() => decideModeration(item.id, "approve")}>
                      Approve
                    </button>
                    <button type="button" onClick={() => decideModeration(item.id, "reject")}>
                      Reject
                    </button>
                    <button type="button" onClick={() => decideModeration(item.id, "escalate")}>
                      Escalate
                    </button>
                  </div>
                ])}
              />
              <Pagination result={moderation} onPageChange={(page) => refresh({ moderationPage: page })} />
            </section>
          ) : null}

          {activeTab === "Disputes" ? (
            <section className="panel">
              <div className="panel-title">
                <h3>Dispute resolution</h3>
              </div>
              <DataTable
                emptyLabel="No disputes to review."
                headers={["Dispute", "Status", "Transaction", "Opened", "Actions"]}
                rows={(disputes?.items ?? []).map((dispute) => [
                  <span key="dispute">
                    <strong>{dispute.id}</strong>
                    <small>
                      {dispute.jobId} / ${dispute.amount}
                    </small>
                  </span>,
                  <span key="status" className={statusClass(dispute.status)}>
                    {dispute.status}
                  </span>,
                  dispute.transactionId,
                  formatDate(dispute.openedAt),
                  <div className="row-actions" key="actions">
                    <button type="button" onClick={() => viewDispute(dispute.id)}>
                      View
                    </button>
                    <button type="button" onClick={() => ruleDispute(dispute.id, "client")}>
                      Client
                    </button>
                    <button type="button" onClick={() => ruleDispute(dispute.id, "freelancer")}>
                      Freelancer
                    </button>
                    <button type="button" onClick={() => ruleDispute(dispute.id, "refund")}>
                      Refund
                    </button>
                    <button type="button" onClick={() => ruleDispute(dispute.id, "escalate")}>
                      Escalate
                    </button>
                  </div>
                ])}
              />
              <Pagination result={disputes} onPageChange={(page) => refresh({ disputesPage: page })} />
              {selectedDispute ? <DisputeDetailsPanel dispute={selectedDispute} /> : null}
            </section>
          ) : null}

          {activeTab === "Audit" ? (
            <section className="panel">
              <div className="panel-title">
                <h3>Audit log</h3>
                <div className="filters">
                  <input
                    value={auditAdmin}
                    onChange={(event) => setAuditAdmin(event.target.value)}
                    placeholder="Admin ID"
                    aria-label="Filter audit by admin ID"
                  />
                  <input
                    value={auditAction}
                    onChange={(event) => setAuditAction(event.target.value)}
                    placeholder="Action prefix"
                    aria-label="Filter audit by action"
                  />
                  <input type="date" value={auditFrom} onChange={(event) => setAuditFrom(event.target.value)} aria-label="Audit from date" />
                  <input type="date" value={auditTo} onChange={(event) => setAuditTo(event.target.value)} aria-label="Audit to date" />
                  <button type="button" onClick={() => refresh({ auditPage: 1 })}>
                    Apply
                  </button>
                </div>
              </div>
              <DataTable
                emptyLabel="No audit entries found."
                headers={["Action", "Target", "Admin", "Details", "Time"]}
                rows={(audit?.items ?? []).map((entry) => [
                  entry.action,
                  `${entry.targetType}:${entry.targetId}`,
                  entry.adminId,
                  entry.details,
                  formatDate(entry.createdAt)
                ])}
              />
              <Pagination result={audit} onPageChange={(page) => refresh({ auditPage: page })} />
            </section>
          ) : null}
        </>
      ) : (
        <section className="panel empty-state">
          <h3>Admin data is locked</h3>
          <p>Save an admin token and refresh to load the dashboard.</p>
        </section>
      )}
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

function Pagination<T>({ result, onPageChange }: { result: PageResult<T> | null; onPageChange: (page: number) => void }) {
  if (!result) return null;

  return (
    <div className="pagination" aria-label="Table pagination">
      <span>
        Page {result.page} of {result.totalPages} ({result.total} total)
      </span>
      <div>
        <button type="button" onClick={() => onPageChange(result.page - 1)} disabled={result.page <= 1}>
          Previous
        </button>
        <button type="button" onClick={() => onPageChange(result.page + 1)} disabled={result.page >= result.totalPages}>
          Next
        </button>
      </div>
    </div>
  );
}

function UserDetails({ user }: { user: UserProfile }) {
  return (
    <section className="detail-panel" aria-label="Selected user profile">
      <div className="panel-title">
        <h3>{user.name}</h3>
        <span className={statusClass(user.status)}>{user.status}</span>
      </div>
      <div className="detail-grid">
        <Detail label="Email" value={user.email} />
        <Detail label="Role" value={user.role} />
        <Detail label="Trust score" value={String(user.trustScore)} />
        <Detail label="Joined" value={formatDate(user.joinedAt)} />
      </div>
      <div className="detail-columns">
        <div>
          <h4>Active jobs</h4>
          <DetailList
            emptyLabel="No active jobs."
            items={user.activeJobs.map((job) => `${job.title} (${job.status}, $${job.budget})`)}
          />
        </div>
        <div>
          <h4>Dispute history</h4>
          <DetailList
            emptyLabel="No disputes."
            items={user.disputeHistory.map((dispute) => `${dispute.id}: ${dispute.status} / $${dispute.amount}`)}
          />
        </div>
      </div>
    </section>
  );
}

function DisputeDetailsPanel({ dispute }: { dispute: DisputeDetails }) {
  return (
    <section className="detail-panel" aria-label="Selected dispute details">
      <div className="panel-title">
        <h3>{dispute.id}</h3>
        <span className={statusClass(dispute.status)}>{dispute.status}</span>
      </div>
      <div className="detail-grid">
        <Detail label="Client" value={`${dispute.client.name} (${dispute.client.email})`} />
        <Detail label="Freelancer" value={`${dispute.freelancer.name} (${dispute.freelancer.email})`} />
        <Detail label="Transaction" value={dispute.transactionId} />
        <Detail label="Amount" value={`$${dispute.amount}`} />
        <Detail label="Job" value={dispute.job?.title ?? dispute.jobId} />
        <Detail label="Opened" value={formatDate(dispute.openedAt)} />
      </div>
      <div className="detail-columns">
        <div>
          <h4>Thread</h4>
          <DetailList
            emptyLabel="No thread messages."
            items={dispute.thread.map((message) => `${formatDate(message.createdAt)} ${message.authorId}: ${message.message}`)}
          />
        </div>
        <div>
          <h4>Evidence</h4>
          <DetailList
            emptyLabel="No evidence attached."
            items={dispute.evidence.map((item) => `${item.label} (${item.type}): ${item.value}`)}
          />
        </div>
      </div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DetailList({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (items.length === 0) {
    return <p className="empty-state">{emptyLabel}</p>;
  }

  return (
    <ul className="detail-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function DataTable({
  headers,
  rows,
  emptyLabel
}: {
  headers: string[];
  rows: (React.ReactNode | string | number)[][];
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return <p className="empty-state">{emptyLabel}</p>;
  }

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
