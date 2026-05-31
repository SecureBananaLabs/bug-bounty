"use client";

import { useMemo, useState } from "react";

type UserStatus = "active" | "suspended" | "banned";
type ListingStatus = "flagged" | "under_review" | "approved" | "rejected" | "escalated";
type DisputeStatus = "open" | "under_review" | "resolved" | "escalated";

const initialUsers = [
  { id: "usr_client_001", name: "Avery Chen", role: "client", status: "active" as UserStatus, joinedAt: "2026-05-02", trustScore: 92, activeJobs: 3, disputes: 0 },
  { id: "usr_freelancer_002", name: "Maya Patel", role: "freelancer", status: "active" as UserStatus, joinedAt: "2026-05-06", trustScore: 88, activeJobs: 2, disputes: 1 },
  { id: "usr_client_003", name: "Jon Bell", role: "client", status: "suspended" as UserStatus, joinedAt: "2026-04-18", trustScore: 61, activeJobs: 1, disputes: 2 }
];

const initialListings = [
  { id: "job_flag_101", title: "Build an AI customer support widget", status: "flagged" as ListingStatus, reason: "Budget changed twice after proposals opened", reporter: "automated-rules" },
  { id: "job_flag_102", title: "Scrape protected profiles at scale", status: "under_review" as ListingStatus, reason: "Potential platform policy violation", reporter: "user-report" }
];

const initialDisputes = [
  { id: "dsp_201", jobId: "job-102", amount: 840, status: "open" as DisputeStatus, evidenceCount: 4, threadPreview: "Milestone accepted but final invoice is disputed." },
  { id: "dsp_202", jobId: "job-103", amount: 320, status: "under_review" as DisputeStatus, evidenceCount: 2, threadPreview: "Scope changed after delivery and both parties uploaded notes." }
];

export default function AdminPanelPage() {
  const [users, setUsers] = useState(initialUsers);
  const [listings, setListings] = useState(initialListings);
  const [disputes, setDisputes] = useState(initialDisputes);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [registrationsOpen, setRegistrationsOpen] = useState(true);
  const [jobPostingOpen, setJobPostingOpen] = useState(true);
  const [auditLog, setAuditLog] = useState([
    "system seeded admin panel data"
  ]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const roleMatches = roleFilter === "all" || user.role === roleFilter;
      const statusMatches = statusFilter === "all" || user.status === statusFilter;
      return roleMatches && statusMatches;
    });
  }, [roleFilter, statusFilter, users]);

  const metrics = {
    totalUsers: users.length,
    activeJobs: users.reduce((sum, user) => sum + user.activeJobs, 0),
    openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
    flaggedListings: listings.filter((listing) => listing.status !== "approved").length,
    revenue: "$128.9k"
  };

  function writeAudit(message: string) {
    setAuditLog((entries) => [`admin-demo ${new Date().toISOString()} ${message}`, ...entries]);
  }

  function setUserStatus(userId: string, status: UserStatus) {
    if (!window.confirm(`Apply ${status} to ${userId}?`)) return;
    setUsers((rows) => rows.map((user) => (user.id === userId ? { ...user, status } : user)));
    writeAudit(`user.${status} ${userId}`);
  }

  function setListingStatus(listingId: string, status: ListingStatus) {
    if (!window.confirm(`Move listing ${listingId} to ${status}?`)) return;
    setListings((rows) => rows.map((listing) => (listing.id === listingId ? { ...listing, status } : listing)));
    writeAudit(`listing.${status} ${listingId}`);
  }

  function setDisputeStatus(disputeId: string, status: DisputeStatus) {
    if (!window.confirm(`Move dispute ${disputeId} to ${status}?`)) return;
    setDisputes((rows) => rows.map((dispute) => (dispute.id === disputeId ? { ...dispute, status } : dispute)));
    writeAudit(`dispute.${status} ${disputeId}`);
  }

  function toggleControl(control: "registrations" | "jobs") {
    const label = control === "registrations" ? "new registrations" : "new job postings";
    if (!window.confirm(`Toggle ${label}?`)) return;
    if (control === "registrations") {
      setRegistrationsOpen((value) => !value);
      writeAudit(`control.registrations.${registrationsOpen ? "disabled" : "enabled"}`);
    } else {
      setJobPostingOpen((value) => !value);
      writeAudit(`control.jobPostings.${jobPostingOpen ? "disabled" : "enabled"}`);
    }
  }

  return (
    <section className="admin-page" aria-label="Admin operations panel">
      <div className="admin-header">
        <div>
          <h2>Admin Operations</h2>
          <p>Moderate users, jobs, disputes, trust signals, platform controls, and audit history from one operational surface.</p>
        </div>
        <button type="button" onClick={() => writeAudit("manual.refresh")} aria-label="Refresh admin dashboard data">
          Refresh
        </button>
      </div>

      <div className="admin-metrics" aria-label="Platform metrics">
        {Object.entries(metrics).map(([label, value]) => (
          <div className="admin-metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="admin-section">
        <div className="admin-section-heading">
          <h3>User Management</h3>
          <div className="admin-filters">
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} aria-label="Filter users by role">
              <option value="all">All roles</option>
              <option value="client">Clients</option>
              <option value="freelancer">Freelancers</option>
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter users by status">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Trust</th>
              <th>Jobs</th>
              <th>Disputes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.name}<br /><span>{user.id}</span></td>
                <td>{user.role}</td>
                <td>{user.status}</td>
                <td>{user.trustScore}</td>
                <td>{user.activeJobs}</td>
                <td>{user.disputes}</td>
                <td>
                  <button type="button" onClick={() => setUserStatus(user.id, "suspended")}>Suspend</button>
                  <button type="button" onClick={() => setUserStatus(user.id, "active")}>Reinstate</button>
                  <button type="button" onClick={() => setUserStatus(user.id, "banned")}>Ban</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-columns">
        <div className="admin-section">
          <h3>Job Moderation</h3>
          {listings.map((listing) => (
            <article className="admin-row" key={listing.id}>
              <strong>{listing.title}</strong>
              <span>{listing.status} | {listing.reporter}</span>
              <p>{listing.reason}</p>
              <div>
                <button type="button" onClick={() => setListingStatus(listing.id, "approved")}>Approve</button>
                <button type="button" onClick={() => setListingStatus(listing.id, "rejected")}>Reject</button>
                <button type="button" onClick={() => setListingStatus(listing.id, "escalated")}>Escalate</button>
              </div>
            </article>
          ))}
        </div>

        <div className="admin-section">
          <h3>Disputes</h3>
          {disputes.map((dispute) => (
            <article className="admin-row" key={dispute.id}>
              <strong>{dispute.id} | {dispute.jobId}</strong>
              <span>{dispute.status} | ${dispute.amount} | {dispute.evidenceCount} evidence items</span>
              <p>{dispute.threadPreview}</p>
              <div>
                <button type="button" onClick={() => setDisputeStatus(dispute.id, "under_review")}>Review</button>
                <button type="button" onClick={() => setDisputeStatus(dispute.id, "resolved")}>Resolve</button>
                <button type="button" onClick={() => setDisputeStatus(dispute.id, "escalated")}>Escalate</button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="admin-columns">
        <div className="admin-section">
          <h3>Platform Controls</h3>
          <label className="admin-toggle">
            <input type="checkbox" checked={registrationsOpen} onChange={() => toggleControl("registrations")} />
            New user registrations
          </label>
          <label className="admin-toggle">
            <input type="checkbox" checked={jobPostingOpen} onChange={() => toggleControl("jobs")} />
            New job postings
          </label>
        </div>

        <div className="admin-section">
          <h3>Audit Log</h3>
          <ol className="admin-audit">
            {auditLog.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
