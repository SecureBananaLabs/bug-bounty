"use client";

import { useMemo, useState } from "react";

type UserStatus = "active" | "suspended" | "banned";
type ListingStatus = "flagged" | "under_review" | "approved" | "rejected" | "escalated";
type DisputeStatus = "open" | "under_review" | "resolved";

const initialUsers = [
  { id: "usr_client_1", name: "Maya Chen", role: "client", status: "active" as UserStatus, joined: "2026-01-14", trust: 92 },
  { id: "usr_freelancer_1", name: "Jordan Ortiz", role: "freelancer", status: "active" as UserStatus, joined: "2026-02-03", trust: 84 },
  { id: "usr_client_2", name: "Ari Patel", role: "client", status: "suspended" as UserStatus, joined: "2026-03-22", trust: 48 },
  { id: "usr_freelancer_2", name: "Lena Ruiz", role: "freelancer", status: "active" as UserStatus, joined: "2026-04-10", trust: 76 }
];

const initialListings = [
  { id: "mod_201", title: "Urgent crypto wallet recovery", status: "flagged" as ListingStatus, reason: "High-risk payment language" },
  { id: "mod_202", title: "Scrape gated marketplace data", status: "under_review" as ListingStatus, reason: "Possible terms-of-service violation" }
];

const initialDisputes = [
  { id: "dsp_301", job: "AI support widget", status: "open" as DisputeStatus, amount: 1500, evidence: 2 },
  { id: "dsp_302", job: "API migration", status: "under_review" as DisputeStatus, amount: 640, evidence: 1 }
];

export default function AdminPanelPage() {
  const [users, setUsers] = useState(initialUsers);
  const [listings, setListings] = useState(initialListings);
  const [disputes, setDisputes] = useState(initialDisputes);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [registrationsEnabled, setRegistrationsEnabled] = useState(true);
  const [jobPostingEnabled, setJobPostingEnabled] = useState(true);
  const [audit, setAudit] = useState([
    "usr_admin_seed viewed controls",
    "usr_admin_seed loaded moderation queue"
  ]);

  const visibleUsers = useMemo(
    () => users.filter((user) => (roleFilter === "all" || user.role === roleFilter) && (statusFilter === "all" || user.status === statusFilter)),
    [roleFilter, statusFilter, users]
  );

  const metrics = [
    ["Total users", users.length],
    ["Active jobs", 4],
    ["Open disputes", disputes.filter((dispute) => dispute.status !== "resolved").length],
    ["Flagged listings", listings.filter((listing) => !["approved", "rejected"].includes(listing.status)).length],
    ["Revenue", "$128.9k"]
  ];

  function log(action: string) {
    setAudit((items) => [`auruminternum ${action} at ${new Date().toISOString()}`, ...items]);
  }

  function updateUser(id: string, status: UserStatus) {
    setUsers((items) => items.map((user) => (user.id === id ? { ...user, status } : user)));
    log(`${status} ${id}`);
  }

  function updateListing(id: string, status: ListingStatus) {
    setListings((items) => items.map((listing) => (listing.id === id ? { ...listing, status } : listing)));
    log(`${status} listing ${id}`);
  }

  function ruleDispute(id: string, status: DisputeStatus) {
    setDisputes((items) => items.map((dispute) => (dispute.id === id ? { ...dispute, status } : dispute)));
    log(`${status} dispute ${id}`);
  }

  function confirmControl(label: string, value: boolean, apply: (next: boolean) => void) {
    if (window.confirm(`Apply ${label}: ${value ? "enabled" : "disabled"}?`)) {
      apply(value);
      log(`updated ${label}`);
    }
  }

  return (
    <section className="admin-shell" aria-label="Admin operations panel">
      <div className="admin-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h2>Operations Console</h2>
        </div>
        <button type="button" onClick={() => log("refreshed dashboard")}>Refresh</button>
      </div>

      <div className="metric-grid" aria-label="Platform metrics">
        {metrics.map(([label, value]) => (
          <div className="metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="admin-layout">
        <section className="admin-panel" aria-labelledby="users-heading">
          <div className="panel-title">
            <h3 id="users-heading">Users</h3>
            <div className="filters">
              <select aria-label="Filter users by role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                <option value="all">All roles</option>
                <option value="client">Clients</option>
                <option value="freelancer">Freelancers</option>
              </select>
              <select aria-label="Filter users by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">All status</option>
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}<br /><small>{user.joined}</small></td>
                  <td>{user.role}</td>
                  <td><span className={`pill ${user.status}`}>{user.status}</span></td>
                  <td>{user.trust}</td>
                  <td className="actions">
                    <button type="button" onClick={() => updateUser(user.id, "active")}>Reinstate</button>
                    <button type="button" onClick={() => updateUser(user.id, "suspended")}>Suspend</button>
                    <button type="button" onClick={() => updateUser(user.id, "banned")}>Ban</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="admin-panel" aria-labelledby="moderation-heading">
          <h3 id="moderation-heading">Moderation</h3>
          {listings.map((listing) => (
            <div className="queue-row" key={listing.id}>
              <div>
                <strong>{listing.title}</strong>
                <p>{listing.reason}</p>
                <span className={`pill ${listing.status}`}>{listing.status}</span>
              </div>
              <div className="actions">
                <button type="button" onClick={() => updateListing(listing.id, "approved")}>Approve</button>
                <button type="button" onClick={() => updateListing(listing.id, "rejected")}>Reject</button>
                <button type="button" onClick={() => updateListing(listing.id, "escalated")}>Escalate</button>
              </div>
            </div>
          ))}
        </section>

        <section className="admin-panel" aria-labelledby="disputes-heading">
          <h3 id="disputes-heading">Disputes</h3>
          {disputes.map((dispute) => (
            <div className="queue-row" key={dispute.id}>
              <div>
                <strong>{dispute.job}</strong>
                <p>${dispute.amount} · {dispute.evidence} evidence files</p>
                <span className={`pill ${dispute.status}`}>{dispute.status}</span>
              </div>
              <div className="actions">
                <button type="button" onClick={() => ruleDispute(dispute.id, "under_review")}>Review</button>
                <button type="button" onClick={() => ruleDispute(dispute.id, "resolved")}>Resolve</button>
              </div>
            </div>
          ))}
        </section>

        <section className="admin-panel" aria-labelledby="controls-heading">
          <h3 id="controls-heading">Controls</h3>
          <label className="toggle">
            <span>Registrations</span>
            <input
              aria-label="Toggle registrations"
              checked={registrationsEnabled}
              onChange={(event) => confirmControl("registrations", event.target.checked, setRegistrationsEnabled)}
              type="checkbox"
            />
          </label>
          <label className="toggle">
            <span>Job posting</span>
            <input
              aria-label="Toggle job posting"
              checked={jobPostingEnabled}
              onChange={(event) => confirmControl("job posting", event.target.checked, setJobPostingEnabled)}
              type="checkbox"
            />
          </label>
        </section>

        <section className="admin-panel" aria-labelledby="audit-heading">
          <h3 id="audit-heading">Audit Log</h3>
          <ol className="audit-log">
            {audit.map((event) => (
              <li key={event}>{event}</li>
            ))}
          </ol>
        </section>
      </div>
    </section>
  );
}
