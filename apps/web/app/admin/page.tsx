"use client";

import { useEffect, useMemo, useState } from "react";

type UserStatus = "active" | "suspended" | "banned";
type ListingStatus = "pending" | "approved" | "rejected" | "escalated";
type DisputeStatus = "open" | "under_review" | "resolved";

type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  role: "admin" | "client" | "freelancer";
  status: UserStatus;
  joinedAt: string;
  activeJobs: number;
  disputeCount: number;
  trustScore: number;
};

type FlaggedListing = {
  id: string;
  title: string;
  clientName: string;
  reason: string;
  severity: "low" | "medium" | "high";
  status: ListingStatus;
  flaggedAt: string;
};

type Dispute = {
  id: string;
  jobTitle: string;
  clientName: string;
  freelancerName: string;
  amount: number;
  status: DisputeStatus;
  openedAt: string;
  thread: { author: string; body: string; at: string }[];
  evidence: string[];
  transaction: { id: string; status: string; amount: number };
};

type PlatformControl = {
  key: "registrations" | "jobPostings";
  label: string;
  enabled: boolean;
  updatedBy: string;
  updatedAt: string;
};

type AuditEntry = {
  id: string;
  adminId: string;
  actionType: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt: string;
};

const seedUsers: AdminUser[] = [
  {
    id: "usr_admin_1",
    fullName: "Avery Stone",
    email: "avery.admin@freelanceflow.test",
    role: "admin",
    status: "active",
    joinedAt: "2026-01-04T09:30:00.000Z",
    activeJobs: 0,
    disputeCount: 0,
    trustScore: 96
  },
  {
    id: "usr_freelancer_1",
    fullName: "Maya Chen",
    email: "maya.dev@example.test",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-02-14T12:15:00.000Z",
    activeJobs: 3,
    disputeCount: 1,
    trustScore: 88
  },
  {
    id: "usr_client_1",
    fullName: "Jordan Lee",
    email: "jordan.client@example.test",
    role: "client",
    status: "suspended",
    joinedAt: "2026-03-03T16:45:00.000Z",
    activeJobs: 2,
    disputeCount: 2,
    trustScore: 42
  },
  {
    id: "usr_freelancer_2",
    fullName: "Priya Singh",
    email: "priya.design@example.test",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-04-08T08:00:00.000Z",
    activeJobs: 1,
    disputeCount: 0,
    trustScore: 74
  }
];

const seedListings: FlaggedListing[] = [
  {
    id: "flag_1001",
    title: "Urgent crypto recovery automation",
    clientName: "Jordan Lee",
    reason: "Payment-risk keywords and off-platform contact request",
    severity: "high",
    status: "pending",
    flaggedAt: "2026-05-16T11:20:00.000Z"
  },
  {
    id: "flag_1002",
    title: "Rewrite SaaS onboarding",
    clientName: "Nolan Brooks",
    reason: "Duplicate listing reported by two freelancers",
    severity: "medium",
    status: "pending",
    flaggedAt: "2026-05-16T13:10:00.000Z"
  }
];

const seedDisputes: Dispute[] = [
  {
    id: "disp_2001",
    jobTitle: "AI support widget prototype",
    clientName: "Jordan Lee",
    freelancerName: "Maya Chen",
    amount: 1500,
    status: "open",
    openedAt: "2026-05-15T15:00:00.000Z",
    thread: [
      { author: "client", body: "The final handoff missed the analytics hook.", at: "2026-05-15T15:02:00.000Z" },
      { author: "freelancer", body: "Analytics was excluded from the paid scope.", at: "2026-05-15T15:08:00.000Z" }
    ],
    evidence: ["scope-agreement.pdf", "handoff-video.mp4"],
    transaction: { id: "pay_7781", status: "held", amount: 1500 }
  }
];

const seedControls: PlatformControl[] = [
  {
    key: "registrations",
    label: "New user registrations",
    enabled: true,
    updatedBy: "system",
    updatedAt: "2026-05-17T05:00:00.000Z"
  },
  {
    key: "jobPostings",
    label: "New job postings",
    enabled: true,
    updatedBy: "system",
    updatedAt: "2026-05-17T05:00:00.000Z"
  }
];

const seedAudit: AuditEntry[] = [
  {
    id: "audit_seed",
    adminId: "system",
    actionType: "admin.panel.seeded",
    targetType: "platform",
    targetId: "admin",
    details: "Seeded admin dashboard queues for review",
    createdAt: "2026-05-17T05:00:00.000Z"
  }
];

const tabs = ["overview", "users", "moderation", "disputes", "audit"] as const;
type Tab = (typeof tabs)[number];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(
    new Date(value)
  );
}

function statusClass(value: string) {
  return `status status-${value.replace("_", "-")}`;
}

function metricValue(label: string, value: string | number) {
  return (
    <article className="metric" aria-label={label}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState("");
  const [users, setUsers] = useState(seedUsers);
  const [listings, setListings] = useState(seedListings);
  const [disputes, setDisputes] = useState(seedDisputes);
  const [controls, setControls] = useState(seedControls);
  const [audit, setAudit] = useState(seedAudit);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [auditFilter, setAuditFilter] = useState("");

  const metrics = useMemo(() => {
    const activeJobs = users.reduce((sum, user) => sum + user.activeJobs, 0);
    return {
      totalUsers: users.length,
      activeJobs,
      openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
      flaggedListings: listings.filter((listing) => listing.status === "pending").length,
      revenue: "$128.9k"
    };
  }, [disputes, listings, users]);

  const trustBuckets = useMemo(
    () => [
      { label: "80-100", count: users.filter((user) => user.trustScore >= 80).length },
      { label: "60-79", count: users.filter((user) => user.trustScore >= 60 && user.trustScore < 80).length },
      { label: "40-59", count: users.filter((user) => user.trustScore >= 40 && user.trustScore < 60).length },
      { label: "0-39", count: users.filter((user) => user.trustScore < 40).length }
    ],
    [users]
  );

  const filteredUsers = useMemo(() => {
    const search = userSearch.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !search ||
        user.fullName.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.id.toLowerCase().includes(search);
      return matchesSearch && (!roleFilter || user.role === roleFilter) && (!statusFilter || user.status === statusFilter);
    });
  }, [roleFilter, statusFilter, userSearch, users]);

  const filteredAudit = useMemo(() => {
    const term = auditFilter.trim().toLowerCase();
    return audit.filter((entry) => !term || entry.actionType.toLowerCase().includes(term) || entry.adminId.includes(term));
  }, [audit, auditFilter]);

  function appendAudit(actionType: string, targetType: string, targetId: string, details: string) {
    setAudit((current) => [
      {
        id: `audit_${Date.now()}`,
        adminId: "local-admin",
        actionType,
        targetType,
        targetId,
        details,
        createdAt: new Date().toISOString()
      },
      ...current
    ]);
  }

  async function refreshData() {
    setLoading(true);
    setError("");

    try {
      const token = window.localStorage.getItem("freelanceflow_token");
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      if (!token) {
        throw new Error("No admin API token found in localStorage.");
      }

      const headers = { authorization: `Bearer ${token}` };
      const [overviewRes, usersRes, listingsRes, disputesRes, auditRes] = await Promise.all([
        fetch(`${apiBase}/api/admin/overview`, { headers }),
        fetch(`${apiBase}/api/admin/users?pageSize=25`, { headers }),
        fetch(`${apiBase}/api/admin/moderation?pageSize=25`, { headers }),
        fetch(`${apiBase}/api/admin/disputes?pageSize=25`, { headers }),
        fetch(`${apiBase}/api/admin/audit-log?pageSize=25`, { headers })
      ]);

      if ([overviewRes, usersRes, listingsRes, disputesRes, auditRes].some((response) => !response.ok)) {
        throw new Error("Admin API returned an authorization or loading error.");
      }

      const [overviewJson, usersJson, listingsJson, disputesJson, auditJson] = await Promise.all([
        overviewRes.json(),
        usersRes.json(),
        listingsRes.json(),
        disputesRes.json(),
        auditRes.json()
      ]);

      setControls(overviewJson.data.controls);
      setUsers(usersJson.data.items);
      setListings(listingsJson.data.items);
      setDisputes(disputesJson.data.items);
      setAudit(auditJson.data.items);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Unable to refresh admin data.");
    } finally {
      setLastRefresh(new Date().toLocaleString());
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshData();
  }, []);

  function changeUserStatus(id: string, status: UserStatus) {
    setUsers((current) => current.map((user) => (user.id === id ? { ...user, status } : user)));
    appendAudit(status === "active" ? "user.reinstated" : `user.${status}`, "user", id, `Set user to ${status}`);
  }

  function decideListing(id: string, status: ListingStatus) {
    setListings((current) => current.map((listing) => (listing.id === id ? { ...listing, status } : listing)));
    appendAudit(`listing.${status}`, "flagged_listing", id, `Marked listing ${status}`);
  }

  function resolveDispute(id: string, ruling: "client" | "freelancer" | "escalate") {
    setDisputes((current) =>
      current.map((dispute) => {
        if (dispute.id !== id) {
          return dispute;
        }

        if (ruling === "escalate") {
          return { ...dispute, status: "under_review" };
        }

        return {
          ...dispute,
          status: "resolved",
          transaction: {
            ...dispute.transaction,
            status: ruling === "client" ? "refund_pending" : "release_pending"
          }
        };
      })
    );
    appendAudit(ruling === "escalate" ? "dispute.escalated" : "dispute.resolved", "dispute", id, `Ruling: ${ruling}`);
  }

  function toggleControl(key: PlatformControl["key"]) {
    const control = controls.find((item) => item.key === key);
    if (!control || !window.confirm(`${control.enabled ? "Disable" : "Enable"} ${control.label}?`)) {
      return;
    }

    setControls((current) =>
      current.map((item) =>
        item.key === key
          ? { ...item, enabled: !item.enabled, updatedBy: "local-admin", updatedAt: new Date().toISOString() }
          : item
      )
    );
    appendAudit("platform.control_updated", "platform_control", key, `${control.label} changed`);
  }

  return (
    <section className="admin-shell">
      <header className="admin-header">
        <div>
          <h2>Admin Panel</h2>
          <p>Users, listings, disputes, controls, and audit history.</p>
        </div>
        <button className="primary-button" onClick={refreshData} disabled={loading} aria-label="Refresh admin data">
          {loading ? "Refreshing" : "Refresh"}
        </button>
      </header>

      <div className="admin-state-row" role="status">
        <span>Last refresh: {lastRefresh || "pending"}</span>
        {error ? <span className="inline-error">{error} Showing seeded review data.</span> : <span>Live admin data loaded.</span>}
      </div>

      <nav className="admin-tabs" aria-label="Admin sections">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "tab-active" : ""}
            onClick={() => setActiveTab(tab)}
            aria-pressed={activeTab === tab}
          >
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === "overview" && (
        <div className="admin-grid">
          {metricValue("Total users", metrics.totalUsers)}
          {metricValue("Active jobs", metrics.activeJobs)}
          {metricValue("Open disputes", metrics.openDisputes)}
          {metricValue("Flagged listings", metrics.flaggedListings)}
          {metricValue("Revenue", metrics.revenue)}

          <section className="admin-panel wide-panel">
            <h3>Trust Score Distribution</h3>
            <div className="trust-bars">
              {trustBuckets.map((bucket) => (
                <div key={bucket.label} className="trust-row">
                  <span>{bucket.label}</span>
                  <meter min={0} max={users.length || 1} value={bucket.count} aria-label={`Trust score ${bucket.label}`} />
                  <strong>{bucket.count}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-panel wide-panel">
            <h3>Platform Controls</h3>
            <div className="control-grid">
              {controls.map((control) => (
                <article key={control.key} className="control-item">
                  <div>
                    <strong>{control.label}</strong>
                    <span>{control.enabled ? "Enabled" : "Disabled"} by {control.updatedBy}</span>
                  </div>
                  <button onClick={() => toggleControl(control.key)} aria-label={`Toggle ${control.label}`}>
                    {control.enabled ? "Disable" : "Enable"}
                  </button>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeTab === "users" && (
        <section className="admin-panel">
          <div className="toolbar">
            <input
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder="Search users"
              aria-label="Search users"
            />
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} aria-label="Filter by role">
              <option value="">All roles</option>
              <option value="admin">Admin</option>
              <option value="client">Client</option>
              <option value="freelancer">Freelancer</option>
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Trust</th>
                  <th>Activity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.fullName}</strong>
                      <span>{user.email}</span>
                      <span>Joined {formatDate(user.joinedAt)}</span>
                    </td>
                    <td>{user.role}</td>
                    <td><span className={statusClass(user.status)}>{user.status}</span></td>
                    <td>{user.trustScore}</td>
                    <td>{user.activeJobs} jobs / {user.disputeCount} disputes</td>
                    <td className="action-cell">
                      <button onClick={() => changeUserStatus(user.id, "suspended")}>Suspend</button>
                      <button onClick={() => changeUserStatus(user.id, "active")}>Reinstate</button>
                      <button onClick={() => changeUserStatus(user.id, "banned")}>Ban</button>
                    </td>
                  </tr>
                ))}
                {!filteredUsers.length && (
                  <tr>
                    <td colSpan={6}>No users match the current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "moderation" && (
        <section className="admin-panel list-panel">
          {listings.map((listing) => (
            <article key={listing.id} className="queue-item">
              <div>
                <h3>{listing.title}</h3>
                <p>{listing.reason}</p>
                <span>{listing.clientName} / {listing.severity} / {formatDate(listing.flaggedAt)}</span>
              </div>
              <span className={statusClass(listing.status)}>{listing.status}</span>
              <div className="action-cell">
                <button onClick={() => decideListing(listing.id, "approved")}>Approve</button>
                <button onClick={() => decideListing(listing.id, "rejected")}>Reject</button>
                <button onClick={() => decideListing(listing.id, "escalated")}>Escalate</button>
              </div>
            </article>
          ))}
          {!listings.length && <p>No flagged listings are waiting for review.</p>}
        </section>
      )}

      {activeTab === "disputes" && (
        <section className="admin-panel list-panel">
          {disputes.map((dispute) => (
            <article key={dispute.id} className="queue-item dispute-item">
              <div>
                <h3>{dispute.jobTitle}</h3>
                <p>{dispute.clientName} vs {dispute.freelancerName} / ${dispute.amount}</p>
                <p>{dispute.thread[0]?.body}</p>
                <span>Evidence: {dispute.evidence.join(", ")} / transaction {dispute.transaction.status}</span>
              </div>
              <span className={statusClass(dispute.status)}>{dispute.status}</span>
              <div className="action-cell">
                <button onClick={() => resolveDispute(dispute.id, "client")}>Client Wins</button>
                <button onClick={() => resolveDispute(dispute.id, "freelancer")}>Freelancer Wins</button>
                <button onClick={() => resolveDispute(dispute.id, "escalate")}>Escalate</button>
              </div>
            </article>
          ))}
          {!disputes.length && <p>No disputes match the current filters.</p>}
        </section>
      )}

      {activeTab === "audit" && (
        <section className="admin-panel">
          <div className="toolbar">
            <input
              value={auditFilter}
              onChange={(event) => setAuditFilter(event.target.value)}
              placeholder="Filter audit actions"
              aria-label="Filter audit actions"
            />
            <span>Page 1 of 1 / {filteredAudit.length} records</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredAudit.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatDate(entry.createdAt)}</td>
                    <td>{entry.adminId}</td>
                    <td>{entry.actionType}</td>
                    <td>{entry.targetType}:{entry.targetId}</td>
                    <td>{entry.details}</td>
                  </tr>
                ))}
                {!filteredAudit.length && (
                  <tr>
                    <td colSpan={5}>No audit records match the filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </section>
  );
}
