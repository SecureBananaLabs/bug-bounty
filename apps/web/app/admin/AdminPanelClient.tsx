"use client";

import { useEffect, useMemo, useState } from "react";

type UserStatus = "active" | "suspended" | "banned";
type UserRole = "client" | "freelancer";
type ModerationStatus = "flagged" | "approved" | "rejected" | "escalated";
type DisputeStatus = "open" | "under_review" | "resolved" | "escalated";

type MetricState = {
  totalUsers: number;
  activeJobs: number;
  openDisputes: number;
  flaggedListings: number;
  revenueCurrentPeriod: number;
  trustScoreDistribution: Array<{ label: string; count: number }>;
};

type User = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
  trustScore: number;
  location: string;
};

type Listing = {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  budget: number;
  moderationStatus: ModerationStatus;
  flagReason: string;
  reports: number;
  flaggedAt: string;
};

type Dispute = {
  id: string;
  jobTitle: string;
  clientName: string;
  freelancerName: string;
  status: DisputeStatus;
  openedAt: string;
  summary: string;
  transaction: { amount: number; currency: string; escrowStatus: string };
  ruling: string | null;
  refundTriggered: boolean;
};

type Control = {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  updatedAt: string;
  updatedBy: string;
};

type AuditLog = {
  id: string;
  adminId: string;
  actionType: string;
  targetType: string;
  targetId: string;
  summary: string;
  createdAt: string;
};

type AdminState = {
  metrics: MetricState;
  users: User[];
  listings: Listing[];
  disputes: Dispute[];
  controls: Record<string, Control>;
  auditLogs: AuditLog[];
};

const pageSize = 4;

const initialState: AdminState = {
  metrics: {
    totalUsers: 4,
    activeJobs: 4,
    openDisputes: 1,
    flaggedListings: 2,
    revenueCurrentPeriod: 5200,
    trustScoreDistribution: [
      { label: "0-49", count: 1 },
      { label: "50-79", count: 1 },
      { label: "80-100", count: 2 }
    ]
  },
  users: [
    {
      id: "usr_freelancer_1",
      email: "maya@example.com",
      fullName: "Maya Chen",
      role: "freelancer",
      status: "active",
      joinedAt: "2026-02-11T10:30:00.000Z",
      trustScore: 92,
      location: "Austin, TX"
    },
    {
      id: "usr_client_1",
      email: "olivia@example.com",
      fullName: "Olivia Grant",
      role: "client",
      status: "active",
      joinedAt: "2026-03-08T12:00:00.000Z",
      trustScore: 87,
      location: "Seattle, WA"
    },
    {
      id: "usr_client_2",
      email: "noah@example.com",
      fullName: "Noah Price",
      role: "client",
      status: "active",
      joinedAt: "2026-04-02T08:15:00.000Z",
      trustScore: 64,
      location: "Chicago, IL"
    },
    {
      id: "usr_freelancer_2",
      email: "leo@example.com",
      fullName: "Leo Martin",
      role: "freelancer",
      status: "suspended",
      joinedAt: "2026-01-22T15:45:00.000Z",
      trustScore: 46,
      location: "Toronto, CA"
    }
  ],
  listings: [
    {
      id: "flagged_job_1",
      title: "Payment integration review",
      clientId: "usr_client_1",
      clientName: "Olivia Grant",
      budget: 900,
      moderationStatus: "flagged",
      flagReason: "Escrow bypass language detected",
      reports: 3,
      flaggedAt: "2026-05-16T09:00:00.000Z"
    },
    {
      id: "flagged_job_2",
      title: "Landing page copy refresh",
      clientId: "usr_client_2",
      clientName: "Noah Price",
      budget: 450,
      moderationStatus: "flagged",
      flagReason: "Multiple duplicate reports",
      reports: 2,
      flaggedAt: "2026-05-15T18:25:00.000Z"
    }
  ],
  disputes: [
    {
      id: "dispute_1",
      jobTitle: "Payment integration review",
      clientName: "Olivia Grant",
      freelancerName: "Maya Chen",
      status: "open",
      openedAt: "2026-05-16T17:20:00.000Z",
      summary: "Milestone delivery failed sandbox verification.",
      transaction: { amount: 900, currency: "USD", escrowStatus: "held" },
      ruling: null,
      refundTriggered: false
    },
    {
      id: "dispute_2",
      jobTitle: "Design mobile onboarding flows",
      clientName: "Noah Price",
      freelancerName: "Leo Martin",
      status: "under_review",
      openedAt: "2026-05-10T08:40:00.000Z",
      summary: "Payment release is disputed after client approval.",
      transaction: { amount: 450, currency: "USD", escrowStatus: "pending_release" },
      ruling: null,
      refundTriggered: false
    }
  ],
  controls: {
    registrations: {
      key: "registrations",
      label: "New user registrations",
      description: "Client and freelancer account creation",
      enabled: true,
      updatedAt: "2026-05-01T00:00:00.000Z",
      updatedBy: "system"
    },
    jobPostings: {
      key: "jobPostings",
      label: "New job postings",
      description: "Client job publication",
      enabled: true,
      updatedAt: "2026-05-01T00:00:00.000Z",
      updatedBy: "system"
    }
  },
  auditLogs: [
    {
      id: "audit_seed_1",
      adminId: "admin_100",
      actionType: "session",
      targetType: "admin_console",
      targetId: "admin",
      summary: "Admin console opened",
      createdAt: "2026-05-18T04:00:00.000Z"
    }
  ]
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function cloneInitialState(): AdminState {
  return JSON.parse(JSON.stringify(initialState));
}

function createAudit(actionType: string, targetType: string, targetId: string, summary: string): AuditLog {
  return {
    id: `audit_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    adminId: "admin_demo",
    actionType,
    targetType,
    targetId,
    summary,
    createdAt: new Date().toISOString()
  };
}

function statusClass(status: string) {
  return `status-pill status-${status.replace("_", "-")}`;
}

async function fetchAdminData(): Promise<AdminState | null> {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  const token =
    process.env.NEXT_PUBLIC_ADMIN_TOKEN ||
    (typeof window !== "undefined" ? window.localStorage.getItem("freelanceflow_admin_token") : null);

  if (!apiBase || !token) {
    return null;
  }

  const request = async (path: string) => {
    const response = await fetch(`${apiBase}${path}`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.message || `Admin API request failed: ${path}`);
    }
    return payload.data;
  };

  const [metrics, users, listings, disputes, controls, auditLogs] = await Promise.all([
    request("/api/admin/metrics"),
    request("/api/admin/users?page=1&pageSize=25"),
    request("/api/admin/moderation/jobs?page=1&pageSize=25"),
    request("/api/admin/disputes?page=1&pageSize=25"),
    request("/api/admin/platform-controls"),
    request("/api/admin/audit-logs?page=1&pageSize=25")
  ]);

  return {
    metrics,
    users: users.items,
    listings: listings.items,
    disputes: disputes.items.map((dispute: Dispute) => ({
      ...dispute,
      transaction: dispute.transaction ?? { amount: 0, currency: "USD", escrowStatus: "unknown" }
    })),
    controls,
    auditLogs: auditLogs.items
  };
}

export function AdminPanelClient() {
  const [state, setState] = useState<AdminState>(() => cloneInitialState());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");
  const [userPage, setUserPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState("usr_freelancer_1");
  const [auditFilter, setAuditFilter] = useState("all");

  const filteredUsers = useMemo(() => {
    const needle = userSearch.trim().toLowerCase();
    return state.users.filter((user) => {
      const matchesSearch =
        !needle ||
        [user.fullName, user.email, user.location].some((value) => value.toLowerCase().includes(needle));
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roleFilter, state.users, statusFilter, userSearch]);

  const visibleUsers = useMemo(() => {
    const start = (userPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, userPage]);

  const selectedUser = state.users.find((user) => user.id === selectedUserId) ?? state.users[0];
  const auditTypes = Array.from(new Set(state.auditLogs.map((log) => log.actionType)));
  const visibleAuditLogs = state.auditLogs.filter(
    (log) => auditFilter === "all" || log.actionType === auditFilter
  );
  const maxTrustBucket = Math.max(1, ...state.metrics.trustScoreDistribution.map((bucket) => bucket.count));

  async function refreshData() {
    setLoading(true);
    setError("");
    try {
      const remoteState = await fetchAdminData();
      setState(remoteState ?? cloneInitialState());
      setLastRefresh(new Date().toISOString());
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Admin data refresh failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshData();
  }, []);

  function appendAudit(log: AuditLog) {
    setState((current) => ({ ...current, auditLogs: [log, ...current.auditLogs] }));
  }

  function updateUserStatus(userId: string, status: UserStatus) {
    setState((current) => ({
      ...current,
      users: current.users.map((user) => (user.id === userId ? { ...user, status } : user))
    }));
    appendAudit(createAudit("user_status", "user", userId, `User status changed to ${status}`));
  }

  function moderateListing(listingId: string, moderationStatus: ModerationStatus) {
    setState((current) => ({
      ...current,
      listings: current.listings.map((listing) =>
        listing.id === listingId ? { ...listing, moderationStatus } : listing
      ),
      metrics: {
        ...current.metrics,
        flaggedListings: current.listings.filter(
          (listing) => listing.id !== listingId && listing.moderationStatus === "flagged"
        ).length
      }
    }));
    appendAudit(
      createAudit("listing_moderation", "job", listingId, `Listing moderation changed to ${moderationStatus}`)
    );
  }

  function ruleDispute(disputeId: string, ruling: "client" | "freelancer" | "escalate") {
    const nextStatus = ruling === "escalate" ? "escalated" : "resolved";
    setState((current) => ({
      ...current,
      disputes: current.disputes.map((dispute) =>
        dispute.id === disputeId
          ? {
              ...dispute,
              status: nextStatus,
              ruling,
              refundTriggered: ruling === "client"
            }
          : dispute
      ),
      metrics: {
        ...current.metrics,
        openDisputes: current.disputes.filter(
          (dispute) => dispute.id !== disputeId && dispute.status === "open"
        ).length
      }
    }));
    appendAudit(createAudit("dispute_ruling", "dispute", disputeId, `Dispute ruling set to ${ruling}`));
  }

  function toggleControl(controlKey: string) {
    const control = state.controls[controlKey];
    if (!control) {
      return;
    }

    const confirmed = window.confirm(`Confirm change for ${control.label}?`);
    if (!confirmed) {
      return;
    }

    setState((current) => ({
      ...current,
      controls: {
        ...current.controls,
        [controlKey]: {
          ...current.controls[controlKey],
          enabled: !current.controls[controlKey].enabled,
          updatedAt: new Date().toISOString(),
          updatedBy: "admin_demo"
        }
      }
    }));
    appendAudit(createAudit("control_update", "platform_control", controlKey, `${control.label} toggled`));
  }

  return (
    <section className="admin-shell" aria-labelledby="admin-title">
      <div className="admin-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h2 id="admin-title">Admin Panel</h2>
        </div>
        <div className="admin-header-actions">
          <span className="refresh-stamp">{lastRefresh ? `Refreshed ${shortDate(lastRefresh)}` : "Loading"}</span>
          <button type="button" className="button primary" onClick={refreshData} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {error ? <div className="error-banner" role="alert">{error}</div> : null}

      <div className="admin-metric-grid" aria-busy={loading}>
        <Metric label="Total users" value={String(state.metrics.totalUsers)} />
        <Metric label="Active jobs" value={String(state.metrics.activeJobs)} />
        <Metric label="Open disputes" value={String(state.metrics.openDisputes)} tone="warning" />
        <Metric label="Flagged listings" value={String(state.metrics.flaggedListings)} tone="danger" />
        <Metric label="Period revenue" value={money(state.metrics.revenueCurrentPeriod)} tone="success" />
      </div>

      <div className="admin-layout">
        <section className="admin-section" aria-labelledby="users-title">
          <div className="section-heading">
            <h3 id="users-title">User Management</h3>
            <span>{filteredUsers.length} records</span>
          </div>

          <div className="filter-row">
            <label>
              <span>Search</span>
              <input
                value={userSearch}
                onChange={(event) => {
                  setUserSearch(event.target.value);
                  setUserPage(1);
                }}
                placeholder="Name, email, location"
              />
            </label>
            <label>
              <span>Role</span>
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as "all" | UserRole)}>
                <option value="all">All roles</option>
                <option value="client">Clients</option>
                <option value="freelancer">Freelancers</option>
              </select>
            </label>
            <label>
              <span>Status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as "all" | UserStatus)}
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </select>
            </label>
          </div>

          {visibleUsers.length === 0 ? (
            <EmptyState label="No users match the current filters." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">User</th>
                    <th scope="col">Role</th>
                    <th scope="col">Status</th>
                    <th scope="col">Trust</th>
                    <th scope="col">Joined</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <button type="button" className="link-button" onClick={() => setSelectedUserId(user.id)}>
                          {user.fullName}
                        </button>
                        <span className="muted">{user.email}</span>
                      </td>
                      <td>{user.role}</td>
                      <td>
                        <span className={statusClass(user.status)}>{user.status}</span>
                      </td>
                      <td>{user.trustScore}</td>
                      <td>{shortDate(user.joinedAt)}</td>
                      <td className="action-cell">
                        <button type="button" onClick={() => updateUserStatus(user.id, "suspended")}>
                          Suspend
                        </button>
                        <button type="button" onClick={() => updateUserStatus(user.id, "active")}>
                          Reinstate
                        </button>
                        <button type="button" className="danger" onClick={() => updateUserStatus(user.id, "banned")}>
                          Ban
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="pagination-row">
            <button type="button" disabled={userPage === 1} onClick={() => setUserPage((page) => page - 1)}>
              Previous
            </button>
            <span>
              Page {userPage} of {Math.max(1, Math.ceil(filteredUsers.length / pageSize))}
            </span>
            <button
              type="button"
              disabled={userPage >= Math.max(1, Math.ceil(filteredUsers.length / pageSize))}
              onClick={() => setUserPage((page) => page + 1)}
            >
              Next
            </button>
          </div>
        </section>

        <aside className="admin-side-panel" aria-labelledby="profile-title">
          <h3 id="profile-title">Profile Review</h3>
          {selectedUser ? (
            <>
              <dl>
                <div>
                  <dt>Name</dt>
                  <dd>{selectedUser.fullName}</dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <dd>{selectedUser.location}</dd>
                </div>
                <div>
                  <dt>Trust score</dt>
                  <dd>{selectedUser.trustScore}</dd>
                </div>
              </dl>
              <p className="muted">Active jobs: 1</p>
              <p className="muted">Dispute history: 1</p>
            </>
          ) : (
            <EmptyState label="Select a user." />
          )}
        </aside>
      </div>

      <section className="admin-section" aria-labelledby="moderation-title">
        <div className="section-heading">
          <h3 id="moderation-title">Job Moderation</h3>
          <span>{state.listings.length} listings</span>
        </div>
        <div className="queue-grid">
          {state.listings.length === 0 ? (
            <EmptyState label="No flagged listings." />
          ) : (
            state.listings.map((listing) => (
              <article key={listing.id} className="queue-item">
                <div>
                  <h4>{listing.title}</h4>
                  <p>{listing.clientName}</p>
                </div>
                <span className={statusClass(listing.moderationStatus)}>{listing.moderationStatus}</span>
                <p>{listing.flagReason}</p>
                <p className="muted">
                  {listing.reports} reports · {money(listing.budget)}
                </p>
                <div className="button-row">
                  <button type="button" onClick={() => moderateListing(listing.id, "approved")}>
                    Approve
                  </button>
                  <button type="button" onClick={() => moderateListing(listing.id, "escalated")}>
                    Escalate
                  </button>
                  <button type="button" className="danger" onClick={() => moderateListing(listing.id, "rejected")}>
                    Reject
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="admin-section" aria-labelledby="disputes-title">
        <div className="section-heading">
          <h3 id="disputes-title">Dispute Resolution</h3>
          <span>{state.disputes.length} cases</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Case</th>
                <th scope="col">Parties</th>
                <th scope="col">Escrow</th>
                <th scope="col">Status</th>
                <th scope="col">Ruling</th>
              </tr>
            </thead>
            <tbody>
              {state.disputes.map((dispute) => (
                <tr key={dispute.id}>
                  <td>
                    <strong>{dispute.jobTitle}</strong>
                    <span className="muted">{dispute.summary}</span>
                  </td>
                  <td>
                    {dispute.clientName} / {dispute.freelancerName}
                  </td>
                  <td>{money(dispute.transaction.amount)}</td>
                  <td>
                    <span className={statusClass(dispute.status)}>{dispute.status}</span>
                  </td>
                  <td className="action-cell">
                    <button type="button" onClick={() => ruleDispute(dispute.id, "client")}>
                      Client
                    </button>
                    <button type="button" onClick={() => ruleDispute(dispute.id, "freelancer")}>
                      Freelancer
                    </button>
                    <button type="button" onClick={() => ruleDispute(dispute.id, "escalate")}>
                      Escalate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="admin-two-column">
        <section className="admin-section" aria-labelledby="trust-title">
          <h3 id="trust-title">Trust Distribution</h3>
          <div className="bar-chart" role="img" aria-label="Trust score distribution">
            {state.metrics.trustScoreDistribution.map((bucket) => (
              <div className="bar-row" key={bucket.label}>
                <span>{bucket.label}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(bucket.count / maxTrustBucket) * 100}%` }} />
                </div>
                <strong>{bucket.count}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-section" aria-labelledby="controls-title">
          <h3 id="controls-title">Platform Controls</h3>
          <div className="controls-list">
            {Object.values(state.controls).map((control) => (
              <label className="toggle-row" key={control.key}>
                <span>
                  <strong>{control.label}</strong>
                  <em>{control.description}</em>
                </span>
                <input
                  type="checkbox"
                  checked={control.enabled}
                  onChange={() => toggleControl(control.key)}
                  aria-label={`Toggle ${control.label}`}
                />
              </label>
            ))}
          </div>
        </section>
      </div>

      <section className="admin-section" aria-labelledby="audit-title">
        <div className="section-heading">
          <h3 id="audit-title">Audit Log</h3>
          <label>
            <span>Action</span>
            <select value={auditFilter} onChange={(event) => setAuditFilter(event.target.value)}>
              <option value="all">All actions</option>
              {auditTypes.map((type) => (
                <option value={type} key={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
        </div>
        {visibleAuditLogs.length === 0 ? (
          <EmptyState label="No audit records match the filter." />
        ) : (
          <ol className="audit-list">
            {visibleAuditLogs.map((log) => (
              <li key={log.id}>
                <span>{shortDate(log.createdAt)}</span>
                <strong>{log.actionType}</strong>
                <p>{log.summary}</p>
                <em>
                  {log.adminId} · {log.targetType}:{log.targetId}
                </em>
              </li>
            ))}
          </ol>
        )}
      </section>
    </section>
  );
}

function Metric({ label, value, tone = "default" }: { label: string; value: string; tone?: string }) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function EmptyState({ label }: { label: string }) {
  return <div className="empty-state">{label}</div>;
}
