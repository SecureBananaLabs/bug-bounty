"use client";

import { useMemo, useState } from "react";

const initialUsers = [
  { id: "usr_1001", name: "Avery Chen", role: "client", status: "active", joined: "May 1", trust: 94, jobs: 3, disputes: 0 },
  { id: "usr_1002", name: "Mina Patel", role: "freelancer", status: "active", joined: "May 3", trust: 88, jobs: 1, disputes: 1 },
  { id: "usr_1003", name: "Jonas Reed", role: "client", status: "suspended", joined: "Apr 18", trust: 43, jobs: 0, disputes: 2 },
  { id: "usr_admin", name: "Operations Admin", role: "admin", status: "active", joined: "Apr 1", trust: 100, jobs: 0, disputes: 0 }
];

const initialModeration = [
  { id: "job_2001", title: "Urgent payment gateway review", reason: "High budget change", severity: "medium", status: "flagged" },
  { id: "job_2002", title: "Data scraping automation", reason: "Policy risk", severity: "high", status: "under_review" }
];

const initialDisputes = [
  { id: "dsp_3001", job: "Payment gateway review", parties: "Avery / Mina", amount: "$1,800", status: "open" },
  { id: "dsp_3002", job: "Automation scope", parties: "Jonas / Mina", amount: "$650", status: "under_review" }
];

const initialAudit = [
  { id: "aud_1", admin: "usr_admin", action: "moderation.reviewed", target: "job_1999", when: "May 27, 12:00", detail: "Escalated duplicate listing" }
];

function badgeClass(value: string) {
  if (["active", "approved", "resolved", "low"].includes(value)) return "admin-badge positive";
  if (["suspended", "under_review", "medium", "open"].includes(value)) return "admin-badge warning";
  return "admin-badge danger";
}

export default function AdminPanelPage() {
  const [users, setUsers] = useState(initialUsers);
  const [moderation, setModeration] = useState(initialModeration);
  const [disputes, setDisputes] = useState(initialDisputes);
  const [audit, setAudit] = useState(initialAudit);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [registrationsEnabled, setRegistrationsEnabled] = useState(true);
  const [jobPostingsEnabled, setJobPostingsEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const visibleUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesQuery = `${user.name} ${user.id}`.toLowerCase().includes(query.toLowerCase());
      return matchesRole && matchesQuery;
    });
  }, [query, roleFilter, users]);

  const metrics = [
    ["Total users", users.length],
    ["Active jobs", users.reduce((sum, user) => sum + user.jobs, 0)],
    ["Open disputes", disputes.filter((dispute) => dispute.status !== "resolved").length],
    ["Flagged listings", moderation.filter((item) => item.status !== "approved").length],
    ["Revenue", "$128.9k"]
  ];

  function addAudit(action: string, target: string, detail: string) {
    setAudit((entries) => [
      { id: `aud_${entries.length + 1}`, admin: "usr_admin", action, target, when: "Just now", detail },
      ...entries
    ]);
  }

  function confirmAction(message: string) {
    return window.confirm(message);
  }

  function changeUserStatus(userId: string, status: string) {
    if (!confirmAction(`Change ${userId} to ${status}?`)) return;
    setUsers((records) => records.map((user) => (user.id === userId ? { ...user, status } : user)));
    addAudit(`user.${status}`, userId, `User status changed to ${status}`);
  }

  function decideListing(listingId: string, decision: string) {
    if (!confirmAction(`${decision} ${listingId}?`)) return;
    setModeration((records) => records.map((item) => (item.id === listingId ? { ...item, status: decision } : item)));
    addAudit(`listing.${decision}`, listingId, `Listing ${decision}`);
  }

  function ruleDispute(disputeId: string, ruling: string) {
    if (!confirmAction(`Apply ${ruling} ruling to ${disputeId}?`)) return;
    setDisputes((records) =>
      records.map((dispute) => (dispute.id === disputeId ? { ...dispute, status: ruling === "escalate" ? "under_review" : "resolved" } : dispute))
    );
    addAudit(`dispute.${ruling}`, disputeId, `Dispute ruling: ${ruling}`);
  }

  function toggleControl(control: "registrations" | "jobs") {
    if (!confirmAction(`Update ${control} control?`)) return;
    if (control === "registrations") {
      setRegistrationsEnabled((enabled) => !enabled);
      addAudit("controls.registrations", "platform", "Registration setting updated");
    } else {
      setJobPostingsEnabled((enabled) => !enabled);
      addAudit("controls.jobPostings", "platform", "Job posting setting updated");
    }
  }

  function toggleMaintenanceMode() {
    if (!confirmAction("Update platform maintenance mode?")) return;
    setMaintenanceMode((enabled) => !enabled);
    addAudit("controls.maintenance", "platform", "Maintenance mode updated");
  }

  return (
    <section className="admin-shell" aria-label="Admin operations panel">
      <div className="admin-topline">
        <div>
          <h2>Admin Operations</h2>
          <p>Users, listings, disputes, controls, and audit activity</p>
        </div>
        <div className="admin-status-strip" aria-label="Admin route status">
          <span>Admin API enforced</span>
          <span>Audit ready</span>
          <button className="admin-button secondary" type="button" onClick={() => addAudit("metrics.refreshed", "dashboard", "Manual dashboard refresh")}>
            Refresh
          </button>
        </div>
      </div>

      <div className="admin-metrics" aria-label="Platform metrics">
        {metrics.map(([label, value]) => (
          <article className="admin-metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <div className="admin-layout">
        <section className="admin-panel wide" aria-labelledby="users-heading">
          <div className="admin-panel-heading">
            <h3 id="users-heading">User Management</h3>
            <div className="admin-filters">
              <input aria-label="Search users" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users" />
              <select aria-label="Filter by role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                <option value="all">All roles</option>
                <option value="client">Clients</option>
                <option value="freelancer">Freelancers</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
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
                      <span className={badgeClass(user.status)}>{user.status}</span>
                    </td>
                    <td>{user.trust}</td>
                    <td>{user.joined}</td>
                    <td className="admin-actions">
                      <button type="button" onClick={() => changeUserStatus(user.id, "suspended")}>Suspend</button>
                      <button type="button" onClick={() => changeUserStatus(user.id, "active")}>Reinstate</button>
                      <button className="danger" type="button" onClick={() => changeUserStatus(user.id, "banned")}>Ban</button>
                    </td>
                  </tr>
                ))}
                {visibleUsers.length === 0 ? (
                  <tr>
                    <td className="admin-empty" colSpan={6}>No users match this filter.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-panel" aria-labelledby="moderation-heading">
          <h3 id="moderation-heading">Moderation Queue</h3>
          {moderation.map((item) => (
            <article className="admin-row" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <span>{item.reason}</span>
              </div>
              <div className="admin-inline">
                <span className={badgeClass(item.severity)}>{item.severity}</span>
                <span className={badgeClass(item.status)}>{item.status}</span>
              </div>
              <div className="admin-actions">
                <button type="button" onClick={() => decideListing(item.id, "approved")}>Approve</button>
                <button className="danger" type="button" onClick={() => decideListing(item.id, "rejected")}>Reject</button>
                <button type="button" onClick={() => decideListing(item.id, "escalated")}>Escalate</button>
              </div>
            </article>
          ))}
        </section>

        <section className="admin-panel" aria-labelledby="disputes-heading">
          <h3 id="disputes-heading">Dispute Resolution</h3>
          {disputes.map((dispute) => (
            <article className="admin-row" key={dispute.id}>
              <div>
                <strong>{dispute.job}</strong>
                <span>{dispute.parties} / {dispute.amount}</span>
              </div>
              <span className={badgeClass(dispute.status)}>{dispute.status}</span>
              <div className="admin-actions">
                <button type="button" onClick={() => ruleDispute(dispute.id, "client")}>Client</button>
                <button type="button" onClick={() => ruleDispute(dispute.id, "freelancer")}>Freelancer</button>
                <button type="button" onClick={() => ruleDispute(dispute.id, "escalate")}>Escalate</button>
              </div>
            </article>
          ))}
        </section>

        <section className="admin-panel" aria-labelledby="trust-heading">
          <h3 id="trust-heading">Trust Distribution</h3>
          {[["0-49", 1], ["50-79", 0], ["80-100", 3]].map(([bucket, count]) => (
            <div className="admin-bar" key={bucket}>
              <span>{bucket}</span>
              <div><i style={{ width: `${Number(count) * 28 + 12}%` }} /></div>
              <strong>{count}</strong>
            </div>
          ))}
        </section>

        <section className="admin-panel" aria-labelledby="controls-heading">
          <h3 id="controls-heading">Platform Controls</h3>
          <button className="admin-toggle" type="button" onClick={() => toggleControl("registrations")} aria-pressed={registrationsEnabled}>
            <span>Registrations</span>
            <strong>{registrationsEnabled ? "Enabled" : "Disabled"}</strong>
          </button>
          <button className="admin-toggle" type="button" onClick={() => toggleControl("jobs")} aria-pressed={jobPostingsEnabled}>
            <span>Job postings</span>
            <strong>{jobPostingsEnabled ? "Enabled" : "Disabled"}</strong>
          </button>
          <button className="admin-toggle" type="button" onClick={toggleMaintenanceMode} aria-pressed={maintenanceMode}>
            <span>Maintenance mode</span>
            <strong>{maintenanceMode ? "Enabled" : "Disabled"}</strong>
          </button>
        </section>

        <section className="admin-panel wide" aria-labelledby="audit-heading">
          <h3 id="audit-heading">Audit Log</h3>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Admin</th>
                  <th>When</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.action}</td>
                    <td>{entry.target}</td>
                    <td>{entry.admin}</td>
                    <td>{entry.when}</td>
                    <td>{entry.detail}</td>
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
