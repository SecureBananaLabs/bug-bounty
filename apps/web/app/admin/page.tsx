"use client";

import { useMemo, useState } from "react";

type UserStatus = "active" | "under_review" | "suspended" | "banned";
type ListingStatus = "pending" | "approved" | "rejected" | "escalated";
type DisputeStatus = "open" | "under_review" | "resolved";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "client" | "freelancer";
  status: UserStatus;
  joinedAt: string;
  activeJobs: number;
  disputes: number;
  trustScore: number;
};

type FlaggedListing = {
  id: string;
  title: string;
  postedBy: string;
  reason: string;
  severity: "low" | "medium" | "high";
  status: ListingStatus;
};

type Dispute = {
  id: string;
  client: string;
  freelancer: string;
  amount: number;
  status: DisputeStatus;
  evidence: string[];
  ruling?: string;
};

type AuditEntry = {
  id: string;
  action: string;
  target: string;
  createdAt: string;
};

const initialUsers: AdminUser[] = [
  {
    id: "usr_1001",
    name: "Maya Chen",
    email: "maya@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-03-14",
    activeJobs: 4,
    disputes: 0,
    trustScore: 94
  },
  {
    id: "usr_1002",
    name: "Northwind Labs",
    email: "ops@northwind.test",
    role: "client",
    status: "under_review",
    joinedAt: "2026-02-02",
    activeJobs: 7,
    disputes: 2,
    trustScore: 61
  },
  {
    id: "usr_1003",
    name: "Jordan Patel",
    email: "jordan@example.com",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2026-01-22",
    activeJobs: 1,
    disputes: 1,
    trustScore: 42
  }
];

const initialListings: FlaggedListing[] = [
  {
    id: "flag_2001",
    title: "Scrape private marketplace data",
    postedBy: "Northwind Labs",
    reason: "Automated policy flagged possible ToS violation",
    severity: "high",
    status: "pending"
  },
  {
    id: "flag_2002",
    title: "Build a product onboarding flow",
    postedBy: "Atlas Apps",
    reason: "User report: unclear payment terms",
    severity: "medium",
    status: "pending"
  }
];

const initialDisputes: Dispute[] = [
  {
    id: "dsp_3001",
    client: "Northwind Labs",
    freelancer: "Maya Chen",
    amount: 2400,
    status: "open",
    evidence: ["delivery.zip", "scope-change.pdf"]
  },
  {
    id: "dsp_3002",
    client: "BrightDesk",
    freelancer: "Jordan Patel",
    amount: 850,
    status: "under_review",
    evidence: ["invoice.pdf"]
  }
];

export default function AdminPanelPage() {
  const [users, setUsers] = useState(initialUsers);
  const [listings, setListings] = useState(initialListings);
  const [disputes, setDisputes] = useState(initialDisputes);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [registrationsEnabled, setRegistrationsEnabled] = useState(true);
  const [jobPostingEnabled, setJobPostingEnabled] = useState(true);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = !query || `${user.name} ${user.email}`.toLowerCase().includes(query);
      const matchesRole = role === "all" || user.role === role;
      const matchesStatus = status === "all" || user.status === status;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [role, search, status, users]);

  const metrics = useMemo(
    () => [
      ["Total users", users.length.toString()],
      ["Active jobs", users.reduce((total, user) => total + user.activeJobs, 0).toString()],
      ["Open disputes", disputes.filter((dispute) => dispute.status !== "resolved").length.toString()],
      ["Flagged listings", listings.filter((listing) => listing.status === "pending").length.toString()],
      ["Revenue", "$128,900"]
    ],
    [disputes, listings, users]
  );

  function record(action: string, target: string) {
    setAudit((entries) => [
      { id: `aud_${entries.length + 1}`, action, target, createdAt: new Date().toISOString() },
      ...entries
    ]);
  }

  function setUserStatus(userId: string, nextStatus: UserStatus) {
    setUsers((items) => items.map((user) => (user.id === userId ? { ...user, status: nextStatus } : user)));
    record(`user.${nextStatus}`, userId);
  }

  function moderateListing(listingId: string, nextStatus: ListingStatus) {
    setListings((items) =>
      items.map((listing) => (listing.id === listingId ? { ...listing, status: nextStatus } : listing))
    );
    record(`listing.${nextStatus}`, listingId);
  }

  function ruleDispute(disputeId: string, ruling: string) {
    setDisputes((items) =>
      items.map((dispute) =>
        dispute.id === disputeId ? { ...dispute, status: "resolved", ruling } : dispute
      )
    );
    record("dispute.resolved", disputeId);
  }

  function toggleControl(name: "registrations" | "jobs", enabled: boolean) {
    const label = name === "registrations" ? "new user registrations" : "new job postings";
    if (!window.confirm(`Confirm ${enabled ? "enabling" : "disabling"} ${label}?`)) {
      return;
    }

    if (name === "registrations") {
      setRegistrationsEnabled(enabled);
    } else {
      setJobPostingEnabled(enabled);
    }
    record(`control.${enabled ? "enabled" : "disabled"}`, name);
  }

  return (
    <section className="admin-shell" aria-labelledby="admin-title">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Admin workspace</p>
          <h2 id="admin-title">Platform Control Center</h2>
        </div>
        <div className="status-pill" role="status">
          Admin access verified
        </div>
      </header>

      <section className="metric-grid" aria-label="Platform metrics">
        {metrics.map(([label, value]) => (
          <div className="metric-tile" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </section>

      <section className="admin-section" aria-labelledby="users-title">
        <div className="section-heading">
          <h3 id="users-title">Users</h3>
          <div className="filters">
            <input
              aria-label="Search users"
              placeholder="Search users"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select aria-label="Filter by role" value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="all">All roles</option>
              <option value="client">Clients</option>
              <option value="freelancer">Freelancers</option>
            </select>
            <select
              aria-label="Filter by status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="under_review">Under review</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table>
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
                  <td>{user.status.replace("_", " ")}</td>
                  <td>{user.activeJobs}</td>
                  <td>{user.disputes}</td>
                  <td>{user.trustScore}</td>
                  <td className="actions">
                    <button onClick={() => setUserStatus(user.id, "active")}>Reinstate</button>
                    <button onClick={() => setUserStatus(user.id, "suspended")}>Suspend</button>
                    <button onClick={() => setUserStatus(user.id, "banned")}>Ban</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-grid">
        <div className="admin-section">
          <h3>Moderation</h3>
          {listings.map((listing) => (
            <article className="queue-item" key={listing.id}>
              <div>
                <strong>{listing.title}</strong>
                <span>{listing.postedBy} · {listing.severity} · {listing.status}</span>
                <p>{listing.reason}</p>
              </div>
              <div className="actions">
                <button onClick={() => moderateListing(listing.id, "approved")}>Approve</button>
                <button onClick={() => moderateListing(listing.id, "rejected")}>Reject</button>
                <button onClick={() => moderateListing(listing.id, "escalated")}>Escalate</button>
              </div>
            </article>
          ))}
        </div>

        <div className="admin-section">
          <h3>Disputes</h3>
          {disputes.map((dispute) => (
            <article className="queue-item" key={dispute.id}>
              <div>
                <strong>{dispute.client} vs {dispute.freelancer}</strong>
                <span>${dispute.amount} · {dispute.status}</span>
                <p>Evidence: {dispute.evidence.join(", ")}</p>
                {dispute.ruling ? <p>Ruling: {dispute.ruling}</p> : null}
              </div>
              <div className="actions">
                <button onClick={() => ruleDispute(dispute.id, "client")}>Client</button>
                <button onClick={() => ruleDispute(dispute.id, "freelancer")}>Freelancer</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-grid">
        <div className="admin-section">
          <h3>Controls</h3>
          <label className="toggle-row">
            <span>New user registrations</span>
            <input
              type="checkbox"
              checked={registrationsEnabled}
              onChange={(event) => toggleControl("registrations", event.target.checked)}
            />
          </label>
          <label className="toggle-row">
            <span>New job postings</span>
            <input
              type="checkbox"
              checked={jobPostingEnabled}
              onChange={(event) => toggleControl("jobs", event.target.checked)}
            />
          </label>
        </div>

        <div className="admin-section">
          <h3>Audit Log</h3>
          {audit.length === 0 ? (
            <p className="empty-state">No actions recorded in this session.</p>
          ) : (
            <ul className="audit-list">
              {audit.map((entry) => (
                <li key={entry.id}>
                  <strong>{entry.action}</strong>
                  <span>{entry.target} · {new Date(entry.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </section>
  );
}
