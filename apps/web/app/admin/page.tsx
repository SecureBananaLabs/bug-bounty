"use client";

import { useMemo, useState } from "react";

type UserStatus = "active" | "under_review" | "suspended" | "banned";
type ListingStatus = "flagged" | "approved" | "rejected" | "escalated";
type DisputeStatus = "open" | "under_review" | "resolved";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "freelancer" | "client";
  status: UserStatus;
  joinedAt: string;
  activeJobs: number;
  disputes: number;
  trustScore: number;
};

type FlaggedListing = {
  id: string;
  title: string;
  client: string;
  status: ListingStatus;
  reason: string;
  reports: number;
};

type Dispute = {
  id: string;
  jobTitle: string;
  client: string;
  freelancer: string;
  status: DisputeStatus;
  amount: number;
  reason: string;
  evidence: string[];
};

type AuditEntry = {
  id: string;
  action: string;
  target: string;
  details: string;
  createdAt: string;
};

const initialUsers: AdminUser[] = [
  {
    id: "usr_1001",
    name: "Maya Chen",
    email: "maya@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-01-12",
    activeJobs: 3,
    disputes: 0,
    trustScore: 94
  },
  {
    id: "usr_1002",
    name: "Orion Labs",
    email: "ops@orion.example",
    role: "client",
    status: "under_review",
    joinedAt: "2026-02-03",
    activeJobs: 8,
    disputes: 2,
    trustScore: 61
  },
  {
    id: "usr_1003",
    name: "Jon Bell",
    email: "jon@example.com",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2025-11-19",
    activeJobs: 0,
    disputes: 3,
    trustScore: 38
  },
  {
    id: "usr_1004",
    name: "Northstar Studio",
    email: "hello@northstar.example",
    role: "client",
    status: "active",
    joinedAt: "2026-03-28",
    activeJobs: 5,
    disputes: 0,
    trustScore: 88
  }
];

const initialListings: FlaggedListing[] = [
  {
    id: "job_2001",
    title: "Scrape private marketplace profiles",
    client: "Orion Labs",
    status: "flagged",
    reason: "Possible privacy violation",
    reports: 4
  },
  {
    id: "job_2002",
    title: "Emergency Next.js checkout fix",
    client: "Northstar Studio",
    status: "flagged",
    reason: "Suspicious payment wording",
    reports: 2
  },
  {
    id: "job_2003",
    title: "Design portfolio refresh",
    client: "Arcadia Collective",
    status: "escalated",
    reason: "Repeated duplicate listing reports",
    reports: 6
  }
];

const initialDisputes: Dispute[] = [
  {
    id: "disp_3001",
    jobTitle: "API migration sprint",
    client: "Orion Labs",
    freelancer: "Maya Chen",
    status: "open",
    amount: 2800,
    reason: "Milestone delivery disagreement",
    evidence: ["staging-log.txt", "contract-scope.pdf"]
  },
  {
    id: "disp_3002",
    jobTitle: "Landing page design",
    client: "Northstar Studio",
    freelancer: "Jon Bell",
    status: "under_review",
    amount: 900,
    reason: "Final files missing editable sources",
    evidence: ["handoff.zip", "message-thread.csv"]
  }
];

function StatusBadge({ value }: { value: string }) {
  return <span className={`admin-status admin-status-${value}`}>{value.replace("_", " ")}</span>;
}

export default function AdminPanelPage() {
  const [users, setUsers] = useState(initialUsers);
  const [listings, setListings] = useState(initialListings);
  const [disputes, setDisputes] = useState(initialDisputes);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([
    {
      id: "audit_1",
      action: "review_listing",
      target: "job_2003",
      details: "Escalated duplicate listing reports",
      createdAt: "2026-05-18 09:30"
    }
  ]);
  const [registrationsEnabled, setRegistrationsEnabled] = useState(true);
  const [jobPostingEnabled, setJobPostingEnabled] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lastRefreshed, setLastRefreshed] = useState("just now");
  const [panelError, setPanelError] = useState("");

  const filteredUsers = useMemo(() => {
    const search = userSearch.toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !search ||
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.id.toLowerCase().includes(search);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roleFilter, statusFilter, userSearch, users]);

  const metrics = useMemo(() => {
    const activeJobs = users.reduce((total, user) => total + user.activeJobs, 0);
    const flaggedCount = listings.filter((listing) => listing.status === "flagged").length;
    const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
    const highTrust = users.filter((user) => user.trustScore >= 80).length;
    const mediumTrust = users.filter((user) => user.trustScore >= 50 && user.trustScore < 80).length;
    const lowTrust = users.filter((user) => user.trustScore < 50).length;

    return {
      totalUsers: users.length,
      activeJobs,
      flaggedCount,
      openDisputes,
      revenue: "$128.9k",
      trust: [
        { label: "80-100", count: highTrust },
        { label: "50-79", count: mediumTrust },
        { label: "0-49", count: lowTrust }
      ]
    };
  }, [disputes, listings, users]);

  function recordAudit(action: string, target: string, details: string) {
    setAuditLog((current) => [
      {
        id: `audit_${current.length + 1}`,
        action,
        target,
        details,
        createdAt: new Date().toLocaleString()
      },
      ...current
    ]);
  }

  function updateUserStatus(userId: string, status: UserStatus) {
    setUsers((current) =>
      current.map((user) => (user.id === userId ? { ...user, status } : user))
    );
    recordAudit("update_user_status", userId, `Set account status to ${status}`);
  }

  function updateListing(listingId: string, status: ListingStatus) {
    setListings((current) =>
      current.map((listing) => (listing.id === listingId ? { ...listing, status } : listing))
    );
    recordAudit("moderate_listing", listingId, `Marked listing as ${status}`);
  }

  function resolveDispute(disputeId: string, ruling: string) {
    setDisputes((current) =>
      current.map((dispute) =>
        dispute.id === disputeId
          ? { ...dispute, status: ruling === "escalate" ? "under_review" : "resolved" }
          : dispute
      )
    );
    recordAudit("rule_dispute", disputeId, `Ruling recorded: ${ruling}`);
  }

  function confirmControlChange(control: "registrations" | "jobs", value: boolean) {
    const confirmed = window.confirm(`Apply platform control change: ${control} ${value ? "on" : "off"}?`);
    if (!confirmed) {
      return;
    }

    if (control === "registrations") {
      setRegistrationsEnabled(value);
    } else {
      setJobPostingEnabled(value);
    }

    recordAudit("update_platform_controls", control, `Set ${control} to ${value ? "enabled" : "disabled"}`);
  }

  function refreshDashboard() {
    setPanelError("");
    setLastRefreshed(new Date().toLocaleTimeString());
  }

  return (
    <section className="admin-shell" aria-label="Admin operations panel">
      <div className="admin-hero">
        <div>
          <p className="admin-eyebrow">Admin operations</p>
          <h2>Marketplace control center</h2>
        </div>
        <div className="admin-actions">
          <span>Updated {lastRefreshed}</span>
          <button type="button" onClick={refreshDashboard}>
            Refresh
          </button>
        </div>
      </div>

      {panelError ? <div className="admin-error" role="alert">{panelError}</div> : null}

      <div className="admin-kpi-grid" aria-label="Platform metrics">
        <article className="admin-kpi">
          <span>Total users</span>
          <strong>{metrics.totalUsers}</strong>
        </article>
        <article className="admin-kpi">
          <span>Active jobs</span>
          <strong>{metrics.activeJobs}</strong>
        </article>
        <article className="admin-kpi">
          <span>Open disputes</span>
          <strong>{metrics.openDisputes}</strong>
        </article>
        <article className="admin-kpi">
          <span>Flagged listings</span>
          <strong>{metrics.flaggedCount}</strong>
        </article>
        <article className="admin-kpi">
          <span>Revenue</span>
          <strong>{metrics.revenue}</strong>
        </article>
      </div>

      <div className="admin-layout">
        <section className="admin-card admin-wide">
          <div className="admin-section-header">
            <h3>User management</h3>
            <div className="admin-filters">
              <input
                aria-label="Search users"
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
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
                <option value="under_review">Under review</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </select>
            </div>
          </div>
          {filteredUsers.length === 0 ? (
            <p className="admin-empty">No users match the current filters.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Jobs</th>
                    <th>Disputes</th>
                    <th>Trust</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                      </td>
                      <td>{user.role}</td>
                      <td><StatusBadge value={user.status} /></td>
                      <td>{user.activeJobs}</td>
                      <td>{user.disputes}</td>
                      <td>{user.trustScore}</td>
                      <td>
                        <div className="admin-row-actions">
                          <button type="button" onClick={() => updateUserStatus(user.id, "suspended")}>
                            Suspend
                          </button>
                          <button type="button" onClick={() => updateUserStatus(user.id, "active")}>
                            Reinstate
                          </button>
                          <button type="button" className="danger" onClick={() => updateUserStatus(user.id, "banned")}>
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

        <section className="admin-card">
          <div className="admin-section-header">
            <h3>Trust distribution</h3>
          </div>
          <div className="trust-bars">
            {metrics.trust.map((bucket) => (
              <div key={bucket.label}>
                <span>{bucket.label}</span>
                <div className="trust-bar">
                  <span style={{ width: `${Math.max(12, bucket.count * 25)}%` }} />
                </div>
                <strong>{bucket.count}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-card">
          <div className="admin-section-header">
            <h3>Platform controls</h3>
          </div>
          <div className="admin-control-list">
            <label>
              <span>New registrations</span>
              <input
                type="checkbox"
                checked={registrationsEnabled}
                onChange={(event) => confirmControlChange("registrations", event.target.checked)}
              />
            </label>
            <label>
              <span>New job postings</span>
              <input
                type="checkbox"
                checked={jobPostingEnabled}
                onChange={(event) => confirmControlChange("jobs", event.target.checked)}
              />
            </label>
          </div>
        </section>

        <section className="admin-card admin-wide">
          <div className="admin-section-header">
            <h3>Job and listing moderation</h3>
          </div>
          <div className="admin-list">
            {listings.map((listing) => (
              <article key={listing.id} className="admin-list-item">
                <div>
                  <strong>{listing.title}</strong>
                  <span>{listing.client} - {listing.reason} - {listing.reports} reports</span>
                </div>
                <StatusBadge value={listing.status} />
                <div className="admin-row-actions">
                  <button type="button" onClick={() => updateListing(listing.id, "approved")}>
                    Approve
                  </button>
                  <button type="button" onClick={() => updateListing(listing.id, "escalated")}>
                    Escalate
                  </button>
                  <button type="button" className="danger" onClick={() => updateListing(listing.id, "rejected")}>
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-card admin-wide">
          <div className="admin-section-header">
            <h3>Dispute resolution</h3>
          </div>
          <div className="admin-list">
            {disputes.map((dispute) => (
              <article key={dispute.id} className="admin-list-item">
                <div>
                  <strong>{dispute.jobTitle}</strong>
                  <span>
                    {dispute.client} vs {dispute.freelancer} - ${dispute.amount} - {dispute.reason}
                  </span>
                  <small>Evidence: {dispute.evidence.join(", ")}</small>
                </div>
                <StatusBadge value={dispute.status} />
                <div className="admin-row-actions">
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

        <section className="admin-card admin-wide">
          <div className="admin-section-header">
            <h3>Audit log</h3>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.createdAt}</td>
                    <td>{entry.action}</td>
                    <td>{entry.target}</td>
                    <td>{entry.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
}
