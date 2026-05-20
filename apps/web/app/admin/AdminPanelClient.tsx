"use client";

import { useMemo, useState } from "react";

const users = [
  { id: "usr_001", name: "Maya Chen", role: "freelancer", status: "active", joinedAt: "2026-04-02", trustScore: 94, jobs: 2, disputes: 1 },
  { id: "usr_002", name: "Jordan Blake", role: "client", status: "active", joinedAt: "2026-04-11", trustScore: 82, jobs: 1, disputes: 0 },
  { id: "usr_003", name: "Sam Rivera", role: "freelancer", status: "suspended", joinedAt: "2026-05-03", trustScore: 51, jobs: 0, disputes: 1 }
];

const flaggedListings = [
  { id: "flag_001", title: "Scrape private marketplace leads", severity: "high", status: "flagged", reason: "Consent risk" },
  { id: "flag_002", title: "Fix checkout webhook retries", severity: "medium", status: "under_review", reason: "Payment keyword review" }
];

const disputes = [
  { id: "dsp_001", job: "AI support widget", status: "open", amount: "$1,500", parties: "Maya Chen / Jordan Blake" },
  { id: "dsp_002", job: "Design SaaS onboarding", status: "under_review", amount: "$900", parties: "Sam Rivera / Priya Shah" }
];

const initialAudit = [
  { id: "aud_001", admin: "system", action: "seed", target: "initial", createdAt: "2026-05-17 00:00" }
];

export function AdminPanelClient() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [audit, setAudit] = useState(initialAudit);
  const [registrationsEnabled, setRegistrationsEnabled] = useState(true);
  const [jobPostingEnabled, setJobPostingEnabled] = useState(true);
  const [lastRefresh, setLastRefresh] = useState("Loaded now");

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) || user.id.includes(search);
      const matchesRole = role === "all" || user.role === role;
      const matchesStatus = status === "all" || user.status === status;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [role, search, status]);

  const recordAction = (action: string, target: string) => {
    setAudit((entries) => [
      {
        id: `aud_${String(entries.length + 1).padStart(3, "0")}`,
        admin: "demo-admin",
        action,
        target,
        createdAt: new Date().toISOString().slice(0, 16).replace("T", " ")
      },
      ...entries
    ]);
  };

  const confirmToggle = (label: string, nextValue: boolean, apply: () => void) => {
    if (window.confirm(`Confirm ${label} ${nextValue ? "enable" : "disable"}?`)) {
      apply();
      recordAction(`platform.${label}.${nextValue ? "enabled" : "disabled"}`, "platform-controls");
    }
  };

  return (
    <section aria-labelledby="admin-heading">
      <div className="admin-header">
        <div>
          <h2 id="admin-heading">Admin Operations</h2>
          <p>Admin-only workspace for user safety, moderation, disputes, platform controls, and audit history.</p>
        </div>
        <button
          aria-label="Refresh admin data"
          className="admin-button"
          onClick={() => {
            setLastRefresh(new Date().toLocaleTimeString());
            recordAction("dashboard.refreshed", "admin-dashboard");
          }}
        >
          Refresh
        </button>
      </div>

      <p className="admin-muted" aria-live="polite">
        {lastRefresh}
      </p>

      <div className="admin-metrics" aria-label="Trust and metrics dashboard">
        <Metric label="Total users" value="4" />
        <Metric label="Active jobs" value="4" />
        <Metric label="Open disputes" value="2" />
        <Metric label="Flagged listings" value="2" />
        <Metric label="Revenue" value="$128,900" />
      </div>

      <div className="admin-grid">
        <section className="card admin-panel" aria-labelledby="users-heading">
          <h3 id="users-heading">User Management</h3>
          <div className="admin-toolbar">
            <label>
              Search
              <input aria-label="Search users" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            <label>
              Role
              <select aria-label="Filter users by role" value={role} onChange={(event) => setRole(event.target.value)}>
                <option value="all">All</option>
                <option value="client">Clients</option>
                <option value="freelancer">Freelancers</option>
              </select>
            </label>
            <label>
              Status
              <select aria-label="Filter users by status" value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </select>
            </label>
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
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No users match the current filters.</td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <strong>{user.name}</strong>
                        <span>{user.id} / joined {user.joinedAt}</span>
                        <span>{user.jobs} active jobs / {user.disputes} disputes</span>
                      </td>
                      <td>{user.role}</td>
                      <td>{user.status}</td>
                      <td>{user.trustScore}</td>
                      <td>
                        <div className="admin-actions">
                          <button onClick={() => recordAction("user.suspended", user.id)}>Suspend</button>
                          <button onClick={() => recordAction("user.active", user.id)}>Reinstate</button>
                          <button onClick={() => recordAction("user.banned", user.id)}>Ban</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card admin-panel" aria-labelledby="moderation-heading">
          <h3 id="moderation-heading">Job Moderation</h3>
          {flaggedListings.map((listing) => (
            <article className="admin-row" key={listing.id}>
              <div>
                <strong>{listing.title}</strong>
                <span>{listing.severity} severity / {listing.reason}</span>
              </div>
              <div className="admin-actions">
                <button onClick={() => recordAction("listing.approved", listing.id)}>Approve</button>
                <button onClick={() => recordAction("listing.rejected", listing.id)}>Reject</button>
                <button onClick={() => recordAction("listing.escalated", listing.id)}>Escalate</button>
              </div>
            </article>
          ))}
        </section>

        <section className="card admin-panel" aria-labelledby="disputes-heading">
          <h3 id="disputes-heading">Dispute Resolution</h3>
          {disputes.map((dispute) => (
            <article className="admin-row" key={dispute.id}>
              <div>
                <strong>{dispute.job}</strong>
                <span>{dispute.parties} / {dispute.amount} / {dispute.status}</span>
              </div>
              <div className="admin-actions">
                <button onClick={() => recordAction("dispute.freelancer", dispute.id)}>Freelancer</button>
                <button onClick={() => recordAction("dispute.client", dispute.id)}>Client</button>
                <button onClick={() => recordAction("dispute.refund", dispute.id)}>Refund</button>
                <button onClick={() => recordAction("dispute.escalated", dispute.id)}>Escalate</button>
              </div>
            </article>
          ))}
        </section>

        <section className="card admin-panel" aria-labelledby="controls-heading">
          <h3 id="controls-heading">Platform Controls</h3>
          <div className="control-row">
            <span>New user registrations</span>
            <button
              aria-pressed={registrationsEnabled}
              onClick={() =>
                confirmToggle("registrations", !registrationsEnabled, () => setRegistrationsEnabled((value) => !value))
              }
            >
              {registrationsEnabled ? "Enabled" : "Disabled"}
            </button>
          </div>
          <div className="control-row">
            <span>New job postings</span>
            <button
              aria-pressed={jobPostingEnabled}
              onClick={() => confirmToggle("job-posting", !jobPostingEnabled, () => setJobPostingEnabled((value) => !value))}
            >
              {jobPostingEnabled ? "Enabled" : "Disabled"}
            </button>
          </div>
        </section>

        <section className="card admin-panel" aria-labelledby="trust-heading">
          <h3 id="trust-heading">Trust Distribution</h3>
          {[
            ["90-100", 1],
            ["70-89", 2],
            ["50-69", 1],
            ["0-49", 0]
          ].map(([range, count]) => (
            <div className="trust-row" key={range}>
              <span>{range}</span>
              <meter min={0} max={4} value={Number(count)} aria-label={`Trust score ${range}`} />
              <span>{count}</span>
            </div>
          ))}
        </section>

        <section className="card admin-panel" aria-labelledby="audit-heading">
          <h3 id="audit-heading">Audit Log</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Target</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.createdAt}</td>
                    <td>{entry.admin}</td>
                    <td>{entry.action}</td>
                    <td>{entry.target}</td>
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="card admin-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
