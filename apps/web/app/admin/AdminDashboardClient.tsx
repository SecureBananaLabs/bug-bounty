"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import { ConfirmActions, ConfirmToggle } from "./AdminActions";
import type {
  AdminAuditEntry,
  AdminDashboardData,
  AdminDispute,
  AdminJob,
  AdminMetrics,
  AdminNotification,
  AdminSettings,
  AdminUser,
  TablePage
} from "../../lib/admin-data";
import { ADMIN_PAGE_SIZE } from "../../lib/admin-data";

type Props = {
  token: string | null;
  initialData: AdminDashboardData;
  previewState: string;
};

type UserFilters = {
  query: string;
  role: string;
  status: string;
  joinedAfter: string;
  joinedBefore: string;
};

type AuditFilters = {
  admin: string;
  action: string;
  from: string;
  to: string;
};

type DisputeFilters = {
  status: string;
};

const defaultFilters = (): UserFilters => ({
  query: "",
  role: "",
  status: "",
  joinedAfter: "",
  joinedBefore: ""
});

const defaultAuditFilters = (): AuditFilters => ({
  admin: "",
  action: "",
  from: "",
  to: ""
});

const defaultDisputeFilters = (): DisputeFilters => ({
  status: ""
});

function formatRevenue(value: number | string) {
  if (typeof value === "number") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(value);
  }

  return value;
}

function SectionTitle({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="admin-section-title">
      <span>{eyebrow}</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper
}: {
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <article className="card admin-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

function Pagination({
  page,
  totalPages,
  onPrev,
  onNext
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="pagination-row">
      <span className="muted">
        Page {page} of {totalPages}
      </span>
      <div className="button-row">
        <button className="admin-button secondary" type="button" onClick={onPrev} disabled={page <= 1}>
          Previous
        </button>
        <button className="admin-button secondary" type="button" onClick={onNext} disabled={page >= totalPages}>
          Next
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboardClient({ token, initialData, previewState }: Props) {
  const [dashboard, setDashboard] = useState(initialData);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [userPage, setUserPage] = useState(initialData.users.page);
  const [jobPage, setJobPage] = useState(initialData.jobs.page);
  const [disputePage, setDisputePage] = useState(initialData.disputes.page);
  const [auditPage, setAuditPage] = useState(initialData.auditLog.page);
  const [notificationPage, setNotificationPage] = useState(initialData.notifications.page);
  const [filters, setFilters] = useState<UserFilters>(defaultFilters);
  const [draftFilters, setDraftFilters] = useState<UserFilters>(defaultFilters);
  const [disputeFilters, setDisputeFilters] = useState<DisputeFilters>(defaultDisputeFilters);
  const [draftDisputeFilters, setDraftDisputeFilters] = useState<DisputeFilters>(defaultDisputeFilters);
  const [auditFilters, setAuditFilters] = useState<AuditFilters>(defaultAuditFilters);
  const [draftAuditFilters, setDraftAuditFilters] = useState<AuditFilters>(defaultAuditFilters);
  const [selectedUserId, setSelectedUserId] = useState(initialData.users.items[0]?.id ?? null);
  const [selectedDisputeId, setSelectedDisputeId] = useState(initialData.disputes.items[0]?.id ?? null);

  useEffect(() => {
    if (!selectedUserId && dashboard.users.items[0]) {
      setSelectedUserId(dashboard.users.items[0].id);
    }
  }, [dashboard.users.items, selectedUserId]);

  const selectedUser = useMemo(
    () => dashboard.users.items.find((user) => user.id === selectedUserId) ?? dashboard.users.items[0] ?? null,
    [dashboard.users.items, selectedUserId]
  );

  const selectedDispute = useMemo(
    () =>
      dashboard.disputes.items.find((dispute) => dispute.id === selectedDisputeId) ??
      dashboard.disputes.items[0] ??
      null,
    [dashboard.disputes.items, selectedDisputeId]
  );

  function authHeaders() {
    const headers: Record<string, string> = {};
    if (token) {
      headers.authorization = `Bearer ${token}`;
    }
    return headers;
  }

  function reportError(error: unknown) {
    const message = error instanceof Error ? error.message : "Request failed";
    setMessage(message);
  }

  async function apiJson<T>(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers ?? {});
    for (const [key, value] of Object.entries(authHeaders())) {
      headers.set(key, value);
    }
    if (init.body && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    const response = await fetch(path, {
      ...init,
      headers,
      credentials: "include",
      cache: "no-store"
    });

    const payload = (await response.json()) as { success: boolean; data?: T; message?: string };
    if (!response.ok || !payload.success) {
      throw new Error(payload.message ?? "Request failed");
    }

    return payload.data as T;
  }

  async function loadMetricsAndSettings() {
    try {
      const [metrics, settings] = await Promise.all([
        apiJson<AdminMetrics>("/api/admin/metrics"),
        apiJson<AdminSettings>("/api/admin/settings")
      ]);

      setDashboard((current) => ({
        ...current,
        metrics,
        settings
      }));
    } catch (error) {
      reportError(error);
      throw error;
    }
  }

  async function loadUsers(nextPage = userPage, nextFilters = filters) {
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(ADMIN_PAGE_SIZE)
      });

      if (nextFilters.query) {
        params.set("query", nextFilters.query);
      }
      if (nextFilters.role) {
        params.set("role", nextFilters.role);
      }
      if (nextFilters.status) {
        params.set("status", nextFilters.status);
      }
      if (nextFilters.joinedAfter) {
        params.set("joinedAfter", nextFilters.joinedAfter);
      }
      if (nextFilters.joinedBefore) {
        params.set("joinedBefore", nextFilters.joinedBefore);
      }

      const users = await apiJson<TablePage<AdminUser>>(`/api/admin/users?${params.toString()}`);
      setDashboard((current) => ({ ...current, users }));
      setUserPage(nextPage);
      setFilters(nextFilters);
      if (!users.items.some((user) => user.id === selectedUserId)) {
        setSelectedUserId(users.items[0]?.id ?? null);
      }
    } catch (error) {
      reportError(error);
    }
  }

  async function loadJobs(nextPage = jobPage) {
    try {
      const jobs = await apiJson<TablePage<AdminJob>>(
        `/api/admin/jobs?page=${nextPage}&limit=${ADMIN_PAGE_SIZE}`
      );
      setDashboard((current) => ({ ...current, jobs }));
      setJobPage(nextPage);
    } catch (error) {
      reportError(error);
    }
  }

  async function loadDisputes(nextPage = disputePage, nextFilters = disputeFilters) {
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(ADMIN_PAGE_SIZE)
      });

      if (nextFilters.status) {
        params.set("status", nextFilters.status);
      }

      const disputes = await apiJson<TablePage<AdminDispute>>(`/api/admin/disputes?${params.toString()}`);
      setDashboard((current) => ({ ...current, disputes }));
      setDisputePage(nextPage);
      setDisputeFilters(nextFilters);
      if (!disputes.items.some((dispute) => dispute.id === selectedDisputeId)) {
        setSelectedDisputeId(disputes.items[0]?.id ?? null);
      }
    } catch (error) {
      reportError(error);
    }
  }

  async function loadAudit(nextPage = auditPage, nextFilters = auditFilters) {
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(ADMIN_PAGE_SIZE)
      });

      if (nextFilters.admin) {
        params.set("admin", nextFilters.admin);
      }
      if (nextFilters.action) {
        params.set("action", nextFilters.action);
      }
      if (nextFilters.from) {
        params.set("from", nextFilters.from);
      }
      if (nextFilters.to) {
        params.set("to", nextFilters.to);
      }

      const auditLog = await apiJson<TablePage<AdminAuditEntry>>(`/api/admin/audit-log?${params.toString()}`);
      setDashboard((current) => ({ ...current, auditLog }));
      setAuditPage(nextPage);
    } catch (error) {
      reportError(error);
    }
  }

  async function loadNotifications(nextPage = notificationPage) {
    try {
      const notifications = await apiJson<TablePage<AdminNotification>>(
        `/api/admin/notifications?page=${nextPage}&limit=${ADMIN_PAGE_SIZE}`
      );
      setDashboard((current) => ({ ...current, notifications }));
      setNotificationPage(nextPage);
    } catch (error) {
      reportError(error);
    }
  }

  async function refreshAll() {
    setMessage(null);
    try {
      await Promise.all([
        loadMetricsAndSettings(),
        loadUsers(),
        loadJobs(),
        loadDisputes(),
        loadAudit(),
        loadNotifications()
      ]);
      setMessage("Dashboard refreshed from the admin API.");
    } catch {
      // Individual loaders already surfaced the error message.
    }
  }

  async function mutate(path: string, init: RequestInit, refresh = true) {
    setBusy(path);
    setMessage(null);
    try {
      await apiJson(path, init);
      if (refresh) {
        await refreshAll();
      }
      setMessage("Action completed successfully.");
    } catch (error) {
      reportError(error);
    } finally {
      setBusy(null);
    }
  }

  async function handleUserAction(userId: string, action: string) {
    await mutate(`/api/admin/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ action })
    });
  }

  async function handleJobAction(jobId: string, action: string) {
    const prompted = action === "reject" || action === "escalate" ? window.prompt("Optional reason") : null;
    const reason = prompted && prompted.trim().length >= 3 ? prompted.trim() : undefined;
    await mutate(`/api/admin/jobs/${jobId}`, {
      method: "PATCH",
      body: JSON.stringify({ action, reason })
    });
  }

  async function handleDisputeAction(disputeId: string, action: string) {
    const prompted = action === "escalate" ? window.prompt("Escalation reason") : null;
    const reason = prompted && prompted.trim().length >= 3 ? prompted.trim() : undefined;
    await mutate(`/api/admin/disputes/${disputeId}`, {
      method: "PATCH",
      body: JSON.stringify({ action, reason })
    });
  }

  async function handleSettingChange(setting: keyof AdminSettings, next: boolean) {
    await mutate("/api/admin/settings", {
      method: "PATCH",
      body: JSON.stringify({ [setting]: next })
    });
  }

  function submitUserFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(() => {
      void loadUsers(1, draftFilters);
    });
  }

  function submitAuditFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = draftAuditFilters;
    setAuditFilters(next);
    startTransition(() => {
      void loadAudit(1, next);
    });
  }

  function submitDisputeFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = draftDisputeFilters;
    setDisputeFilters(next);
    startTransition(() => {
      void loadDisputes(1, next);
    });
  }

  const previewCards =
    previewState === "ready" ? null : (
      <section className="card">
        <SectionTitle
          eyebrow="State preview"
          title="Loading, empty, and error handling"
          description="The admin view includes explicit states so reviewers can see how each section behaves when data is unavailable."
        />
        <div className="state-stack">
          {previewState === "loading" ? (
            <div className="state-card loading">Preview mode: loading state active.</div>
          ) : null}
          {previewState === "empty" ? (
            <div className="state-card empty">Preview mode: empty state active.</div>
          ) : null}
          {previewState === "error" ? (
            <div className="state-card error">Preview mode: error state active.</div>
          ) : null}
        </div>
      </section>
    );

  return (
    <section className="admin-shell">
      <header className="card admin-hero">
        <div>
          <span className="eyebrow">Admin Command Center</span>
          <h2>Platform control, moderation, and trust operations</h2>
          <p>
            This dashboard is connected to the admin API, supports server-side filtering and pagination, and includes
            live moderation actions.
          </p>
          <div className="hero-meta">
            <span className="pill">{dashboard.source === "api" ? "Live API data" : "Preview fallback"}</span>
            <span className="pill">Page size {ADMIN_PAGE_SIZE}</span>
          </div>
        </div>
        <div className="hero-actions">
          <button className="admin-button" type="button" onClick={() => void refreshAll()} disabled={isPending}>
            Refresh data
          </button>
          {message ? <p className="muted action-status">{message}</p> : null}
        </div>
      </header>

      {previewCards}

      <section className="grid admin-metrics-grid" aria-label="Trust metrics overview">
        <MetricCard label="Total users" value={dashboard.metrics.totalUsers} helper="Registered clients and freelancers" />
        <MetricCard label="Active jobs" value={dashboard.metrics.activeJobs} helper="Live marketplace work" />
        <MetricCard label="Open disputes" value={dashboard.metrics.openDisputes} helper="Needs moderation" />
        <MetricCard label="Flagged listings" value={dashboard.metrics.flaggedListings} helper="Review queue" />
        <MetricCard label="Revenue" value={formatRevenue(dashboard.metrics.revenue)} helper="Current period" />
      </section>

      <section className="card">
        <SectionTitle
          eyebrow="Trust score"
          title="Distribution across the user base"
          description="Quick glance at healthy, at-risk, and low-trust cohorts."
        />
        <div className="trust-bars" aria-label="Trust score distribution chart">
          {dashboard.metrics.trustScoreBuckets.map((bucket) => (
            <div key={bucket.label} className="trust-bar-row">
              <span>{bucket.label}</span>
              <div className="trust-bar-track">
                <div className="trust-bar-fill" style={{ width: `${Math.min(bucket.count * 7, 100)}%` }} />
              </div>
              <strong>{bucket.count}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <SectionTitle
          eyebrow="User management"
          title="Searchable user table"
          description="Server-side filters and pagination keep the table bounded and reviewable."
        />
        <form className="filter-grid admin-filters" onSubmit={submitUserFilters}>
          <label>
            <span>Search users</span>
            <input
              aria-label="Search users"
              placeholder="Name or email"
              value={draftFilters.query}
              onChange={(event) => setDraftFilters((current) => ({ ...current, query: event.target.value }))}
            />
          </label>
          <label>
            <span>Role</span>
            <select
              aria-label="Filter by role"
              value={draftFilters.role}
              onChange={(event) => setDraftFilters((current) => ({ ...current, role: event.target.value }))}
            >
              <option value="">All roles</option>
              <option value="client">Client</option>
              <option value="freelancer">Freelancer</option>
            </select>
          </label>
          <label>
            <span>Status</span>
            <select
              aria-label="Filter by status"
              value={draftFilters.status}
              onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="flagged">Flagged</option>
              <option value="banned">Banned</option>
            </select>
          </label>
          <label>
            <span>Join date after</span>
            <input
              aria-label="Join date after"
              placeholder="2026-05-01"
              value={draftFilters.joinedAfter}
              onChange={(event) => setDraftFilters((current) => ({ ...current, joinedAfter: event.target.value }))}
            />
          </label>
          <label>
            <span>Join date before</span>
            <input
              aria-label="Join date before"
              placeholder="2026-05-20"
              value={draftFilters.joinedBefore}
              onChange={(event) => setDraftFilters((current) => ({ ...current, joinedBefore: event.target.value }))}
            />
          </label>
          <div className="filter-actions">
            <button className="admin-button" type="submit" disabled={isPending}>
              Apply filters
            </button>
            <button
              className="admin-button secondary"
              type="button"
              onClick={() => {
                const next = defaultFilters();
                setDraftFilters(next);
                startTransition(() => {
                  void loadUsers(1, next);
                });
              }}
              disabled={isPending}
            >
              Reset
            </button>
          </div>
        </form>

        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">User</th>
                <th scope="col">Role</th>
                <th scope="col">Status</th>
                <th scope="col">Joined</th>
                <th scope="col">Jobs</th>
                <th scope="col">Disputes</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.users.items.map((user) => (
                <tr key={user.id} className={selectedUser?.id === user.id ? "row-selected" : undefined}>
                  <td>
                    <button className="text-button" type="button" onClick={() => setSelectedUserId(user.id)}>
                      <strong>{user.name}</strong>
                    </button>
                    <div className="muted">{user.email}</div>
                    <div className="muted">{user.profile.headline}</div>
                  </td>
                  <td>{user.role}</td>
                  <td>
                    <span className={`status-chip ${user.status}`}>{user.status}</span>
                  </td>
                  <td>{user.joinedAt}</td>
                  <td>{user.activeJobs}</td>
                  <td>{user.disputes}</td>
                  <td>
                    <button className="admin-button secondary" type="button" onClick={() => setSelectedUserId(user.id)}>
                      View profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          page={dashboard.users.page}
          totalPages={dashboard.users.totalPages}
          onPrev={() => {
            startTransition(() => {
              void loadUsers(Math.max(1, dashboard.users.page - 1), filters);
            });
          }}
          onNext={() => {
            startTransition(() => {
              void loadUsers(Math.min(dashboard.users.totalPages, dashboard.users.page + 1), filters);
            });
          }}
        />

        {selectedUser ? (
          <div className="detail-grid">
            <article className="card detail-card">
              <SectionTitle
                eyebrow="Selected user"
                title={`${selectedUser.name} profile`}
                description="Profile, active jobs, and dispute history surfaced from the user table."
              />
              <div className="detail-list">
                <div>
                  <span className="muted">Headline</span>
                  <strong>{selectedUser.profile.headline}</strong>
                </div>
                <div>
                  <span className="muted">Location</span>
                  <strong>{selectedUser.profile.location}</strong>
                </div>
                <div>
                  <span className="muted">Trust score</span>
                  <strong>{selectedUser.profile.trustScore}</strong>
                </div>
                <div>
                  <span className="muted">Last seen</span>
                  <strong>{selectedUser.lastSeenAt}</strong>
                </div>
              </div>
              <p className="muted">{selectedUser.profile.bio}</p>

              <div className="two-column-list">
                <div>
                  <h4>Active jobs</h4>
                  <ul>
                    {selectedUser.activeJobTitles.map((job) => (
                      <li key={job}>{job}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>Dispute history</h4>
                  <ul>
                    {selectedUser.disputeHistory.length > 0 ? (
                      selectedUser.disputeHistory.map((item) => <li key={item}>{item}</li>)
                    ) : (
                      <li>No prior disputes</li>
                    )}
                  </ul>
                </div>
              </div>

              <ConfirmActions
                subject={selectedUser.name}
                actions={[
                  { label: "Suspend", value: "suspend" },
                  { label: "Reinstate", value: "reinstate" },
                  { label: "Ban", value: "ban" }
                ]}
                onAction={(action) => void handleUserAction(selectedUser.id, action)}
                disabled={busy === `/api/admin/users/${selectedUser.id}`}
              />
            </article>
          </div>
        ) : null}
      </section>

      <section className="grid admin-columns" aria-label="Moderation and disputes">
        <article className="card">
          <SectionTitle
            eyebrow="Moderation"
            title="Flagged listings queue"
            description="Approve, reject, or escalate items reported by automated rules or users."
          />
          <div className="stack">
            {dashboard.jobs.items.map((item) => (
              <div key={item.id} className="stack-item">
                <div>
                  <strong>{item.title}</strong>
                  <div className="muted">{item.owner}</div>
                  <div className="muted">{item.reason}</div>
                  <div className="muted">Updated {item.updatedAt}</div>
                </div>
                <ConfirmActions
                  subject={item.title}
                  actions={[
                    { label: "Approve", value: "approve" },
                    { label: "Reject", value: "reject" },
                    { label: "Escalate", value: "escalate" }
                  ]}
                  onAction={(action) => void handleJobAction(item.id, action)}
                  disabled={busy === `/api/admin/jobs/${item.id}`}
                />
              </div>
            ))}
          </div>
          <Pagination
            page={dashboard.jobs.page}
            totalPages={dashboard.jobs.totalPages}
            onPrev={() => {
              startTransition(() => {
                void loadJobs(Math.max(1, dashboard.jobs.page - 1));
              });
            }}
            onNext={() => {
              startTransition(() => {
                void loadJobs(Math.min(dashboard.jobs.totalPages, dashboard.jobs.page + 1));
              });
            }}
          />
        </article>

        <article className="card">
          <SectionTitle
            eyebrow="Disputes"
            title="Open dispute queue"
            description="Threads, evidence, and transaction details with one-click resolutions."
          />
          <form className="filter-grid admin-filters" onSubmit={submitDisputeFilters}>
            <label>
              <span>Status</span>
              <select
                aria-label="Filter dispute queue by status"
                value={draftDisputeFilters.status}
                onChange={(event) => setDraftDisputeFilters((current) => ({ ...current, status: event.target.value }))}
              >
                <option value="">All statuses</option>
                <option value="open">Open</option>
                <option value="under_review">Under review</option>
                <option value="resolved">Resolved</option>
              </select>
            </label>
            <div className="filter-actions">
              <button className="admin-button" type="submit">
                Apply filters
              </button>
              <button
                className="admin-button secondary"
                type="button"
                onClick={() => {
                  const next = defaultDisputeFilters();
                  setDraftDisputeFilters(next);
                  setDisputeFilters(next);
                  startTransition(() => {
                    void loadDisputes(1, next);
                  });
                }}
              >
                Reset
              </button>
            </div>
          </form>
          <div className="stack">
            {dashboard.disputes.items.map((dispute) => (
              <div
                key={dispute.id}
                className={`stack-item ${selectedDispute?.id === dispute.id ? "row-selected" : ""}`}
              >
                <div>
                  <button className="text-button" type="button" onClick={() => setSelectedDisputeId(dispute.id)}>
                    <strong>{dispute.title}</strong>
                  </button>
                  <div className="muted">{dispute.parties}</div>
                  <div className="muted">{dispute.evidence}</div>
                  <div className="muted">{dispute.amount}</div>
                </div>
                <ConfirmActions
                  subject={dispute.title}
                  actions={[
                    { label: "Freelancer", value: "rule_freelancer" },
                    { label: "Client", value: "rule_client" },
                    { label: "Refund", value: "refund" },
                    { label: "Escalate", value: "escalate" }
                  ]}
                  onAction={(action) => void handleDisputeAction(dispute.id, action)}
                  disabled={busy === `/api/admin/disputes/${dispute.id}`}
                />
              </div>
            ))}
          </div>
          <Pagination
            page={dashboard.disputes.page}
            totalPages={dashboard.disputes.totalPages}
            onPrev={() => {
              startTransition(() => {
                void loadDisputes(Math.max(1, dashboard.disputes.page - 1), disputeFilters);
              });
            }}
            onNext={() => {
              startTransition(() => {
                void loadDisputes(Math.min(dashboard.disputes.totalPages, dashboard.disputes.page + 1), disputeFilters);
              });
            }}
          />
          {selectedDispute ? (
            <div className="detail-grid">
              <article className="card detail-card">
                <SectionTitle
                  eyebrow="Selected dispute"
                  title={selectedDispute.title}
                  description="Thread, evidence, and transaction details for the active case."
                />
                <div className="detail-list">
                  <div>
                    <span className="muted">Status</span>
                    <strong>{selectedDispute.status}</strong>
                  </div>
                  <div>
                    <span className="muted">Amount</span>
                    <strong>{selectedDispute.amount}</strong>
                  </div>
                  <div>
                    <span className="muted">Transaction</span>
                    <strong>{selectedDispute.transaction.id}</strong>
                  </div>
                  <div>
                    <span className="muted">Payout state</span>
                    <strong>{selectedDispute.transaction.status}</strong>
                  </div>
                </div>
                <p className="muted">{selectedDispute.evidence}</p>

                <div className="two-column-list">
                  <div>
                    <h4>Thread</h4>
                    <ul>
                      {selectedDispute.thread.map((entry) => (
                        <li key={`${entry.author}-${entry.at}`}>
                          <strong>{entry.author}</strong>: {entry.body} <span className="muted">{entry.at}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4>Transaction</h4>
                    <ul>
                      <li>Transaction ID: {selectedDispute.transaction.id}</li>
                      <li>Amount: {selectedDispute.transaction.amount}</li>
                      <li>Currency: {selectedDispute.transaction.currency}</li>
                      <li>Status: {selectedDispute.transaction.status}</li>
                    </ul>
                  </div>
                </div>
              </article>
            </div>
          ) : null}
        </article>
      </section>

      <section className="grid admin-columns">
        <article className="card">
          <SectionTitle
            eyebrow="Platform controls"
            title="Registration and posting toggles"
            description="Confirmation-first controls for changing platform behavior."
          />
          <div className="toggle-grid">
            <label className="toggle-item">
              <span>Enable new registrations</span>
              <ConfirmToggle
                label="new registrations"
                enabled={dashboard.settings.registrationsEnabled}
                onChange={(next) => void handleSettingChange("registrationsEnabled", next)}
                disabled={busy === "/api/admin/settings"}
              />
            </label>
            <label className="toggle-item">
              <span>Enable new job postings</span>
              <ConfirmToggle
                label="new job postings"
                enabled={dashboard.settings.jobPostingsEnabled}
                onChange={(next) => void handleSettingChange("jobPostingsEnabled", next)}
                disabled={busy === "/api/admin/settings"}
              />
            </label>
          </div>
        </article>

        <article className="card">
          <SectionTitle
            eyebrow="Audit log"
            title="Append-only admin actions"
            description="Bans, rulings, toggles, and moderation actions are recorded for review."
          />
          <form className="filter-grid admin-filters" onSubmit={submitAuditFilters}>
            <label>
              <span>Admin</span>
              <input
                aria-label="Filter audit log by admin"
                placeholder="admin id"
                value={draftAuditFilters.admin}
                onChange={(event) => setDraftAuditFilters((current) => ({ ...current, admin: event.target.value }))}
              />
            </label>
            <label>
              <span>Action</span>
              <input
                aria-label="Filter audit log by action"
                placeholder="ban_user"
                value={draftAuditFilters.action}
                onChange={(event) => setDraftAuditFilters((current) => ({ ...current, action: event.target.value }))}
              />
            </label>
            <label>
              <span>From</span>
              <input
                aria-label="Audit log from date"
                placeholder="2026-05-20T00:00:00Z"
                value={draftAuditFilters.from}
                onChange={(event) => setDraftAuditFilters((current) => ({ ...current, from: event.target.value }))}
              />
            </label>
            <label>
              <span>To</span>
              <input
                aria-label="Audit log to date"
                placeholder="2026-05-20T23:59:59Z"
                value={draftAuditFilters.to}
                onChange={(event) => setDraftAuditFilters((current) => ({ ...current, to: event.target.value }))}
              />
            </label>
            <div className="filter-actions">
              <button className="admin-button" type="submit">
                Apply filters
              </button>
              <button
                className="admin-button secondary"
                type="button"
                onClick={() => {
                  const next = defaultAuditFilters();
                  setDraftAuditFilters(next);
                  setAuditFilters(next);
                  startTransition(() => {
                    void loadAudit(1, next);
                  });
                }}
              >
                Reset
              </button>
            </div>
          </form>
          <div className="stack">
            {dashboard.auditLog.items.map((entry) => (
              <div key={entry.id} className="stack-item">
                <div>
                  <strong>{entry.action}</strong>
                  <div className="muted">{entry.detail}</div>
                </div>
                <div className="muted">
                  <div>{entry.admin}</div>
                  <div>{entry.createdAt}</div>
                </div>
              </div>
            ))}
          </div>
          <Pagination
            page={dashboard.auditLog.page}
            totalPages={dashboard.auditLog.totalPages}
            onPrev={() => {
              startTransition(() => {
                void loadAudit(Math.max(1, dashboard.auditLog.page - 1), auditFilters);
              });
            }}
            onNext={() => {
              startTransition(() => {
                void loadAudit(Math.min(dashboard.auditLog.totalPages, dashboard.auditLog.page + 1), auditFilters);
              });
            }}
          />
        </article>

        <article className="card">
          <SectionTitle
            eyebrow="Notifications"
            title="Action outcomes"
            description="Rejected listings and dispute rulings generate notification records for the affected parties."
          />
          <div className="stack">
            {dashboard.notifications.items.map((notification) => (
              <div key={notification.id} className="stack-item">
                <div>
                  <strong>{notification.recipient}</strong>
                  <div className="muted">{notification.type}</div>
                  <div className="muted">{notification.detail}</div>
                </div>
                <div className="muted">
                  <div>{notification.status}</div>
                  <div>{notification.createdAt}</div>
                </div>
              </div>
            ))}
          </div>
          <Pagination
            page={dashboard.notifications.page}
            totalPages={dashboard.notifications.totalPages}
            onPrev={() => {
              startTransition(() => {
                void loadNotifications(Math.max(1, dashboard.notifications.page - 1));
              });
            }}
            onNext={() => {
              startTransition(() => {
                void loadNotifications(Math.min(dashboard.notifications.totalPages, dashboard.notifications.page + 1));
              });
            }}
          />
        </article>
      </section>
    </section>
  );
}
