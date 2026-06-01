"use client";

import { type ReactNode, useMemo, useState } from "react";

type UserRole = "client" | "freelancer";
type UserStatus = "active" | "suspended" | "banned";
type ListingStatus = "pending" | "escalated" | "approved" | "rejected";
type DisputeStatus = "open" | "under_review" | "resolved";
type DisputeRuling = "client" | "freelancer" | "refund" | "escalate";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
  trustScore: number;
  activeJobs: string[];
  disputeHistory: string[];
};

export type FlaggedListing = {
  id: string;
  jobId: string;
  title: string;
  reporter: string;
  reason: string;
  status: ListingStatus;
  ownerId: string;
};

export type AdminDispute = {
  id: string;
  title: string;
  amount: number;
  status: DisputeStatus;
  thread: string[];
  ruling?: DisputeRuling;
};

export type PlatformControls = {
  registrationsEnabled: boolean;
  jobPostingsEnabled: boolean;
  updatedAt: string;
  updatedBy: string;
};

export type AuditEntry = {
  id: string;
  adminId: string;
  actionType: string;
  targetType: string;
  targetId: string;
  message: string;
  createdAt: string;
};

export type AdminPanelData = {
  users: AdminUser[];
  flaggedListings: FlaggedListing[];
  disputes: AdminDispute[];
  controls: PlatformControls;
  auditEntries: AuditEntry[];
};

type AdminPanelClientProps = {
  initialData: AdminPanelData;
};

const adminId = "admin.local";

function StatusBadge({ value }: { value: string }) {
  return <span className={`admin-badge admin-badge-${value.replace("_", "-")}`}>{value}</span>;
}

function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="admin-section" aria-labelledby={title.replaceAll(" ", "-").toLowerCase()}>
      <div className="admin-section-header">
        <h2 id={title.replaceAll(" ", "-").toLowerCase()}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function formatTime(value: string) {
  return new Date(value).toISOString().slice(11, 19);
}

function trustRange(score: number) {
  if (score < 50) {
    return "0-49";
  }
  if (score < 70) {
    return "50-69";
  }
  if (score < 90) {
    return "70-89";
  }
  return "90-100";
}

function emptyAudit(): AuditEntry[] {
  return [];
}

export default function AdminPanelClient({ initialData }: AdminPanelClientProps) {
  const [users, setUsers] = useState(initialData.users);
  const [flaggedListings, setFlaggedListings] = useState(initialData.flaggedListings);
  const [disputes, setDisputes] = useState(initialData.disputes);
  const [controls, setControls] = useState(initialData.controls);
  const [auditEntries, setAuditEntries] = useState(initialData.auditEntries);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [auditAdminFilter, setAuditAdminFilter] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(initialData.users[0]?.id ?? "");
  const [activityMessage, setActivityMessage] = useState("Dashboard ready");
  const [refreshedAt, setRefreshedAt] = useState(initialData.controls.updatedAt);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0];

  const metrics = useMemo(() => {
    const activeJobs = users.reduce((total, user) => total + user.activeJobs.length, 0);
    const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
    const activeListings = flaggedListings.filter((listing) => listing.status !== "approved").length;
    const revenue = disputes.reduce((total, dispute) => total + dispute.amount, 0);

    return [
      ["Total users", String(users.length)],
      ["Active jobs", String(activeJobs)],
      ["Open disputes", String(openDisputes)],
      ["Flagged listings", String(activeListings)],
      ["Revenue", formatCurrency(revenue)]
    ];
  }, [disputes, flaggedListings, users]);

  const trustDistribution = useMemo(() => {
    const ranges = ["0-49", "50-69", "70-89", "90-100"];
    return ranges.map((range) => ({
      range,
      count: users.filter((user) => trustRange(user.trustScore) === range).length
    }));
  }, [users]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = !term || [user.name, user.email, user.id].some((value) => value.toLowerCase().includes(term));
      const matchesRole = !roleFilter || user.role === roleFilter;
      const matchesStatus = !statusFilter || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roleFilter, search, statusFilter, users]);

  const filteredAuditEntries = useMemo(() => {
    return auditEntries.filter((entry) => {
      const matchesAdmin = !auditAdminFilter || entry.adminId.toLowerCase().includes(auditAdminFilter.toLowerCase());
      const matchesAction = !auditActionFilter || entry.actionType.toLowerCase().includes(auditActionFilter.toLowerCase());
      return matchesAdmin && matchesAction;
    });
  }, [auditActionFilter, auditAdminFilter, auditEntries]);

  function appendAudit(actionType: string, targetType: string, targetId: string, message: string) {
    const createdAt = new Date().toISOString();
    const entry: AuditEntry = {
      id: `aud_${createdAt}_${actionType}_${targetId}`,
      adminId,
      actionType,
      targetType,
      targetId,
      message,
      createdAt
    };
    setAuditEntries((entries) => [entry, ...entries]);
  }

  function refreshDashboard() {
    setIsRefreshing(true);
    window.setTimeout(() => {
      const now = new Date().toISOString();
      setRefreshedAt(now);
      setActivityMessage(`Dashboard refreshed at ${formatTime(now)}`);
      setIsRefreshing(false);
    }, 150);
  }

  function updateUserStatus(userId: string, status: UserStatus) {
    const user = users.find((candidate) => candidate.id === userId);
    if (!user) {
      return;
    }

    setUsers((currentUsers) => currentUsers.map((candidate) => (
      candidate.id === userId ? { ...candidate, status } : candidate
    )));
    appendAudit(`user.${status}`, "user", userId, `${user.name} set to ${status}`);
    setActivityMessage(`${user.name} is now ${status}`);
  }

  function moderateListing(listingId: string, status: ListingStatus) {
    const listing = flaggedListings.find((candidate) => candidate.id === listingId);
    if (!listing) {
      return;
    }

    setFlaggedListings((currentListings) => currentListings.map((candidate) => (
      candidate.id === listingId ? { ...candidate, status } : candidate
    )));
    appendAudit(`listing.${status}`, "flagged_listing", listingId, `${listing.title} marked ${status}`);
    setActivityMessage(`${listing.id} marked ${status}`);
  }

  function ruleDispute(disputeId: string, ruling: DisputeRuling) {
    const dispute = disputes.find((candidate) => candidate.id === disputeId);
    if (!dispute) {
      return;
    }

    const nextStatus: DisputeStatus = ruling === "escalate" ? "under_review" : "resolved";
    setDisputes((currentDisputes) => currentDisputes.map((candidate) => (
      candidate.id === disputeId ? { ...candidate, ruling, status: nextStatus } : candidate
    )));
    appendAudit(`dispute.${ruling}`, "dispute", disputeId, `${dispute.id} ruling recorded: ${ruling}`);
    setActivityMessage(`${dispute.id} ruling recorded: ${ruling}`);
  }

  function updateControl(control: "registrationsEnabled" | "jobPostingsEnabled", enabled: boolean) {
    const label = control === "registrationsEnabled" ? "registrations" : "job postings";
    if (!enabled && !window.confirm(`Disable ${label}? This will be recorded in the audit log.`)) {
      return;
    }

    const now = new Date().toISOString();
    setControls((currentControls) => ({
      ...currentControls,
      [control]: enabled,
      updatedAt: now,
      updatedBy: adminId
    }));
    appendAudit("platform.controls.updated", "platform", control, `${label} ${enabled ? "enabled" : "disabled"}`);
    setActivityMessage(`${label} ${enabled ? "enabled" : "disabled"}`);
  }

  return (
    <div className="admin-shell">
      <header className="admin-hero">
        <div>
          <p className="admin-kicker">Admin workspace</p>
          <h1>Platform control center</h1>
          <p>Review users, flagged jobs, disputes, trust signals, controls, and audit history from one keyboard-accessible panel.</p>
          <p className="admin-live-status" role="status">{activityMessage}</p>
        </div>
        <button className="admin-button" type="button" onClick={refreshDashboard} disabled={isRefreshing}>
          {isRefreshing ? "Refreshing" : "Refresh"}
        </button>
      </header>

      <section className="admin-metrics" aria-label="Platform metrics">
        {metrics.map(([label, value]) => (
          <article className="admin-metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <Section title="Trust distribution">
        <div className="admin-bars" role="list" aria-label="Trust score distribution chart">
          {trustDistribution.map(({ range, count }) => (
            <div className="admin-bar-row" role="listitem" key={range}>
              <span>{range}</span>
              <div className="admin-bar-track" aria-label={`${count} users in trust score range ${range}`}>
                <div className="admin-bar-fill" style={{ width: `${count * 25}%` }} />
              </div>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </Section>

      <Section title="User management" action={<span className="admin-section-meta">{filteredUsers.length} shown</span>}>
        <div className="admin-filters" aria-label="User filters">
          <label>
            Search
            <input aria-label="Search users" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email, or id" />
          </label>
          <label>
            Role
            <select aria-label="Filter users by role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              <option value="">All</option>
              <option value="client">Client</option>
              <option value="freelancer">Freelancer</option>
            </select>
          </label>
          <label>
            Status
            <select aria-label="Filter users by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </label>
        </div>

        {filteredUsers.length === 0 ? (
          <p className="admin-empty">No users match the selected filters.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Trust</th>
                <th>Active jobs</th>
                <th>Disputes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <button className="admin-link-button" type="button" onClick={() => setSelectedUserId(user.id)}>
                      {user.name}
                    </button>
                    <span className="admin-muted">{user.email}</span>
                  </td>
                  <td>{user.role}</td>
                  <td><StatusBadge value={user.status} /></td>
                  <td>{user.trustScore}</td>
                  <td>{user.activeJobs.join(", ") || "-"}</td>
                  <td>{user.disputeHistory.join(", ") || "-"}</td>
                  <td className="admin-actions">
                    <button type="button" onClick={() => setSelectedUserId(user.id)} aria-label={`View ${user.name} profile`}>View</button>
                    <button type="button" onClick={() => updateUserStatus(user.id, "suspended")} aria-label={`Suspend ${user.name}`}>Suspend</button>
                    <button type="button" onClick={() => updateUserStatus(user.id, "active")} aria-label={`Reinstate ${user.name}`}>Reinstate</button>
                    <button type="button" onClick={() => updateUserStatus(user.id, "banned")} aria-label={`Permanently ban ${user.name}`}>Ban</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {selectedUser ? (
          <aside className="admin-inline-detail" aria-label="Selected user detail">
            <strong>{selectedUser.name}</strong>
            <span>{selectedUser.id}</span>
            <span>Joined {formatDate(selectedUser.joinedAt)}</span>
            <span>{selectedUser.activeJobs.length} active jobs</span>
            <span>{selectedUser.disputeHistory.length} dispute records</span>
          </aside>
        ) : null}
      </Section>

      <Section title="Job moderation">
        <div className="admin-card-grid">
          {flaggedListings.map((listing) => (
            <article className="admin-card" key={listing.id}>
              <div>
                <span>{listing.id}</span>
                <h3>{listing.title}</h3>
                <p>{listing.reason}</p>
                <p className="admin-muted">Reporter: {listing.reporter}</p>
              </div>
              <StatusBadge value={listing.status} />
              <div className="admin-actions">
                <button type="button" onClick={() => moderateListing(listing.id, "approved")} aria-label={`Approve ${listing.id}`}>Approve</button>
                <button type="button" onClick={() => moderateListing(listing.id, "rejected")} aria-label={`Reject ${listing.id}`}>Reject</button>
                <button type="button" onClick={() => moderateListing(listing.id, "escalated")} aria-label={`Escalate ${listing.id}`}>Escalate</button>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Dispute resolution">
        <div className="admin-card-grid">
          {disputes.map((dispute) => (
            <article className="admin-card" key={dispute.id}>
              <div>
                <span>{dispute.id}</span>
                <h3>{dispute.title}</h3>
                <p>Transaction value: {formatCurrency(dispute.amount)}</p>
                <ul className="admin-thread">
                  {dispute.thread.map((message) => <li key={message}>{message}</li>)}
                </ul>
              </div>
              <StatusBadge value={dispute.status} />
              <div className="admin-actions">
                <button type="button" onClick={() => ruleDispute(dispute.id, "client")} aria-label={`Rule for client on ${dispute.id}`}>Client</button>
                <button type="button" onClick={() => ruleDispute(dispute.id, "freelancer")} aria-label={`Rule for freelancer on ${dispute.id}`}>Freelancer</button>
                <button type="button" onClick={() => ruleDispute(dispute.id, "refund")} aria-label={`Trigger refund for ${dispute.id}`}>Refund</button>
                <button type="button" onClick={() => ruleDispute(dispute.id, "escalate")} aria-label={`Escalate ${dispute.id}`}>Escalate</button>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Platform controls" action={<span className="admin-section-meta">Updated {formatTime(controls.updatedAt)}</span>}>
        <div className="admin-controls">
          <label>
            <input
              type="checkbox"
              checked={controls.registrationsEnabled}
              onChange={(event) => updateControl("registrationsEnabled", event.target.checked)}
              aria-label="Enable new user registrations"
            />
            New user registrations
          </label>
          <label>
            <input
              type="checkbox"
              checked={controls.jobPostingsEnabled}
              onChange={(event) => updateControl("jobPostingsEnabled", event.target.checked)}
              aria-label="Enable new job postings"
            />
            New job postings
          </label>
          <p>Last changed by {controls.updatedBy}. Current dashboard refresh: {formatTime(refreshedAt)}.</p>
        </div>
      </Section>

      <Section title="Audit log" action={<span className="admin-section-meta">{filteredAuditEntries.length} entries</span>}>
        <div className="admin-filters" aria-label="Audit log filters">
          <label>
            Admin
            <input aria-label="Filter audit log by admin" value={auditAdminFilter} onChange={(event) => setAuditAdminFilter(event.target.value)} placeholder="admin id" />
          </label>
          <label>
            Action
            <input aria-label="Filter audit log by action type" value={auditActionFilter} onChange={(event) => setAuditActionFilter(event.target.value)} placeholder="action type" />
          </label>
          <button className="admin-button admin-secondary-button" type="button" onClick={() => setAuditEntries(emptyAudit())}>
            Clear local log
          </button>
        </div>
        {filteredAuditEntries.length === 0 ? (
          <p className="admin-empty">No audit entries match the selected filters.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Admin</th>
                <th>Action</th>
                <th>Target</th>
                <th>Message</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredAuditEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.adminId}</td>
                  <td>{entry.actionType}</td>
                  <td>{entry.targetType}:{entry.targetId}</td>
                  <td>{entry.message}</td>
                  <td>{formatTime(entry.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
}
