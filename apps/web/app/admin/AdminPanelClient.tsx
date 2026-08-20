"use client";

import { useMemo, useState } from "react";
import type { AdminSnapshot, AdminUser, AuditEntry, Dispute, FlaggedListing, PlatformControl } from "./adminData";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const pageSize = 4;

type LoadingState = "idle" | "loading" | "error";

function formatCents(cents: number) {
  return money.format(cents / 100);
}

function statusClass(status: string) {
  return `status status-${status.replace("_", "-")}`;
}

function nextAuditEntry(action: string, targetType: string, targetId: string, reason: string, count: number): AuditEntry {
  return {
    id: `aud_${String(count + 1).padStart(3, "0")}`,
    adminId: "adm_001",
    action,
    targetType,
    targetId,
    reason,
    createdAt: new Date().toISOString()
  };
}

export default function AdminPanelClient({ initialSnapshot }: { initialSnapshot: AdminSnapshot }) {
  const [users, setUsers] = useState(initialSnapshot.users);
  const [flaggedListings, setFlaggedListings] = useState(initialSnapshot.flaggedListings);
  const [disputes, setDisputes] = useState(initialSnapshot.disputes);
  const [controls, setControls] = useState(initialSnapshot.controls);
  const [auditLog, setAuditLog] = useState(initialSnapshot.auditLog);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [joinedAfter, setJoinedAfter] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState(initialSnapshot.users[0]?.id ?? "");
  const [selectedDisputeId, setSelectedDisputeId] = useState(initialSnapshot.disputes[0]?.id ?? "");
  const [auditActionFilter, setAuditActionFilter] = useState("all");
  const [auditAdminFilter, setAuditAdminFilter] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(new Date().toLocaleTimeString());
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");

  const metrics = useMemo(
    () => ({
      totalUsers: users.length,
      activeJobs: initialSnapshot.metrics.activeJobs,
      openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
      flaggedListings: flaggedListings.filter((listing) => listing.status === "flagged").length,
      revenueCurrentPeriod: initialSnapshot.metrics.revenueCurrentPeriod
    }),
    [users, disputes, flaggedListings, initialSnapshot.metrics.activeJobs, initialSnapshot.metrics.revenueCurrentPeriod]
  );

  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users.filter((user) => {
      const joinedAt = new Date(user.joinedAt);
      return (
        (!needle || `${user.name} ${user.id} ${user.headline}`.toLowerCase().includes(needle)) &&
        (roleFilter === "all" || user.role === roleFilter) &&
        (statusFilter === "all" || user.status === statusFilter) &&
        (!joinedAfter || joinedAt >= new Date(joinedAfter))
      );
    });
  }, [users, query, roleFilter, statusFilter, joinedAfter]);

  const totalUserPages = Math.max(Math.ceil(filteredUsers.length / pageSize), 1);
  const visibleUsers = filteredUsers.slice((userPage - 1) * pageSize, userPage * pageSize);
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0];
  const selectedDispute = disputes.find((dispute) => dispute.id === selectedDisputeId) ?? disputes[0];

  const filteredAuditLog = useMemo(
    () =>
      auditLog.filter(
        (entry) =>
          (auditActionFilter === "all" || entry.action === auditActionFilter) &&
          (!auditAdminFilter || entry.adminId.toLowerCase().includes(auditAdminFilter.toLowerCase()))
      ),
    [auditLog, auditActionFilter, auditAdminFilter]
  );

  const auditActions = Array.from(new Set(auditLog.map((entry) => entry.action)));

  function appendAudit(action: string, targetType: string, targetId: string, reason: string) {
    setAuditLog((current) => [nextAuditEntry(action, targetType, targetId, reason, current.length), ...current]);
  }

  function refreshData() {
    setLoadingState("loading");
    window.setTimeout(() => {
      setLastRefreshed(new Date().toLocaleTimeString());
      setLoadingState("idle");
    }, 350);
  }

  function updateUserStatus(user: AdminUser, status: AdminUser["status"]) {
    const verb = status === "active" ? "reinstate" : status === "suspended" ? "suspend" : "ban";
    if (!window.confirm(`${verb} ${user.name}?`)) return;

    setUsers((current) => current.map((candidate) => (candidate.id === user.id ? { ...candidate, status } : candidate)));
    appendAudit("user.status_changed", "user", user.id, `Status set to ${status}`);
  }

  function moderateListing(listing: FlaggedListing, status: FlaggedListing["status"]) {
    const reason =
      status === "rejected"
        ? window.prompt("Rejection reason", listing.flagReason) ?? listing.flagReason
        : status === "escalated"
          ? "Escalated to senior admin"
          : "Approved by moderation";

    setFlaggedListings((current) =>
      current.map((candidate) => (candidate.id === listing.id ? { ...candidate, status } : candidate))
    );
    appendAudit(`listing.${status}`, "job", listing.id, reason);
  }

  function ruleDispute(dispute: Dispute, ruling: string) {
    const reason = window.prompt("Ruling reason", `${ruling} ruling after evidence review`);
    if (reason === null) return;

    setDisputes((current) =>
      current.map((candidate) =>
        candidate.id === dispute.id
          ? {
              ...candidate,
              status: ruling === "escalate" ? "under_review" : "resolved",
              ruling
            }
          : candidate
      )
    );
    appendAudit("dispute.ruled", "dispute", dispute.id, reason);
  }

  function toggleControl(control: PlatformControl) {
    if (!window.confirm(`Change ${control.label}?`)) return;

    setControls((current) =>
      current.map((candidate) =>
        candidate.key === control.key
          ? {
              ...candidate,
              enabled: !candidate.enabled,
              updatedAt: new Date().toISOString(),
              updatedBy: "adm_001"
            }
          : candidate
      )
    );
    appendAudit("platform_control.updated", "platform_control", control.key, `${control.label}: ${!control.enabled}`);
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Admin Console</p>
          <h2>Trust, Moderation, and Platform Controls</h2>
        </div>
        <button className="admin-button primary" type="button" onClick={refreshData} aria-live="polite">
          {loadingState === "loading" ? "Refreshing" : "Refresh"}
        </button>
      </header>

      {loadingState === "error" && (
        <section className="admin-alert" role="alert">
          Admin data could not be refreshed.
        </section>
      )}

      <section className="admin-metrics" aria-label="Platform health metrics">
        <Metric label="Total users" value={String(metrics.totalUsers)} />
        <Metric label="Active jobs" value={String(metrics.activeJobs)} />
        <Metric label="Open disputes" value={String(metrics.openDisputes)} />
        <Metric label="Flagged listings" value={String(metrics.flaggedListings)} />
        <Metric label="Current revenue" value={formatCents(metrics.revenueCurrentPeriod)} />
      </section>

      <section className="admin-section">
        <div className="section-heading">
          <h3>User Management</h3>
          <span>Updated {lastRefreshed}</span>
        </div>
        <div className="admin-toolbar" role="search" aria-label="User filters">
          <input
            aria-label="Search users"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setUserPage(1);
            }}
            placeholder="Search users"
          />
          <select aria-label="Filter by role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="all">All roles</option>
            <option value="freelancer">Freelancers</option>
            <option value="client">Clients</option>
          </select>
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
          <input aria-label="Joined after" type="date" value={joinedAfter} onChange={(event) => setJoinedAfter(event.target.value)} />
        </div>

        <div className="admin-split">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Trust</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <button className="link-button" type="button" onClick={() => setSelectedUserId(user.id)}>
                        {user.name}
                      </button>
                    </td>
                    <td>{user.role}</td>
                    <td>
                      <span className={statusClass(user.status)}>{user.status}</span>
                    </td>
                    <td>{user.joinedAt}</td>
                    <td>{user.trustScore}</td>
                    <td className="row-actions">
                      <button type="button" onClick={() => updateUserStatus(user, "suspended")}>
                        Suspend
                      </button>
                      <button type="button" onClick={() => updateUserStatus(user, "active")}>
                        Reinstate
                      </button>
                      <button type="button" className="danger" onClick={() => updateUserStatus(user, "banned")}>
                        Ban
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visibleUsers.length === 0 && <p className="empty-state">No users match the current filters.</p>}
            <div className="pager" aria-label="User table pagination">
              <button type="button" disabled={userPage === 1} onClick={() => setUserPage((page) => page - 1)}>
                Previous
              </button>
              <span>
                Page {userPage} of {totalUserPages}
              </span>
              <button type="button" disabled={userPage === totalUserPages} onClick={() => setUserPage((page) => page + 1)}>
                Next
              </button>
            </div>
          </div>

          {selectedUser && (
            <aside className="detail-panel" aria-label="Selected user profile">
              <h4>{selectedUser.name}</h4>
              <p>{selectedUser.headline}</p>
              <dl>
                <dt>Active jobs</dt>
                <dd>{selectedUser.activeJobs.length ? selectedUser.activeJobs.join(", ") : "None"}</dd>
                <dt>Disputes</dt>
                <dd>{selectedUser.disputes.length ? selectedUser.disputes.join(", ") : "None"}</dd>
                <dt>Trust score</dt>
                <dd>{selectedUser.trustScore}</dd>
              </dl>
            </aside>
          )}
        </div>
      </section>

      <section className="admin-section">
        <div className="section-heading">
          <h3>Trust Score Distribution</h3>
          <span>{users.length} users</span>
        </div>
        <div className="trust-chart" role="img" aria-label="Trust score distribution chart">
          {initialSnapshot.metrics.trustScoreDistribution.map((bucket) => (
            <div className="trust-bar" key={bucket.range}>
              <span style={{ height: `${Math.max(bucket.count * 32, 12)}px` }} />
              <strong>{bucket.count}</strong>
              <small>{bucket.range}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <div className="section-heading">
          <h3>Job Moderation</h3>
          <span>{flaggedListings.filter((listing) => listing.status === "flagged").length} flagged</span>
        </div>
        <div className="queue-list">
          {flaggedListings.map((listing) => (
            <article className="queue-row" key={listing.id}>
              <div>
                <h4>{listing.title}</h4>
                <p>{listing.poster} · {formatCents(listing.budgetCents)}</p>
                <p>{listing.flagReason}</p>
                <ul>
                  {listing.reports.map((report) => (
                    <li key={report}>{report}</li>
                  ))}
                </ul>
              </div>
              <div className="queue-actions">
                <span className={statusClass(listing.status)}>{listing.status}</span>
                <button type="button" onClick={() => moderateListing(listing, "approved")}>
                  Approve
                </button>
                <button type="button" onClick={() => moderateListing(listing, "escalated")}>
                  Escalate
                </button>
                <button type="button" className="danger" onClick={() => moderateListing(listing, "rejected")}>
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <div className="section-heading">
          <h3>Dispute Resolution</h3>
          <span>{disputes.filter((dispute) => dispute.status !== "resolved").length} open</span>
        </div>
        <div className="admin-split">
          <div className="queue-list">
            {disputes.map((dispute) => (
              <button className="dispute-row" type="button" key={dispute.id} onClick={() => setSelectedDisputeId(dispute.id)}>
                <strong>{dispute.jobTitle}</strong>
                <span>{dispute.freelancer} vs {dispute.client}</span>
                <span className={statusClass(dispute.status)}>{dispute.status}</span>
              </button>
            ))}
          </div>
          {selectedDispute && (
            <aside className="detail-panel" aria-label="Selected dispute details">
              <h4>{selectedDispute.id}</h4>
              <p>{selectedDispute.jobTitle} · {formatCents(selectedDispute.amountCents)}</p>
              <p>{selectedDispute.transaction}</p>
              <h5>Thread</h5>
              <ul>
                {selectedDispute.thread.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <h5>Evidence</h5>
              <p>{selectedDispute.evidence.join(", ")}</p>
              <div className="row-actions">
                <button type="button" onClick={() => ruleDispute(selectedDispute, "freelancer")}>
                  Freelancer Wins
                </button>
                <button type="button" onClick={() => ruleDispute(selectedDispute, "client")}>
                  Client Wins
                </button>
                <button type="button" onClick={() => ruleDispute(selectedDispute, "refund")}>
                  Refund
                </button>
                <button type="button" onClick={() => ruleDispute(selectedDispute, "escalate")}>
                  Escalate
                </button>
              </div>
            </aside>
          )}
        </div>
      </section>

      <section className="admin-section">
        <div className="section-heading">
          <h3>Platform Controls</h3>
          <span>{controls.filter((control) => control.enabled).length} enabled</span>
        </div>
        <div className="control-grid">
          {controls.map((control) => (
            <label className="control-row" key={control.key}>
              <span>
                <strong>{control.label}</strong>
                <small>
                  {control.updatedBy} · {new Date(control.updatedAt).toLocaleString()}
                </small>
              </span>
              <input
                aria-label={control.label}
                type="checkbox"
                checked={control.enabled}
                onChange={() => toggleControl(control)}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <div className="section-heading">
          <h3>Audit Log</h3>
          <span>{filteredAuditLog.length} entries</span>
        </div>
        <div className="admin-toolbar" aria-label="Audit log filters">
          <select
            aria-label="Filter audit action"
            value={auditActionFilter}
            onChange={(event) => setAuditActionFilter(event.target.value)}
          >
            <option value="all">All actions</option>
            {auditActions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
          <input
            aria-label="Filter audit admin"
            value={auditAdminFilter}
            onChange={(event) => setAuditAdminFilter(event.target.value)}
            placeholder="Admin ID"
          />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Target</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {filteredAuditLog.map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.createdAt).toLocaleString()}</td>
                  <td>{entry.adminId}</td>
                  <td>{entry.action}</td>
                  <td>
                    {entry.targetType}:{entry.targetId}
                  </td>
                  <td>{entry.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAuditLog.length === 0 && <p className="empty-state">No audit entries match the current filters.</p>}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="admin-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
