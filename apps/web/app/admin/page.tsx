"use client";

import { useMemo, useState } from "react";

type UserStatus = "active" | "suspended" | "banned";
type UserRole = "client" | "freelancer" | "admin";
type ListingStatus = "pending" | "approved" | "rejected" | "escalated";
type DisputeStatus = "open" | "under_review" | "resolved";

type AuditEntry = {
  id: string;
  adminId: string;
  action: string;
  targetId: string;
  createdAt: string;
  details: string;
};

const adminSession = {
  id: "adm_001",
  name: "Ops Admin",
  role: "admin" as UserRole
};

const initialUsers = [
  {
    id: "usr_101",
    name: "Maya Chen",
    role: "freelancer" as UserRole,
    status: "active" as UserStatus,
    joinedAt: "2026-01-12",
    trustScore: 92,
    activeJobs: 1,
    disputes: 1
  },
  {
    id: "usr_102",
    name: "Jordan Lee",
    role: "client" as UserRole,
    status: "active" as UserStatus,
    joinedAt: "2026-02-18",
    trustScore: 81,
    activeJobs: 1,
    disputes: 0
  },
  {
    id: "usr_103",
    name: "Priya Nair",
    role: "freelancer" as UserRole,
    status: "suspended" as UserStatus,
    joinedAt: "2026-03-07",
    trustScore: 48,
    activeJobs: 0,
    disputes: 1
  },
  {
    id: "usr_104",
    name: "Alex Rivera",
    role: "client" as UserRole,
    status: "active" as UserStatus,
    joinedAt: "2026-04-22",
    trustScore: 76,
    activeJobs: 1,
    disputes: 0
  },
  {
    id: "usr_105",
    name: "Noah Smith",
    role: "freelancer" as UserRole,
    status: "banned" as UserStatus,
    joinedAt: "2026-01-28",
    trustScore: 19,
    activeJobs: 0,
    disputes: 1
  }
];

const initialListings = [
  {
    id: "flag_401",
    title: "Build payment reconciliation dashboard",
    postedBy: "Jordan Lee",
    severity: "high",
    status: "pending" as ListingStatus,
    reason: "Payment outside escrow"
  },
  {
    id: "flag_402",
    title: "Migrate marketplace search to OpenSearch",
    postedBy: "Alex Rivera",
    severity: "medium",
    status: "pending" as ListingStatus,
    reason: "Misleading budget range"
  },
  {
    id: "flag_403",
    title: "Create brand kit and landing copy",
    postedBy: "Jordan Lee",
    severity: "low",
    status: "escalated" as ListingStatus,
    reason: "Duplicate listing"
  }
];

const initialDisputes = [
  {
    id: "dsp_501",
    title: "Build payment reconciliation dashboard",
    client: "Jordan Lee",
    freelancer: "Maya Chen",
    amount: 2400,
    status: "open" as DisputeStatus,
    evidence: "deployment-log.txt, milestone-screenshot.png"
  },
  {
    id: "dsp_502",
    title: "Refactor mobile onboarding",
    client: "Alex Rivera",
    freelancer: "Priya Nair",
    amount: 900,
    status: "under_review" as DisputeStatus,
    evidence: "brief.pdf, handoff.zip"
  }
];

const initialAuditLog: AuditEntry[] = [
  {
    id: "aud_001",
    adminId: "adm_001",
    action: "platform.audit_seeded",
    targetId: "system",
    createdAt: "2026-05-23T07:00:00.000Z",
    details: "initial state"
  }
];

function statusClass(status: string) {
  return `status status-${status.replace("_", "-")}`;
}

function newAudit(action: string, targetId: string, details: string): AuditEntry {
  return {
    id: `aud_${Date.now()}`,
    adminId: adminSession.id,
    action,
    targetId,
    createdAt: new Date().toISOString(),
    details
  };
}

export default function AdminPanelPage() {
  const [users, setUsers] = useState(initialUsers);
  const [listings, setListings] = useState(initialListings);
  const [disputes, setDisputes] = useState(initialDisputes);
  const [registrationsEnabled, setRegistrationsEnabled] = useState(true);
  const [jobPostingsEnabled, setJobPostingsEnabled] = useState(true);
  const [auditLog, setAuditLog] = useState(initialAuditLog);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [auditFilter, setAuditFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [lastRefresh, setLastRefresh] = useState("page load");
  const [operationError, setOperationError] = useState("");

  if (adminSession.role !== "admin") {
    return (
      <section className="admin-shell">
        <div className="admin-error" role="alert">
          403 Forbidden
        </div>
      </section>
    );
  }

  const metrics = useMemo(
    () => ({
      totalUsers: users.length,
      activeJobs: users.reduce((total, user) => total + user.activeJobs, 0),
      openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
      flaggedListings: listings.filter((listing) => listing.status === "pending").length,
      revenue: "$128.9k"
    }),
    [disputes, listings, users]
  );

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.id.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roleFilter, search, statusFilter, users]);

  const pageSize = 3;
  const totalPages = Math.max(Math.ceil(filteredUsers.length / pageSize), 1);
  const visibleUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);
  const filteredAuditLog = auditLog.filter((entry) => auditFilter === "all" || entry.action === auditFilter);

  function record(action: string, targetId: string, details: string) {
    setAuditLog((current) => [newAudit(action, targetId, details), ...current]);
  }

  function changeUserStatus(userId: string, status: UserStatus) {
    setOperationError("");
    setUsers((current) =>
      current.map((user) => (user.id === userId ? { ...user, status } : user))
    );
    record("user.status_changed", userId, `status=${status}`);
  }

  function reviewListing(listingId: string, status: ListingStatus) {
    setOperationError("");
    setListings((current) =>
      current.map((listing) => (listing.id === listingId ? { ...listing, status } : listing))
    );
    record(`listing.${status}`, listingId, `status=${status}`);
  }

  function resolveDispute(disputeId: string, ruling: string) {
    setOperationError("");
    setDisputes((current) =>
      current.map((dispute) =>
        dispute.id === disputeId
          ? { ...dispute, status: ruling === "escalate" ? "under_review" : "resolved" }
          : dispute
      )
    );
    record("dispute.ruling", disputeId, `ruling=${ruling}`);
  }

  function toggleControl(control: "registrations" | "jobPostings", enabled: boolean) {
    setOperationError("");
    const confirmed = window.confirm(`Apply platform control change: ${control}=${enabled}`);
    if (!confirmed) {
      setOperationError("Control change cancelled.");
      return;
    }

    if (control === "registrations") {
      setRegistrationsEnabled(enabled);
    } else {
      setJobPostingsEnabled(enabled);
    }
    record("platform.control_toggled", control, `enabled=${enabled}`);
  }

  return (
    <section className="admin-shell">
      <header className="admin-toolbar">
        <div>
          <p className="eyebrow">Admin operations</p>
          <h2>Control panel</h2>
        </div>
        <div className="toolbar-actions">
          <span className="admin-session">{adminSession.name}</span>
          <button type="button" onClick={() => setLastRefresh(new Date().toLocaleTimeString())}>
            Refresh
          </button>
        </div>
      </header>

      <div className="metric-grid" aria-label="Platform metrics">
        <article>
          <span>Total users</span>
          <strong>{metrics.totalUsers}</strong>
        </article>
        <article>
          <span>Active jobs</span>
          <strong>{metrics.activeJobs}</strong>
        </article>
        <article>
          <span>Open disputes</span>
          <strong>{metrics.openDisputes}</strong>
        </article>
        <article>
          <span>Flagged listings</span>
          <strong>{metrics.flaggedListings}</strong>
        </article>
        <article>
          <span>Revenue</span>
          <strong>{metrics.revenue}</strong>
        </article>
      </div>

      <div className="admin-grid">
        <section className="admin-section admin-section-wide">
          <div className="section-heading">
            <h3>User management</h3>
            <span>Updated {lastRefresh}</span>
          </div>
          <div className="filter-row">
            <input
              aria-label="Search users"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search users"
            />
            <select
              aria-label="Filter users by role"
              value={roleFilter}
              onChange={(event) => {
                setRoleFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">All roles</option>
              <option value="client">Clients</option>
              <option value="freelancer">Freelancers</option>
            </select>
            <select
              aria-label="Filter users by status"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </div>
          {visibleUsers.length === 0 ? (
            <div className="empty-state">No users match the current filters.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Trust</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.name}</strong>
                      <span>{user.id}</span>
                    </td>
                    <td>{user.role}</td>
                    <td>
                      <span className={statusClass(user.status)}>{user.status}</span>
                    </td>
                    <td>{user.trustScore}</td>
                    <td>{user.joinedAt}</td>
                    <td>
                      <div className="button-row">
                        <button type="button" onClick={() => changeUserStatus(user.id, "active")}>
                          Reinstate
                        </button>
                        <button type="button" onClick={() => changeUserStatus(user.id, "suspended")}>
                          Suspend
                        </button>
                        <button type="button" onClick={() => changeUserStatus(user.id, "banned")}>
                          Ban
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="pagination">
            <button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>
              Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </button>
          </div>
        </section>

        <section className="admin-section">
          <div className="section-heading">
            <h3>Trust distribution</h3>
          </div>
          <div className="trust-bars" aria-label="Trust score distribution">
            {[
              ["0-39", users.filter((user) => user.trustScore < 40).length],
              ["40-69", users.filter((user) => user.trustScore >= 40 && user.trustScore < 70).length],
              ["70-89", users.filter((user) => user.trustScore >= 70 && user.trustScore < 90).length],
              ["90-100", users.filter((user) => user.trustScore >= 90).length]
            ].map(([range, count]) => (
              <div key={range} className="trust-row">
                <span>{range}</span>
                <div>
                  <i style={{ width: `${Number(count) * 22 + 12}%` }} />
                </div>
                <b>{count}</b>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-section admin-section-wide">
          <div className="section-heading">
            <h3>Job moderation</h3>
          </div>
          <div className="queue-list">
            {listings.map((listing) => (
              <article key={listing.id} className="queue-item">
                <div>
                  <strong>{listing.title}</strong>
                  <span>
                    {listing.postedBy} / {listing.reason}
                  </span>
                </div>
                <span className={statusClass(listing.status)}>{listing.status}</span>
                <div className="button-row">
                  <button type="button" onClick={() => reviewListing(listing.id, "approved")}>
                    Approve
                  </button>
                  <button type="button" onClick={() => reviewListing(listing.id, "rejected")}>
                    Reject
                  </button>
                  <button type="button" onClick={() => reviewListing(listing.id, "escalated")}>
                    Escalate
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-section admin-section-wide">
          <div className="section-heading">
            <h3>Dispute resolution</h3>
          </div>
          <div className="queue-list">
            {disputes.map((dispute) => (
              <article key={dispute.id} className="queue-item dispute-item">
                <div>
                  <strong>{dispute.title}</strong>
                  <span>
                    {dispute.client} vs {dispute.freelancer} / ${dispute.amount}
                  </span>
                  <small>{dispute.evidence}</small>
                </div>
                <span className={statusClass(dispute.status)}>{dispute.status}</span>
                <div className="button-row">
                  <button type="button" onClick={() => resolveDispute(dispute.id, "client")}>
                    Client
                  </button>
                  <button type="button" onClick={() => resolveDispute(dispute.id, "freelancer")}>
                    Freelancer
                  </button>
                  <button type="button" onClick={() => resolveDispute(dispute.id, "refund")}>
                    Refund
                  </button>
                  <button type="button" onClick={() => resolveDispute(dispute.id, "escalate")}>
                    Escalate
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-section">
          <div className="section-heading">
            <h3>Platform controls</h3>
          </div>
          {operationError ? (
            <div className="admin-error" role="alert">
              {operationError}
            </div>
          ) : null}
          <label className="toggle-row">
            <span>New user registrations</span>
            <input
              aria-label="Toggle new user registrations"
              type="checkbox"
              checked={registrationsEnabled}
              onChange={(event) => toggleControl("registrations", event.target.checked)}
            />
          </label>
          <label className="toggle-row">
            <span>New job postings</span>
            <input
              aria-label="Toggle new job postings"
              type="checkbox"
              checked={jobPostingsEnabled}
              onChange={(event) => toggleControl("jobPostings", event.target.checked)}
            />
          </label>
        </section>

        <section className="admin-section">
          <div className="section-heading">
            <h3>Audit log</h3>
          </div>
          <select
            aria-label="Filter audit log by action"
            value={auditFilter}
            onChange={(event) => setAuditFilter(event.target.value)}
          >
            <option value="all">All actions</option>
            <option value="user.status_changed">User status</option>
            <option value="listing.approved">Listing approved</option>
            <option value="listing.rejected">Listing rejected</option>
            <option value="listing.escalated">Listing escalated</option>
            <option value="dispute.ruling">Dispute ruling</option>
            <option value="platform.control_toggled">Control toggled</option>
          </select>
          <div className="audit-list">
            {filteredAuditLog.length === 0 ? (
              <div className="empty-state">No audit entries match this filter.</div>
            ) : (
              filteredAuditLog.map((entry) => (
                <article key={entry.id}>
                  <strong>{entry.action}</strong>
                  <span>{entry.targetId}</span>
                  <small>{entry.details}</small>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
