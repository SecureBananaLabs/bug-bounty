"use client";

import { useMemo, useState } from "react";

const users = [
  { id: "usr_client_001", name: "Maya Chen", role: "client", status: "active", joinedAt: "2026-04-03", trust: 92 },
  { id: "usr_free_002", name: "Jordan Vale", role: "freelancer", status: "active", joinedAt: "2026-04-12", trust: 81 },
  { id: "usr_free_003", name: "Rina Patel", role: "freelancer", status: "suspended", joinedAt: "2026-03-21", trust: 46 }
];

const flaggedJobs = [
  { id: "flag_101", title: "Scrape private customer records", reason: "Potential privacy violation", status: "flagged" },
  { id: "flag_102", title: "Rush payment gateway review", reason: "Scope changed after acceptance", status: "under_review" }
];

const disputes = [
  { id: "disp_201", subject: "Milestone deliverable rejected after approval", status: "open", amount: "$1,800" },
  { id: "disp_202", subject: "Incomplete dashboard handoff", status: "under_review", amount: "$650" }
];

export default function AdminPanelPage() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [registrationsEnabled, setRegistrationsEnabled] = useState(true);
  const [jobPostingEnabled, setJobPostingEnabled] = useState(true);
  const [auditLog, setAuditLog] = useState([
    "system seeded admin state",
    "admin reviewed flagged listings",
    "admin refreshed trust metrics"
  ]);
  const [updatedAt, setUpdatedAt] = useState("Loaded");

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesQuery = user.name.toLowerCase().includes(query.toLowerCase());
      const matchesRole = role === "all" || user.role === role;
      return matchesQuery && matchesRole;
    });
  }, [query, role]);

  function record(action: string) {
    setAuditLog((entries) => [`admin ${action} at ${new Date().toLocaleTimeString()}`, ...entries]);
  }

  function confirmToggle(label: string, nextValue: boolean, apply: (value: boolean) => void) {
    if (window.confirm(`${label}: ${nextValue ? "enable" : "disable"}?`)) {
      apply(nextValue);
      record(`${nextValue ? "enabled" : "disabled"} ${label.toLowerCase()}`);
    }
  }

  return (
    <section className="admin-shell" aria-label="Admin panel">
      <div className="admin-toolbar">
        <div>
          <h2>Admin Panel</h2>
          <p>Operational view for users, listings, disputes, controls, and audit activity.</p>
        </div>
        <button
          aria-label="Refresh admin data"
          onClick={() => {
            setUpdatedAt(new Date().toLocaleTimeString());
            record("manually refreshed admin data");
          }}
        >
          Refresh
        </button>
      </div>

      <div className="metric-grid" aria-label="Trust and metrics dashboard">
        {[
          ["Total users", "4"],
          ["Active jobs", "10"],
          ["Open disputes", "2"],
          ["Flagged listings", "2"],
          ["Revenue", "$128,900"]
        ].map(([label, value]) => (
          <div className="metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="admin-section">
        <div className="section-head">
          <h3>User Management</h3>
          <span>{updatedAt}</span>
        </div>
        <div className="filters">
          <input
            aria-label="Search users"
            placeholder="Search users"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select aria-label="Filter users by role" value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="all">All roles</option>
            <option value="client">Clients</option>
            <option value="freelancer">Freelancers</option>
          </select>
        </div>
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Trust</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.role}</td>
                <td>{user.status}</td>
                <td>{user.joinedAt}</td>
                <td>{user.trust}</td>
                <td>
                  <button aria-label={`Suspend ${user.name}`} onClick={() => record(`suspended ${user.id}`)}>
                    Suspend
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-grid">
        <div className="admin-section">
          <h3>Job Moderation</h3>
          {flaggedJobs.map((job) => (
            <article className="queue-row" key={job.id}>
              <strong>{job.title}</strong>
              <span>{job.reason}</span>
              <div>
                <button onClick={() => record(`approved ${job.id}`)}>Approve</button>
                <button onClick={() => record(`rejected ${job.id}`)}>Reject</button>
                <button onClick={() => record(`escalated ${job.id}`)}>Escalate</button>
              </div>
            </article>
          ))}
        </div>

        <div className="admin-section">
          <h3>Dispute Resolution</h3>
          {disputes.map((dispute) => (
            <article className="queue-row" key={dispute.id}>
              <strong>{dispute.subject}</strong>
              <span>
                {dispute.status} · {dispute.amount}
              </span>
              <div>
                <button onClick={() => record(`ruled client on ${dispute.id}`)}>Client</button>
                <button onClick={() => record(`ruled freelancer on ${dispute.id}`)}>Freelancer</button>
                <button onClick={() => record(`escalated ${dispute.id}`)}>Escalate</button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="admin-grid">
        <div className="admin-section">
          <h3>Platform Controls</h3>
          <label>
            <input
              type="checkbox"
              checked={registrationsEnabled}
              onChange={(event) => confirmToggle("Registrations", event.target.checked, setRegistrationsEnabled)}
            />
            New user registrations
          </label>
          <label>
            <input
              type="checkbox"
              checked={jobPostingEnabled}
              onChange={(event) => confirmToggle("Job posting", event.target.checked, setJobPostingEnabled)}
            />
            New job postings
          </label>
        </div>

        <div className="admin-section">
          <h3>Audit Log</h3>
          <ul className="audit-list">
            {auditLog.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
