"use client";

import { useMemo, useState } from "react";

type UserStatus = "active" | "suspended" | "banned";
type ListingStatus = "flagged" | "under_review" | "approved" | "rejected" | "escalated";
type DisputeStatus = "open" | "under_review" | "resolved";

const seedUsers = [
  { id: "usr_001", name: "Avery Client", role: "client", status: "active" as UserStatus, joinedAt: "2026-02-02", activeJobs: 3, disputes: 1, trustScore: 88 },
  { id: "usr_002", name: "Morgan Builder", role: "freelancer", status: "active" as UserStatus, joinedAt: "2026-01-14", activeJobs: 5, disputes: 0, trustScore: 94 },
  { id: "usr_003", name: "Riley Review", role: "freelancer", status: "suspended" as UserStatus, joinedAt: "2025-12-08", activeJobs: 1, disputes: 2, trustScore: 51 }
];

const seedListings = [
  { id: "job_flag_001", title: "Scrape private marketplace listings", reporter: "automated-risk-rules", status: "flagged" as ListingStatus, reason: "Potential platform bypass language" },
  { id: "job_flag_002", title: "Build analytics dashboard", reporter: "usr_002", status: "under_review" as ListingStatus, reason: "Payment terms unclear" }
];

const seedDisputes = [
  { id: "dsp_001", jobId: "job_441", parties: "Avery Client / Morgan Builder", status: "open" as DisputeStatus, amountUsd: 1200, evidenceCount: 4 },
  { id: "dsp_002", jobId: "job_502", parties: "Riley Review / Morgan Builder", status: "under_review" as DisputeStatus, amountUsd: 640, evidenceCount: 2 }
];

export default function AdminPanelPage() {
  const [viewerRole, setViewerRole] = useState("admin");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [users, setUsers] = useState(seedUsers);
  const [listings, setListings] = useState(seedListings);
  const [disputes, setDisputes] = useState(seedDisputes);
  const [registrationsEnabled, setRegistrationsEnabled] = useState(true);
  const [jobPostingsEnabled, setJobPostingsEnabled] = useState(true);
  const [audit, setAudit] = useState([
    { id: "aud_001", action: "listing.escalated", target: "job_flag_002", admin: "usr_admin", at: "2026-05-19T17:30:00Z" }
  ]);
  const [refreshCount, setRefreshCount] = useState(0);

  const isAdmin = viewerRole === "admin";
  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase();
    return users.filter((user) => {
      const matchesSearch = !term || `${user.name} ${user.id}`.toLowerCase().includes(term);
      const matchesRole = !roleFilter || user.role === roleFilter;
      const matchesStatus = !statusFilter || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roleFilter, search, statusFilter, users]);

  const metrics = useMemo(() => ({
    totalUsers: users.length,
    activeJobs: users.reduce((sum, user) => sum + user.activeJobs, 0),
    openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
    flaggedListings: listings.filter((listing) => listing.status !== "approved").length,
    revenue: "$128.9k"
  }), [disputes, listings, users]);

  function log(action: string, target: string) {
    setAudit((current) => [
      { id: `aud_${current.length + 1}`, action, target, admin: "usr_admin", at: new Date().toISOString() },
      ...current
    ]);
  }

  function setUserStatus(userId: string, status: UserStatus) {
    setUsers((current) => current.map((user) => (user.id === userId ? { ...user, status } : user)));
    log(`user.${status}`, userId);
  }

  function setListingStatus(listingId: string, status: ListingStatus) {
    setListings((current) => current.map((listing) => (listing.id === listingId ? { ...listing, status } : listing)));
    log(`listing.${status}`, listingId);
  }

  function ruleDispute(disputeId: string, ruling: "client" | "freelancer" | "escalate") {
    setDisputes((current) => current.map((dispute) => (
      dispute.id === disputeId
        ? { ...dispute, status: ruling === "escalate" ? "under_review" : "resolved" }
        : dispute
    )));
    log(`dispute.${ruling}`, disputeId);
  }

  function confirmToggle(label: string, enabled: boolean, apply: (enabled: boolean) => void) {
    if (window.confirm(`${enabled ? "Disable" : "Enable"} ${label}?`)) {
      apply(!enabled);
      log(`control.${label}`, label);
    }
  }

  if (!isAdmin) {
    return (
      <main className="admin-shell">
        <section className="admin-band">
          <h1>403</h1>
          <p>Admin access required.</p>
          <label>
            Viewer role
            <select value={viewerRole} onChange={(event) => setViewerRole(event.target.value)}>
              <option value="client">client</option>
              <option value="freelancer">freelancer</option>
              <option value="admin">admin</option>
            </select>
          </label>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <section className="admin-top">
        <div>
          <h1>Admin Panel</h1>
          <p>Users, listings, disputes, controls, and audit history.</p>
        </div>
        <div className="admin-actions">
          <label>
            Viewer role
            <select value={viewerRole} onChange={(event) => setViewerRole(event.target.value)} aria-label="Viewer role">
              <option value="admin">admin</option>
              <option value="client">client</option>
              <option value="freelancer">freelancer</option>
            </select>
          </label>
          <button type="button" onClick={() => setRefreshCount((count) => count + 1)}>Refresh</button>
        </div>
      </section>

      <section className="metric-grid" aria-label="Platform metrics">
        {Object.entries(metrics).map(([label, value]) => (
          <article key={label} className="metric">
            <span>{label.replace(/([A-Z])/g, " $1")}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="admin-band">
        <div className="section-head">
          <h2>User Management</h2>
          <span>Page 1 of 1</span>
        </div>
        <div className="filters">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users" aria-label="Search users" />
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} aria-label="Filter by role">
            <option value="">All roles</option>
            <option value="client">Clients</option>
            <option value="freelancer">Freelancers</option>
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
        </div>
        <table>
          <thead>
            <tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th>Profile</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.name}<small>{user.id}</small></td>
                <td>{user.role}</td>
                <td>{user.status}</td>
                <td>{user.joinedAt}</td>
                <td>{user.activeJobs} jobs / {user.disputes} disputes / trust {user.trustScore}</td>
                <td className="button-row">
                  <button type="button" onClick={() => setUserStatus(user.id, "suspended")}>Suspend</button>
                  <button type="button" onClick={() => setUserStatus(user.id, "active")}>Reinstate</button>
                  <button type="button" onClick={() => setUserStatus(user.id, "banned")}>Ban</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && <p className="empty">No users match the current filters.</p>}
      </section>

      <section className="two-column">
        <div className="admin-band">
          <div className="section-head"><h2>Job Moderation</h2><span>Server paginated</span></div>
          {listings.map((listing) => (
            <article key={listing.id} className="queue-row">
              <div><strong>{listing.title}</strong><small>{listing.reason} / {listing.reporter}</small></div>
              <span>{listing.status}</span>
              <div className="button-row">
                <button type="button" onClick={() => setListingStatus(listing.id, "approved")}>Approve</button>
                <button type="button" onClick={() => setListingStatus(listing.id, "rejected")}>Reject</button>
                <button type="button" onClick={() => setListingStatus(listing.id, "escalated")}>Escalate</button>
              </div>
            </article>
          ))}
        </div>

        <div className="admin-band">
          <div className="section-head"><h2>Disputes</h2><span>Evidence visible</span></div>
          {disputes.map((dispute) => (
            <article key={dispute.id} className="queue-row">
              <div><strong>{dispute.jobId}</strong><small>{dispute.parties} / {dispute.evidenceCount} evidence files / ${dispute.amountUsd}</small></div>
              <span>{dispute.status}</span>
              <div className="button-row">
                <button type="button" onClick={() => ruleDispute(dispute.id, "client")}>Client</button>
                <button type="button" onClick={() => ruleDispute(dispute.id, "freelancer")}>Freelancer</button>
                <button type="button" onClick={() => ruleDispute(dispute.id, "escalate")}>Escalate</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="two-column">
        <div className="admin-band">
          <h2>Platform Controls</h2>
          <button type="button" onClick={() => confirmToggle("registrationsEnabled", registrationsEnabled, setRegistrationsEnabled)}>
            Registrations: {registrationsEnabled ? "enabled" : "disabled"}
          </button>
          <button type="button" onClick={() => confirmToggle("jobPostingsEnabled", jobPostingsEnabled, setJobPostingsEnabled)}>
            Job postings: {jobPostingsEnabled ? "enabled" : "disabled"}
          </button>
          <p className="muted">Last refresh #{refreshCount}. Actions require confirmation and append audit rows.</p>
        </div>

        <div className="admin-band">
          <div className="section-head"><h2>Audit Log</h2><span>Append only</span></div>
          <table>
            <thead><tr><th>Action</th><th>Target</th><th>Admin</th><th>Time</th></tr></thead>
            <tbody>
              {audit.map((entry) => (
                <tr key={entry.id}><td>{entry.action}</td><td>{entry.target}</td><td>{entry.admin}</td><td>{entry.at}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
