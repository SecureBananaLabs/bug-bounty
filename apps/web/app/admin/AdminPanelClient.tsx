"use client";

import { useMemo, useState } from "react";
import type {
  AdminDispute,
  AdminPanelData,
  AdminUser,
  AuditEntry,
  FlagStatus,
  PlatformControl,
  UserRole,
  UserStatus
} from "../../lib/adminMock";

type TabId = "overview" | "users" | "moderation" | "disputes" | "controls" | "audit";
type RoleFilter = "all" | UserRole;
type StatusFilter = "all" | UserStatus;

const tabs: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "moderation", label: "Moderation" },
  { id: "disputes", label: "Disputes" },
  { id: "controls", label: "Controls" },
  { id: "audit", label: "Audit" }
];

export function AdminPanelClient({ initialData }: { initialData: AdminPanelData }) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [users, setUsers] = useState(initialData.users);
  const [flaggedJobs, setFlaggedJobs] = useState(initialData.flaggedJobs);
  const [disputes, setDisputes] = useState(initialData.disputes);
  const [controls, setControls] = useState(initialData.controls);
  const [auditLog, setAuditLog] = useState(initialData.auditLog);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [moderationStatus, setModerationStatus] = useState<"all" | FlagStatus>("all");
  const [auditAction, setAuditAction] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const metrics = useMemo(() => {
    const activeJobs = users.reduce((sum, user) => sum + user.activeJobs, 0);
    const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
    const flaggedListings = flaggedJobs.filter((job) => job.status !== "approved").length;
    const trustBands = [
      { label: "0-39", count: users.filter((user) => user.trustScore < 40).length },
      { label: "40-69", count: users.filter((user) => user.trustScore >= 40 && user.trustScore < 70).length },
      { label: "70-89", count: users.filter((user) => user.trustScore >= 70 && user.trustScore < 90).length },
      { label: "90-100", count: users.filter((user) => user.trustScore >= 90).length }
    ];

    return {
      totalUsers: users.length,
      activeJobs,
      openDisputes,
      flaggedListings,
      revenue: "$128.9k",
      trustBands
    };
  }, [users, disputes, flaggedJobs]);

  const filteredUsers = useMemo(() => {
    const query = userSearch.toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, userSearch, roleFilter, statusFilter]);

  const filteredFlags = useMemo(
    () => flaggedJobs.filter((job) => moderationStatus === "all" || job.status === moderationStatus),
    [flaggedJobs, moderationStatus]
  );

  const filteredAudit = useMemo(
    () => auditLog.filter((entry) => auditAction === "all" || entry.action === auditAction),
    [auditLog, auditAction]
  );

  const auditActions = useMemo(() => ["all", ...Array.from(new Set(auditLog.map((entry) => entry.action)))], [auditLog]);

  function recordAudit(action: string, target: string, details: string) {
    const entry: AuditEntry = {
      id: `aud_${Date.now()}`,
      adminId: initialData.session.id,
      action,
      target,
      details,
      createdAt: new Date().toISOString()
    };
    setAuditLog((current) => [entry, ...current]);
  }

  function updateUserStatus(userId: string, status: UserStatus) {
    setUsers((current) => current.map((user) => (user.id === userId ? { ...user, status } : user)));
    recordAudit(status === "active" ? "user.reinstate" : `user.${status}`, userId, `Set user status to ${status}.`);
  }

  function decideFlag(flagId: string, status: FlagStatus) {
    setFlaggedJobs((current) => current.map((job) => (job.id === flagId ? { ...job, status } : job)));
    recordAudit(`job.${status}`, flagId, `Moderation decision changed to ${status}.`);
  }

  function ruleDispute(disputeId: string, ruling: string) {
    setDisputes((current) =>
      current.map((dispute) =>
        dispute.id === disputeId
          ? { ...dispute, ruling, status: ruling === "escalate" ? "under_review" : "resolved" }
          : dispute
      )
    );
    recordAudit(`dispute.${ruling}`, disputeId, `Applied ${ruling} ruling and notified both parties.`);
  }

  function toggleControl(control: PlatformControl) {
    const nextState = !control.enabled;
    const confirmed = window.confirm(`${nextState ? "Enable" : "Disable"} ${control.label}?`);
    if (!confirmed) {
      return;
    }

    setControls((current) =>
      current.map((entry) =>
        entry.id === control.id
          ? {
              ...entry,
              enabled: nextState,
              updatedBy: initialData.session.id,
              updatedAt: new Date().toISOString()
            }
          : entry
      )
    );
    recordAudit(`platform.${control.id}`, control.id, `${control.label} ${nextState ? "enabled" : "disabled"}.`);
  }

  function refreshData() {
    setIsRefreshing(true);
    window.setTimeout(() => setIsRefreshing(false), 500);
    recordAudit("panel.refresh", "admin-panel", "Manual admin panel refresh completed.");
  }

  return (
    <section className="admin-panel">
      <div className="admin-header">
        <div>
          <p className="admin-kicker">Admin Console</p>
          <h2>Trust and Operations</h2>
        </div>
        <button className="admin-button admin-button-primary" type="button" onClick={refreshData}>
          {isRefreshing ? "Refreshing" : "Refresh"}
        </button>
      </div>

      <div aria-label="Admin views" className="admin-tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            aria-selected={activeTab === tab.id}
            className={`admin-tab ${activeTab === tab.id ? "admin-tab-active" : ""}`}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && <Overview metrics={metrics} controls={controls} />}
      {activeTab === "users" && (
        <UsersView
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          userSearch={userSearch}
          users={filteredUsers}
          onRoleFilter={setRoleFilter}
          onSearch={setUserSearch}
          onStatusFilter={setStatusFilter}
          onUpdateStatus={updateUserStatus}
        />
      )}
      {activeTab === "moderation" && (
        <ModerationView
          flaggedJobs={filteredFlags}
          moderationStatus={moderationStatus}
          onDecision={decideFlag}
          onStatusFilter={setModerationStatus}
        />
      )}
      {activeTab === "disputes" && <DisputesView disputes={disputes} onRuling={ruleDispute} />}
      {activeTab === "controls" && <ControlsView controls={controls} onToggle={toggleControl} />}
      {activeTab === "audit" && (
        <AuditView actionFilter={auditAction} actions={auditActions} auditLog={filteredAudit} onActionFilter={setAuditAction} />
      )}
    </section>
  );
}

function Overview({
  controls,
  metrics
}: {
  controls: PlatformControl[];
  metrics: {
    totalUsers: number;
    activeJobs: number;
    openDisputes: number;
    flaggedListings: number;
    revenue: string;
    trustBands: { label: string; count: number }[];
  };
}) {
  const maxTrustBand = Math.max(...metrics.trustBands.map((band) => band.count), 1);

  return (
    <div className="admin-stack">
      <div className="admin-summary-grid">
        <MetricCard label="Total users" value={metrics.totalUsers} />
        <MetricCard label="Active jobs" value={metrics.activeJobs} />
        <MetricCard label="Open disputes" value={metrics.openDisputes} tone="warn" />
        <MetricCard label="Flagged listings" value={metrics.flaggedListings} tone="danger" />
        <MetricCard label="Revenue period" value={metrics.revenue} tone="success" />
      </div>

      <section className="admin-band">
        <div className="admin-section-heading">
          <h3>Trust Score Distribution</h3>
        </div>
        <div className="admin-chart">
          {metrics.trustBands.map((band) => (
            <div className="admin-bar-row" key={band.label}>
              <span>{band.label}</span>
              <div className="admin-bar-track">
                <div className="admin-bar-fill" style={{ width: `${(band.count / maxTrustBand) * 100}%` }} />
              </div>
              <strong>{band.count}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-band">
        <div className="admin-section-heading">
          <h3>Platform State</h3>
        </div>
        <div className="admin-control-grid">
          {controls.map((control) => (
            <div className="admin-control-row" key={control.id}>
              <span>{control.label}</span>
              <span className={`admin-badge ${control.enabled ? "admin-badge-success" : "admin-badge-danger"}`}>
                {control.enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, tone = "neutral", value }: { label: string; tone?: string; value: number | string }) {
  return (
    <article className={`admin-metric admin-metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function UsersView({
  onRoleFilter,
  onSearch,
  onStatusFilter,
  onUpdateStatus,
  roleFilter,
  statusFilter,
  userSearch,
  users
}: {
  onRoleFilter: (role: RoleFilter) => void;
  onSearch: (search: string) => void;
  onStatusFilter: (status: StatusFilter) => void;
  onUpdateStatus: (userId: string, status: UserStatus) => void;
  roleFilter: RoleFilter;
  statusFilter: StatusFilter;
  userSearch: string;
  users: AdminUser[];
}) {
  return (
    <section className="admin-band">
      <div className="admin-section-heading">
        <h3>User Management</h3>
        <div className="admin-filters">
          <input
            aria-label="Search users"
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search users"
            value={userSearch}
          />
          <select aria-label="Role filter" onChange={(event) => onRoleFilter(event.target.value as RoleFilter)} value={roleFilter}>
            <option value="all">All roles</option>
            <option value="client">Clients</option>
            <option value="freelancer">Freelancers</option>
            <option value="admin">Admins</option>
          </select>
          <select
            aria-label="Status filter"
            onChange={(event) => onStatusFilter(event.target.value as StatusFilter)}
            value={statusFilter}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>

      {users.length === 0 ? (
        <EmptyState label="No users match the current filters." />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Trust</th>
                <th>Jobs</th>
                <th>Disputes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </td>
                  <td>{user.role}</td>
                  <td>
                    <StatusBadge value={user.status} />
                  </td>
                  <td>{user.joinedAt}</td>
                  <td>{user.trustScore}</td>
                  <td>{user.activeJobs}</td>
                  <td>{user.disputes}</td>
                  <td>
                    <div className="admin-actions">
                      <button className="admin-button" onClick={() => onUpdateStatus(user.id, "suspended")} type="button">
                        Suspend
                      </button>
                      <button className="admin-button" onClick={() => onUpdateStatus(user.id, "active")} type="button">
                        Reinstate
                      </button>
                      <button className="admin-button admin-button-danger" onClick={() => onUpdateStatus(user.id, "banned")} type="button">
                        Ban
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ModerationView({
  flaggedJobs,
  moderationStatus,
  onDecision,
  onStatusFilter
}: {
  flaggedJobs: AdminPanelData["flaggedJobs"];
  moderationStatus: "all" | FlagStatus;
  onDecision: (flagId: string, status: FlagStatus) => void;
  onStatusFilter: (status: "all" | FlagStatus) => void;
}) {
  return (
    <section className="admin-band">
      <div className="admin-section-heading">
        <h3>Job Moderation</h3>
        <select
          aria-label="Moderation status filter"
          onChange={(event) => onStatusFilter(event.target.value as "all" | FlagStatus)}
          value={moderationStatus}
        >
          <option value="all">All flags</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="escalated">Escalated</option>
        </select>
      </div>

      {flaggedJobs.length === 0 ? (
        <EmptyState label="No listings match this moderation state." />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Listing</th>
                <th>Client</th>
                <th>Reason</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {flaggedJobs.map((job) => (
                <tr key={job.id}>
                  <td>
                    <strong>{job.title}</strong>
                    <span>{job.jobId}</span>
                  </td>
                  <td>{job.client}</td>
                  <td>{job.reason}</td>
                  <td>
                    <StatusBadge value={job.severity} />
                  </td>
                  <td>
                    <StatusBadge value={job.status} />
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button className="admin-button" onClick={() => onDecision(job.id, "approved")} type="button">
                        Approve
                      </button>
                      <button className="admin-button admin-button-danger" onClick={() => onDecision(job.id, "rejected")} type="button">
                        Reject
                      </button>
                      <button className="admin-button" onClick={() => onDecision(job.id, "escalated")} type="button">
                        Escalate
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function DisputesView({
  disputes,
  onRuling
}: {
  disputes: AdminDispute[];
  onRuling: (disputeId: string, ruling: string) => void;
}) {
  return (
    <section className="admin-band">
      <div className="admin-section-heading">
        <h3>Dispute Resolution</h3>
      </div>
      <div className="admin-dispute-grid">
        {disputes.map((dispute) => (
          <article className="admin-dispute" key={dispute.id}>
            <div className="admin-dispute-top">
              <div>
                <h4>{dispute.jobTitle}</h4>
                <p>
                  {dispute.client} vs {dispute.freelancer}
                </p>
              </div>
              <StatusBadge value={dispute.status} />
            </div>
            <dl className="admin-definition-grid">
              <div>
                <dt>Amount</dt>
                <dd>${dispute.amount.toLocaleString()}</dd>
              </div>
              <div>
                <dt>Evidence</dt>
                <dd>{dispute.evidenceCount}</dd>
              </div>
              <div>
                <dt>Transaction</dt>
                <dd>{dispute.transactionId}</dd>
              </div>
            </dl>
            <div className="admin-thread">
              {dispute.thread.map((message) => (
                <p key={message}>{message}</p>
              ))}
            </div>
            <div className="admin-actions">
              <button className="admin-button" onClick={() => onRuling(dispute.id, "client")} type="button">
                Client
              </button>
              <button className="admin-button" onClick={() => onRuling(dispute.id, "freelancer")} type="button">
                Freelancer
              </button>
              <button className="admin-button" onClick={() => onRuling(dispute.id, "refund")} type="button">
                Refund
              </button>
              <button className="admin-button admin-button-danger" onClick={() => onRuling(dispute.id, "escalate")} type="button">
                Escalate
              </button>
            </div>
            {dispute.ruling && <p className="admin-note">Ruling: {dispute.ruling}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}

function ControlsView({
  controls,
  onToggle
}: {
  controls: PlatformControl[];
  onToggle: (control: PlatformControl) => void;
}) {
  return (
    <section className="admin-band">
      <div className="admin-section-heading">
        <h3>Platform Controls</h3>
      </div>
      <div className="admin-control-grid">
        {controls.map((control) => (
          <div className="admin-control-row" key={control.id}>
            <div>
              <strong>{control.label}</strong>
              <span>
                Updated by {control.updatedBy} at {formatDate(control.updatedAt)}
              </span>
            </div>
            <button
              aria-pressed={control.enabled}
              className={`admin-toggle ${control.enabled ? "admin-toggle-on" : ""}`}
              onClick={() => onToggle(control)}
              type="button"
            >
              {control.enabled ? "On" : "Off"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function AuditView({
  actionFilter,
  actions,
  auditLog,
  onActionFilter
}: {
  actionFilter: string;
  actions: string[];
  auditLog: AuditEntry[];
  onActionFilter: (action: string) => void;
}) {
  return (
    <section className="admin-band">
      <div className="admin-section-heading">
        <h3>Audit Log</h3>
        <select aria-label="Audit action filter" onChange={(event) => onActionFilter(event.target.value)} value={actionFilter}>
          {actions.map((action) => (
            <option key={action} value={action}>
              {action === "all" ? "All actions" : action}
            </option>
          ))}
        </select>
      </div>

      {auditLog.length === 0 ? (
        <EmptyState label="No audit events match this filter." />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
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
              {auditLog.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatDate(entry.createdAt)}</td>
                  <td>{entry.adminId}</td>
                  <td>{entry.action}</td>
                  <td>{entry.target}</td>
                  <td>{entry.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function StatusBadge({ value }: { value: string }) {
  const tone =
    value === "active" || value === "approved" || value === "low" || value === "resolved"
      ? "success"
      : value === "pending" || value === "medium" || value === "under_review" || value === "suspended"
        ? "warn"
        : "danger";

  return <span className={`admin-badge admin-badge-${tone}`}>{value.replace("_", " ")}</span>;
}

function EmptyState({ label }: { label: string }) {
  return <p className="admin-empty">{label}</p>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
