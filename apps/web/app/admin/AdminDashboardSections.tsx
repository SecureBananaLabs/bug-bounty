"use client";

import { type Dispatch, type FormEvent, type SetStateAction } from "react";
import { ConfirmActions, ConfirmToggle } from "./AdminActions";
import type {
  AdminAuditEntry,
  AdminDispute,
  AdminJob,
  AdminMetrics,
  AdminNotification,
  AdminSettings,
  AdminUser,
  TablePage
} from "../../lib/admin-data";

export type SectionStatus = {
  loading: boolean;
  error: string | null;
};

export type UserFilters = {
  query: string;
  role: string;
  status: string;
  joinedAfter: string;
  joinedBefore: string;
};

export type AuditFilters = {
  admin: string;
  action: string;
  from: string;
  to: string;
};

export type DisputeFilters = {
  status: string;
};

export function SectionTitle({
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

export function MetricCard({
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

export function EmptyState({ message, colspan }: { message: string; colspan?: number }) {
  if (typeof colspan === "number") {
    return (
      <tr>
        <td colSpan={colspan}>
          <div className="state-card empty">{message}</div>
        </td>
      </tr>
    );
  }

  return <div className="state-card empty">{message}</div>;
}

export function SectionState({
  label,
  status
}: {
  label: string;
  status: SectionStatus;
}) {
  if (status.loading) {
    return <div className="state-card loading">{label} are refreshing.</div>;
  }

  if (status.error) {
    return <div className="state-card error">{label} could not be refreshed: {status.error}</div>;
  }

  return null;
}

export function Pagination({
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

export function MetricsSection({
  metrics,
  status
}: {
  metrics: AdminMetrics;
  status: SectionStatus;
}) {
  return (
    <>
      <section className="grid admin-metrics-grid" aria-label="Trust metrics overview">
        {status.loading || status.error ? (
          <SectionState label="Metrics" status={status} />
        ) : (
          <>
            <MetricCard label="Total users" value={metrics.totalUsers} helper="Registered clients and freelancers" />
            <MetricCard label="Active jobs" value={metrics.activeJobs} helper="Live marketplace work" />
            <MetricCard label="Open disputes" value={metrics.openDisputes} helper="Needs moderation" />
            <MetricCard label="Flagged listings" value={metrics.flaggedListings} helper="Review queue" />
            <MetricCard label="Revenue" value={formatRevenue(metrics.revenue)} helper="Current period" />
          </>
        )}
      </section>

      <section className="card">
        <SectionTitle
          eyebrow="Trust score"
          title="Distribution across the user base"
          description="Quick glance at healthy, at-risk, and low-trust cohorts."
        />
        {status.loading || status.error ? (
          <SectionState label="Trust score distribution" status={status} />
        ) : (
          <div className="trust-bars" aria-label="Trust score distribution chart">
            {metrics.trustScoreBuckets.map((bucket) => (
              <div key={bucket.label} className="trust-bar-row">
                <span>{bucket.label}</span>
                <div className="trust-bar-track">
                  <div className="trust-bar-fill" style={{ width: `${Math.min(bucket.count * 7, 100)}%` }} />
                </div>
                <strong>{bucket.count}</strong>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export function UsersSection({
  users,
  selectedUser,
  status,
  filters,
  draftFilters,
  setDraftFilters,
  onSubmit,
  onReset,
  isPending,
  onPrev,
  onNext,
  onSelectUser,
  onUserAction,
  busy
}: {
  users: TablePage<AdminUser>;
  selectedUser: AdminUser | null;
  status: SectionStatus;
  filters: UserFilters;
  draftFilters: UserFilters;
  setDraftFilters: Dispatch<SetStateAction<UserFilters>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  isPending: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSelectUser: (userId: string) => void;
  onUserAction: (userId: string, action: string) => void;
  busy: string | null;
}) {
  return (
    <section className="card">
      <SectionTitle
        eyebrow="User management"
        title="Searchable user table"
        description="Server-side filters and pagination keep the table bounded and reviewable."
      />
      <form className="filter-grid admin-filters" onSubmit={onSubmit}>
        <label>
          <span>Search users</span>
          <input
            aria-label="Search users"
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
            value={draftFilters.joinedAfter}
            onChange={(event) => setDraftFilters((current) => ({ ...current, joinedAfter: event.target.value }))}
          />
        </label>
        <label>
          <span>Join date before</span>
          <input
            aria-label="Join date before"
            value={draftFilters.joinedBefore}
            onChange={(event) => setDraftFilters((current) => ({ ...current, joinedBefore: event.target.value }))}
          />
        </label>
        <div className="filter-actions">
          <button className="admin-button" type="submit" disabled={isPending}>
            Apply filters
          </button>
          <button className="admin-button secondary" type="button" onClick={onReset} disabled={isPending}>
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
            {status.loading || status.error ? (
              <tr>
                <td colSpan={7}>
                  <SectionState label="User table" status={status} />
                </td>
              </tr>
            ) : users.items.length > 0 ? (
              users.items.map((user) => (
                <tr key={user.id} className={selectedUser?.id === user.id ? "row-selected" : undefined}>
                  <td>
                    <button className="text-button" type="button" onClick={() => onSelectUser(user.id)}>
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
                    <button className="admin-button secondary" type="button" onClick={() => onSelectUser(user.id)}>
                      View profile
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <EmptyState colspan={7} message="No users match the current filters." />
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={users.page} totalPages={users.totalPages} onPrev={onPrev} onNext={onNext} />

      {selectedUser && !status.loading && !status.error ? (
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
              onAction={(action) => onUserAction(selectedUser.id, action)}
              disabled={busy === `/api/admin/users/${selectedUser.id}`}
            />
          </article>
        </div>
      ) : null}
    </section>
  );
}

export function ModerationSection({
  jobs,
  status,
  onPrev,
  onNext,
  onJobAction,
  busy,
  isPending
}: {
  jobs: TablePage<AdminJob>;
  status: SectionStatus;
  onPrev: () => void;
  onNext: () => void;
  onJobAction: (jobId: string, action: string) => void;
  busy: string | null;
  isPending: boolean;
}) {
  return (
    <article className="card">
      <SectionTitle
        eyebrow="Moderation"
        title="Flagged listings queue"
        description="Approve, reject, or escalate items reported by automated rules or users."
      />
      {status.loading || status.error ? (
        <SectionState label="Moderation queue" status={status} />
      ) : (
        <div className="stack">
          {jobs.items.length > 0 ? (
            jobs.items.map((item) => (
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
                  onAction={(action) => onJobAction(item.id, action)}
                  disabled={busy === `/api/admin/jobs/${item.id}`}
                />
              </div>
            ))
          ) : (
            <EmptyState message="No flagged listings are waiting in this queue." />
          )}
        </div>
      )}
      <Pagination page={jobs.page} totalPages={jobs.totalPages} onPrev={onPrev} onNext={onNext} />
    </article>
  );
}

export function DisputesSection({
  disputes,
  selectedDispute,
  status,
  draftFilters,
  setDraftDisputeFilters,
  onSubmit,
  onReset,
  onPrev,
  onNext,
  onSelectDispute,
  onDisputeAction,
  busy,
  isPending
}: {
  disputes: TablePage<AdminDispute>;
  selectedDispute: AdminDispute | null;
  status: SectionStatus;
  draftFilters: DisputeFilters;
  setDraftDisputeFilters: Dispatch<SetStateAction<DisputeFilters>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSelectDispute: (disputeId: string) => void;
  onDisputeAction: (disputeId: string, action: string) => void;
  busy: string | null;
  isPending: boolean;
}) {
  return (
    <article className="card">
      <SectionTitle
        eyebrow="Disputes"
        title="Open dispute queue"
        description="Threads, evidence, and transaction details with one-click resolutions."
      />
      <form className="filter-grid admin-filters" onSubmit={onSubmit}>
        <label>
          <span>Status</span>
          <select
            aria-label="Filter dispute queue by status"
            value={draftFilters.status}
            onChange={(event) => setDraftDisputeFilters((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="under_review">Under review</option>
            <option value="resolved">Resolved</option>
          </select>
        </label>
        <div className="filter-actions">
          <button className="admin-button" type="submit" disabled={isPending}>
            Apply filters
          </button>
          <button className="admin-button secondary" type="button" onClick={onReset} disabled={isPending}>
            Reset
          </button>
        </div>
      </form>
      {status.loading || status.error ? (
        <SectionState label="Dispute queue" status={status} />
      ) : (
        <div className="stack">
          {disputes.items.length > 0 ? (
            disputes.items.map((dispute) => (
              <div
                key={dispute.id}
                className={`stack-item ${selectedDispute?.id === dispute.id ? "row-selected" : ""}`}
              >
                <div>
                  <button className="text-button" type="button" onClick={() => onSelectDispute(dispute.id)}>
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
                  onAction={(action) => onDisputeAction(dispute.id, action)}
                  disabled={busy === `/api/admin/disputes/${dispute.id}`}
                />
              </div>
            ))
          ) : (
            <EmptyState message="No disputes match the current filter state." />
          )}
        </div>
      )}
      <Pagination page={disputes.page} totalPages={disputes.totalPages} onPrev={onPrev} onNext={onNext} />
      {selectedDispute && !status.loading && !status.error ? (
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
  );
}

export function PlatformControlsSection({
  settings,
  status,
  onSettingChange,
  busy
}: {
  settings: AdminSettings;
  status: SectionStatus;
  onSettingChange: (setting: keyof AdminSettings, next: boolean) => void;
  busy: string | null;
}) {
  return (
    <article className="card">
      <SectionTitle
        eyebrow="Platform controls"
        title="Registration and posting toggles"
        description="Confirmation-first controls for changing platform behavior."
      />
      {status.loading || status.error ? (
        <SectionState label="Platform controls" status={status} />
      ) : (
        <div className="toggle-grid">
          <label className="toggle-item">
            <span>Enable new registrations</span>
            <ConfirmToggle
              label="new registrations"
              enabled={settings.registrationsEnabled}
              onChange={(next) => onSettingChange("registrationsEnabled", next)}
              disabled={busy === "/api/admin/settings"}
            />
          </label>
          <label className="toggle-item">
            <span>Enable new job postings</span>
            <ConfirmToggle
              label="new job postings"
              enabled={settings.jobPostingsEnabled}
              onChange={(next) => onSettingChange("jobPostingsEnabled", next)}
              disabled={busy === "/api/admin/settings"}
            />
          </label>
        </div>
      )}
    </article>
  );
}

export function AuditLogSection({
  auditLog,
  status,
  draftFilters,
  setDraftAuditFilters,
  onSubmit,
  onReset,
  onPrev,
  onNext,
  isPending
}: {
  auditLog: TablePage<AdminAuditEntry>;
  status: SectionStatus;
  draftFilters: AuditFilters;
  setDraftAuditFilters: Dispatch<SetStateAction<AuditFilters>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  onPrev: () => void;
  onNext: () => void;
  isPending: boolean;
}) {
  return (
    <article className="card">
      <SectionTitle
        eyebrow="Audit log"
        title="Append-only admin actions"
        description="Bans, rulings, toggles, and moderation actions are recorded for review."
      />
      <form className="filter-grid admin-filters" onSubmit={onSubmit}>
        <label>
          <span>Admin</span>
          <input
            aria-label="Filter audit log by admin"
            value={draftFilters.admin}
            onChange={(event) => setDraftAuditFilters((current) => ({ ...current, admin: event.target.value }))}
          />
        </label>
        <label>
          <span>Action</span>
          <input
            aria-label="Filter audit log by action"
            value={draftFilters.action}
            onChange={(event) => setDraftAuditFilters((current) => ({ ...current, action: event.target.value }))}
          />
        </label>
        <label>
          <span>From</span>
          <input
            aria-label="Audit log from date"
            value={draftFilters.from}
            onChange={(event) => setDraftAuditFilters((current) => ({ ...current, from: event.target.value }))}
          />
        </label>
        <label>
          <span>To</span>
          <input
            aria-label="Audit log to date"
            value={draftFilters.to}
            onChange={(event) => setDraftAuditFilters((current) => ({ ...current, to: event.target.value }))}
          />
        </label>
        <div className="filter-actions">
          <button className="admin-button" type="submit" disabled={isPending}>
            Apply filters
          </button>
          <button className="admin-button secondary" type="button" onClick={onReset} disabled={isPending}>
            Reset
          </button>
        </div>
      </form>
      {status.loading || status.error ? (
        <SectionState label="Audit log" status={status} />
      ) : (
        <div className="stack">
          {auditLog.items.length > 0 ? (
            auditLog.items.map((entry) => (
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
            ))
          ) : (
            <EmptyState message="No audit events match these filters." />
          )}
        </div>
      )}
      <Pagination page={auditLog.page} totalPages={auditLog.totalPages} onPrev={onPrev} onNext={onNext} />
    </article>
  );
}

export function NotificationsSection({
  notifications,
  status,
  onPrev,
  onNext
}: {
  notifications: TablePage<AdminNotification>;
  status: SectionStatus;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <article className="card">
      <SectionTitle
        eyebrow="Notifications"
        title="Action outcomes"
        description="Rejected listings and dispute rulings generate notification records for the affected parties."
      />
      {status.loading || status.error ? (
        <SectionState label="Notifications" status={status} />
      ) : (
        <div className="stack">
          {notifications.items.length > 0 ? (
            notifications.items.map((notification) => (
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
            ))
          ) : (
            <EmptyState message="No notification records are available for this page." />
          )}
        </div>
      )}
      <Pagination page={notifications.page} totalPages={notifications.totalPages} onPrev={onPrev} onNext={onNext} />
    </article>
  );
}
