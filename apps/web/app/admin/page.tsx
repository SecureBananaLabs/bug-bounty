"use client";

import { useMemo, useState } from "react";

const metrics = [
  ["Total users", "287"],
  ["Active jobs", "42"],
  ["Open disputes", "6"],
  ["Flagged listings", "9"],
  ["Monthly volume", "$128.9k"]
];

const trustBands = [
  { band: "90-100", count: 84 },
  { band: "75-89", count: 132 },
  { band: "50-74", count: 56 },
  { band: "under 50", count: 15 }
];

const users = [
  {
    id: "user-41",
    name: "Maya Chen",
    role: "freelancer",
    status: "active",
    joined: "Feb 14",
    jobs: 4,
    disputes: 0,
    trust: 96
  },
  {
    id: "user-77",
    name: "Northstar Growth",
    role: "client",
    status: "suspended",
    joined: "Apr 3",
    jobs: 1,
    disputes: 2,
    trust: 48
  },
  {
    id: "user-93",
    name: "Jordan Park",
    role: "freelancer",
    status: "review",
    joined: "Mar 19",
    jobs: 2,
    disputes: 1,
    trust: 71
  }
];

const flaggedListings = [
  ["job-318", "Recover a locked wallet seed phrase", "high", "Rejected"],
  ["job-322", "Scrape private community member list", "medium", "Escalated"],
  ["job-327", "Clone a competitor lead list", "medium", "Needs review"]
];

const disputes = [
  ["disp-204", "Northstar Growth", "Jordan Park", "$1,800", "under_review"],
  ["disp-209", "Beacon Labs", "Maya Chen", "$640", "open"]
];

const auditLog = [
  ["18:42", "admin-2", "listing.rejected", "Credential recovery language"],
  ["16:10", "admin-1", "user.suspended", "Chargeback risk review"],
  ["14:22", "admin-1", "dispute.escalated", "Needs senior admin ruling"]
];

export default function AdminPanelPage() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [registrationsEnabled, setRegistrationsEnabled] = useState(true);
  const [jobPostingsEnabled, setJobPostingsEnabled] = useState(true);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesRole = role === "all" || user.role === role;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [user.name, user.id, user.status].some((value) =>
          value.toLowerCase().includes(normalizedQuery)
        );
      return matchesRole && matchesQuery;
    });
  }, [query, role]);

  function confirmToggle(label: string, enabled: boolean, commit: (value: boolean) => void) {
    const nextState = enabled ? "pause" : "resume";
    if (window.confirm(`${nextState} ${label}? This will be added to the audit log.`)) {
      commit(!enabled);
    }
  }

  return (
    <section className="admin-shell" aria-labelledby="admin-title">
      <div className="admin-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h1 id="admin-title">Admin Panel</h1>
        </div>
        <button className="admin-button" type="button">
          Refresh
        </button>
      </div>

      <div className="metric-grid" aria-label="Admin metrics">
        {metrics.map(([label, value]) => (
          <article className="metric-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <div className="admin-layout">
        <div className="admin-main">
          <section className="panel" aria-labelledby="users-heading">
            <div className="panel-header">
              <h2 id="users-heading">Users</h2>
              <div className="filters">
                <input
                  aria-label="Search users"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search users"
                  type="search"
                />
                <select
                  aria-label="Filter by role"
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                >
                  <option value="all">All roles</option>
                  <option value="client">Clients</option>
                  <option value="freelancer">Freelancers</option>
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
                    <th>Trust</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <strong>{user.name}</strong>
                        <span>{user.id} - joined {user.joined}</span>
                      </td>
                      <td>{user.role}</td>
                      <td>
                        <span className={`status status-${user.status}`}>{user.status}</span>
                      </td>
                      <td>{user.trust}</td>
                      <td>
                        <div className="row-actions">
                          <button type="button">View</button>
                          <button type="button">Suspend</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel" aria-labelledby="moderation-heading">
            <div className="panel-header">
              <h2 id="moderation-heading">Moderation</h2>
              <span className="count-pill">{flaggedListings.length} flagged</span>
            </div>
            <div className="queue-list">
              {flaggedListings.map(([id, title, severity, state]) => (
                <article className="queue-item" key={id}>
                  <div>
                    <strong>{title}</strong>
                    <span>{id} - {severity} severity</span>
                  </div>
                  <div className="row-actions">
                    <button type="button">Approve</button>
                    <button type="button">Reject</button>
                    <button type="button">Escalate</button>
                  </div>
                  <span className="status">{state}</span>
                </article>
              ))}
            </div>
          </section>

          <section className="panel" aria-labelledby="disputes-heading">
            <div className="panel-header">
              <h2 id="disputes-heading">Disputes</h2>
              <span className="count-pill">{disputes.length} open</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Dispute</th>
                    <th>Client</th>
                    <th>Freelancer</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {disputes.map(([id, client, freelancer, amount, state]) => (
                    <tr key={id}>
                      <td>{id}</td>
                      <td>{client}</td>
                      <td>{freelancer}</td>
                      <td>{amount}</td>
                      <td><span className="status">{state}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="admin-side" aria-label="Platform status">
          <section className="panel">
            <h2>Trust</h2>
            <div className="trust-stack">
              {trustBands.map((band) => (
                <div className="trust-row" key={band.band}>
                  <span>{band.band}</span>
                  <div><i style={{ width: `${(band.count / 132) * 100}%` }} /></div>
                  <strong>{band.count}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>Controls</h2>
            <label className="switch-row">
              <span>Registrations</span>
              <button
                aria-pressed={registrationsEnabled}
                className={registrationsEnabled ? "switch is-on" : "switch"}
                onClick={() =>
                  confirmToggle("registrations", registrationsEnabled, setRegistrationsEnabled)
                }
                type="button"
              >
                {registrationsEnabled ? "On" : "Off"}
              </button>
            </label>
            <label className="switch-row">
              <span>Job postings</span>
              <button
                aria-pressed={jobPostingsEnabled}
                className={jobPostingsEnabled ? "switch is-on" : "switch"}
                onClick={() =>
                  confirmToggle("job postings", jobPostingsEnabled, setJobPostingsEnabled)
                }
                type="button"
              >
                {jobPostingsEnabled ? "On" : "Off"}
              </button>
            </label>
          </section>

          <section className="panel">
            <h2>Audit Log</h2>
            <div className="audit-list">
              {auditLog.map(([time, admin, action, reason]) => (
                <article key={`${time}-${action}`}>
                  <strong>{action}</strong>
                  <span>{time} - {admin}</span>
                  <p>{reason}</p>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
