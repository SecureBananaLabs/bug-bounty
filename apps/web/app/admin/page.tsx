"use client";

import { useMemo, useState } from "react";

type UserStatus = "active" | "suspended" | "banned";
type ListingStatus = "pending" | "approved" | "rejected" | "escalated";
type DisputeStatus = "open" | "under_review" | "resolved";
type Section = "overview" | "users" | "moderation" | "disputes" | "controls" | "audit";

type UserRecord = {
  id: string;
  fullName: string;
  email: string;
  role: "client" | "freelancer";
  status: UserStatus;
  joinedAt: string;
  activeJobs: number;
  disputes: number;
  trustScore: number;
  recentJobs: string[];
  disputeHistory: string[];
};

type Listing = {
  id: string;
  title: string;
  client: string;
  reason: string;
  severity: "high" | "medium";
  status: ListingStatus;
};

type Dispute = {
  id: string;
  title: string;
  client: string;
  freelancer: string;
  amount: string;
  status: DisputeStatus;
  evidence: string[];
  lastMessage: string;
};

type AuditEntry = {
  id: string;
  adminId: string;
  action: string;
  target: string;
  createdAt: string;
};

const session = { id: "adm_001", role: "admin" };

const initialUsers: UserRecord[] = [
  {
    id: "usr_client_1",
    fullName: "Mara Client",
    email: "client@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-04-02",
    activeJobs: 3,
    disputes: 1,
    trustScore: 91,
    recentJobs: ["AI customer support widget", "Marketing automation setup", "Landing page QA"],
    disputeHistory: ["dsp_201: milestone evidence requested"]
  },
  {
    id: "usr_freelancer_1",
    fullName: "Nico Freelancer",
    email: "freelancer@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-04-12",
    activeJobs: 2,
    disputes: 0,
    trustScore: 86,
    recentJobs: ["Milestone delivery disagreement", "Data migration support"],
    disputeHistory: ["No active dispute history"]
  },
  {
    id: "usr_freelancer_2",
    fullName: "Avery Flagged",
    email: "flagged@example.com",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2026-05-01",
    activeJobs: 0,
    disputes: 2,
    trustScore: 48,
    recentJobs: ["Design sprint handoff"],
    disputeHistory: ["dsp_202: refund review", "dsp_178: prior late delivery warning"]
  }
];

const initialListings: Listing[] = [
  {
    id: "flag_101",
    title: "Build an AI customer support widget",
    client: "Mara Client",
    reason: "Payment terms mention off-platform escrow",
    severity: "high",
    status: "pending"
  },
  {
    id: "flag_102",
    title: "Design SaaS onboarding flows",
    client: "Mara Client",
    reason: "Duplicate listing reported by freelancer",
    severity: "medium",
    status: "pending"
  }
];

const initialDisputes: Dispute[] = [
  {
    id: "dsp_201",
    title: "Milestone delivery disagreement",
    client: "Mara Client",
    freelancer: "Nico Freelancer",
    amount: "$1,200",
    status: "open",
    evidence: ["contract.pdf", "handoff-notes.md"],
    lastMessage: "The acceptance checklist was met."
  },
  {
    id: "dsp_202",
    title: "Refund request for design sprint",
    client: "Mara Client",
    freelancer: "Avery Flagged",
    amount: "$450",
    status: "under_review",
    evidence: ["figma-export.zip"],
    lastMessage: "Assets were not delivered in editable form."
  }
];

const initialAudit: AuditEntry[] = [
  {
    id: "aud_100",
    adminId: "system",
    action: "seed",
    target: "admin bootstrap",
    createdAt: "2026-05-17 05:53 UTC"
  }
];

function statusClass(status: string) {
  return `status-pill status-${status.replace("_", "-")}`;
}

function pageSlice<T>(items: T[], page: number, pageSize = 4) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function datePart(value: string) {
  return value.slice(0, 10);
}

export default function AdminPanelPage() {
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [users, setUsers] = useState(initialUsers);
  const [listings, setListings] = useState(initialListings);
  const [disputes, setDisputes] = useState(initialDisputes);
  const [audit, setAudit] = useState(initialAudit);
  const [userQuery, setUserQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [joinedFrom, setJoinedFrom] = useState("");
  const [joinedTo, setJoinedTo] = useState("");
  const [auditFilter, setAuditFilter] = useState("all");
  const [auditAdminFilter, setAuditAdminFilter] = useState("");
  const [auditFrom, setAuditFrom] = useState("");
  const [auditTo, setAuditTo] = useState("");
  const [registrationsEnabled, setRegistrationsEnabled] = useState(true);
  const [jobPostingEnabled, setJobPostingEnabled] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(initialUsers[0].id);
  const [page, setPage] = useState(1);

  const isAdmin = session.role === "admin";

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesQuery =
        user.fullName.toLowerCase().includes(userQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(userQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      const matchesStart = !joinedFrom || user.joinedAt >= joinedFrom;
      const matchesEnd = !joinedTo || user.joinedAt <= joinedTo;

      return matchesQuery && matchesRole && matchesStatus && matchesStart && matchesEnd;
    });
  }, [joinedFrom, joinedTo, roleFilter, statusFilter, userQuery, users]);

  const filteredAudit = useMemo(() => {
    return audit.filter((entry) => {
      const matchesAction = auditFilter === "all" || entry.action.startsWith(auditFilter);
      const matchesAdmin =
        !auditAdminFilter || entry.adminId.toLowerCase().includes(auditAdminFilter.toLowerCase());
      const created = datePart(entry.createdAt);
      const matchesStart = !auditFrom || created >= auditFrom;
      const matchesEnd = !auditTo || created <= auditTo;

      return matchesAction && matchesAdmin && matchesStart && matchesEnd;
    });
  }, [audit, auditAdminFilter, auditFilter, auditFrom, auditTo]);

  const metrics = useMemo(() => {
    const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
    const pendingListings = listings.filter((listing) => listing.status === "pending").length;
    const activeUsers = users.filter((user) => user.status === "active").length;
    const trustAverage = Math.round(users.reduce((sum, user) => sum + user.trustScore, 0) / users.length);

    return [
      ["Total users", users.length.toString()],
      ["Active users", activeUsers.toString()],
      ["Open disputes", openDisputes.toString()],
      ["Flagged listings", pendingListings.toString()],
      ["Revenue period", "$128,900"],
      ["Avg trust", `${trustAverage}%`]
    ];
  }, [disputes, listings, users]);

  const selectedUser = users.find((candidate) => candidate.id === selectedUserId);

  function addAudit(action: string, target: string) {
    setAudit((entries) => [
      {
        id: `aud_${entries.length + 101}`,
        adminId: session.id,
        action,
        target,
        createdAt: new Date().toISOString().replace("T", " ").slice(0, 16)
      },
      ...entries
    ]);
  }

  async function refreshAdminData() {
    setIsRefreshing(true);
    setAdminError("");

    try {
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 250);
      });
      addAudit("metrics.refresh", "admin dashboard");
    } catch {
      setAdminError("Admin data could not be refreshed.");
    } finally {
      setIsRefreshing(false);
    }
  }

  function changeUserStatus(userId: string, status: UserStatus) {
    const user = users.find((candidate) => candidate.id === userId);

    if (!user) {
      return;
    }

    setUsers((records) =>
      records.map((record) => (record.id === userId ? { ...record, status } : record))
    );
    addAudit(`user.${status}`, user.email);
  }

  function decideListing(listingId: string, status: ListingStatus) {
    const listing = listings.find((candidate) => candidate.id === listingId);

    if (!listing) {
      return;
    }

    setListings((records) =>
      records.map((record) => (record.id === listingId ? { ...record, status } : record))
    );
    addAudit(`listing.${status}`, listing.title);
  }

  function decideDispute(disputeId: string, ruling: "client" | "freelancer" | "refund" | "escalate") {
    const dispute = disputes.find((candidate) => candidate.id === disputeId);

    if (!dispute) {
      return;
    }

    setDisputes((records) =>
      records.map((record) =>
        record.id === disputeId
          ? { ...record, status: ruling === "escalate" ? "under_review" : "resolved" }
          : record
      )
    );
    addAudit(`dispute.${ruling}`, dispute.title);
  }

  function toggleControl(control: "registrations" | "job-posting", enabled: boolean) {
    const confirmed = window.confirm(`Confirm ${enabled ? "enabling" : "disabling"} ${control}?`);

    if (!confirmed) {
      return;
    }

    if (control === "registrations") {
      setRegistrationsEnabled(enabled);
    } else {
      setJobPostingEnabled(enabled);
    }

    addAudit(`control.${control}`, enabled ? "enabled" : "disabled");
  }

  if (!isAdmin) {
    return (
      <section className="admin-denied" role="alert">
        <h2>403</h2>
        <p>Admin access is required.</p>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Admin operations</p>
          <h2>Control center</h2>
        </div>
        <div className="header-actions">
          <button disabled={isRefreshing} onClick={refreshAdminData} type="button">
            {isRefreshing ? "Refreshing" : "Refresh"}
          </button>
          <div className="session-badge" aria-label="Current admin session">
            <span>{session.id}</span>
            <strong>server role verified</strong>
          </div>
        </div>
      </header>

      <div className="admin-shell">
        <nav className="admin-tabs" aria-label="Admin sections">
          {[
            ["overview", "Overview"],
            ["users", "Users"],
            ["moderation", "Moderation"],
            ["disputes", "Disputes"],
            ["controls", "Controls"],
            ["audit", "Audit"]
          ].map(([value, label]) => (
            <button
              aria-current={activeSection === value ? "page" : undefined}
              className={activeSection === value ? "active" : ""}
              key={value}
              onClick={() => {
                setActiveSection(value as Section);
                setPage(1);
              }}
              type="button"
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="admin-content">
          {adminError && (
            <div className="state-banner state-error" role="alert">
              {adminError}
            </div>
          )}
          {isRefreshing && (
            <div className="state-banner" role="status">
              Refreshing admin data...
            </div>
          )}

          {activeSection === "overview" && (
            <>
              <div className="metric-grid">
                {metrics.map(([label, value]) => (
                  <article className="metric-card" key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </article>
                ))}
              </div>
              <div className="split-grid">
                <article className="admin-panel">
                  <h3>Trust distribution</h3>
                  {[["90-100", 142], ["70-89", 35], ["50-69", 7], ["0-49", 1]].map(
                    ([band, count]) => (
                      <div className="bar-row" key={band}>
                        <span>{band}</span>
                        <div>
                          <i style={{ width: `${Number(count) / 1.6}%` }} />
                        </div>
                        <strong>{count}</strong>
                      </div>
                    )
                  )}
                </article>
                <article className="admin-panel">
                  <h3>Action queue</h3>
                  <p>{listings.filter((listing) => listing.status === "pending").length} listings need review.</p>
                  <p>{disputes.filter((dispute) => dispute.status !== "resolved").length} disputes are active.</p>
                  <button onClick={() => setActiveSection("moderation")} type="button">
                    Open queue
                  </button>
                </article>
              </div>
            </>
          )}

          {activeSection === "users" && (
            <article className="admin-panel">
              <div className="panel-heading">
                <h3>User management</h3>
                <div className="filters">
                  <input
                    aria-label="Search users"
                    onChange={(event) => {
                      setUserQuery(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Search users"
                    value={userQuery}
                  />
                  <select
                    aria-label="Filter by role"
                    onChange={(event) => {
                      setRoleFilter(event.target.value);
                      setPage(1);
                    }}
                    value={roleFilter}
                  >
                    <option value="all">All roles</option>
                    <option value="client">Clients</option>
                    <option value="freelancer">Freelancers</option>
                  </select>
                  <select
                    aria-label="Filter by status"
                    onChange={(event) => {
                      setStatusFilter(event.target.value);
                      setPage(1);
                    }}
                    value={statusFilter}
                  >
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="banned">Banned</option>
                  </select>
                  <input
                    aria-label="Joined from"
                    onChange={(event) => {
                      setJoinedFrom(event.target.value);
                      setPage(1);
                    }}
                    type="date"
                    value={joinedFrom}
                  />
                  <input
                    aria-label="Joined to"
                    onChange={(event) => {
                      setJoinedTo(event.target.value);
                      setPage(1);
                    }}
                    type="date"
                    value={joinedTo}
                  />
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Jobs</th>
                      <th>Disputes</th>
                      <th>Profile</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td className="empty-state" colSpan={8}>
                          No users match the current filters.
                        </td>
                      </tr>
                    ) : (
                      pageSlice(filteredUsers, page).map((user) => (
                        <tr key={user.id}>
                          <td>
                            <strong>{user.fullName}</strong>
                            <span>{user.email}</span>
                          </td>
                          <td>{user.role}</td>
                          <td>
                            <span className={statusClass(user.status)}>{user.status}</span>
                          </td>
                          <td>{user.joinedAt}</td>
                          <td>{user.activeJobs}</td>
                          <td>{user.disputes}</td>
                          <td>
                            <button onClick={() => setSelectedUserId(user.id)} type="button">
                              View
                            </button>
                          </td>
                          <td className="action-cell">
                            <button onClick={() => changeUserStatus(user.id, "suspended")} type="button">
                              Suspend
                            </button>
                            <button onClick={() => changeUserStatus(user.id, "active")} type="button">
                              Reinstate
                            </button>
                            <button onClick={() => changeUserStatus(user.id, "banned")} type="button">
                              Ban
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination count={filteredUsers.length} page={page} setPage={setPage} />
              {selectedUser && (
                <aside className="detail-panel" aria-label="Selected user profile">
                  <div>
                    <h4>{selectedUser.fullName}</h4>
                    <span>{selectedUser.email}</span>
                  </div>
                  <dl>
                    <div>
                      <dt>Trust score</dt>
                      <dd>{selectedUser.trustScore}%</dd>
                    </div>
                    <div>
                      <dt>Active jobs</dt>
                      <dd>{selectedUser.recentJobs.join(", ")}</dd>
                    </div>
                    <div>
                      <dt>Dispute history</dt>
                      <dd>{selectedUser.disputeHistory.join(", ")}</dd>
                    </div>
                  </dl>
                </aside>
              )}
            </article>
          )}

          {activeSection === "moderation" && (
            <article className="admin-panel">
              <div className="panel-heading">
                <h3>Flagged listings</h3>
                <span>{listings.filter((listing) => listing.status === "pending").length} pending</span>
              </div>
              <div className="queue-grid">
                {listings.length === 0 ? (
                  <div className="empty-state">No flagged listings are waiting for review.</div>
                ) : (
                  listings.map((listing) => (
                    <div className="queue-card" key={listing.id}>
                      <div>
                        <span className={statusClass(listing.status)}>{listing.status}</span>
                        <span className={`severity severity-${listing.severity}`}>{listing.severity}</span>
                      </div>
                      <h4>{listing.title}</h4>
                      <p>{listing.reason}</p>
                      <small>Client: {listing.client}</small>
                      <div className="action-row">
                        <button onClick={() => decideListing(listing.id, "approved")} type="button">
                          Approve
                        </button>
                        <button onClick={() => decideListing(listing.id, "rejected")} type="button">
                          Reject
                        </button>
                        <button onClick={() => decideListing(listing.id, "escalated")} type="button">
                          Escalate
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>
          )}

          {activeSection === "disputes" && (
            <article className="admin-panel">
              <div className="panel-heading">
                <h3>Dispute resolution</h3>
                <span>{disputes.length} cases</span>
              </div>
              <div className="queue-grid">
                {disputes.length === 0 ? (
                  <div className="empty-state">No disputes are currently active.</div>
                ) : (
                  disputes.map((dispute) => (
                    <div className="queue-card" key={dispute.id}>
                      <span className={statusClass(dispute.status)}>{dispute.status}</span>
                      <h4>{dispute.title}</h4>
                      <p>{dispute.lastMessage}</p>
                      <dl>
                        <div>
                          <dt>Client</dt>
                          <dd>{dispute.client}</dd>
                        </div>
                        <div>
                          <dt>Freelancer</dt>
                          <dd>{dispute.freelancer}</dd>
                        </div>
                        <div>
                          <dt>Amount</dt>
                          <dd>{dispute.amount}</dd>
                        </div>
                        <div>
                          <dt>Evidence</dt>
                          <dd>{dispute.evidence.join(", ")}</dd>
                        </div>
                      </dl>
                      <div className="action-row">
                        <button onClick={() => decideDispute(dispute.id, "client")} type="button">
                          Rule client
                        </button>
                        <button onClick={() => decideDispute(dispute.id, "freelancer")} type="button">
                          Rule freelancer
                        </button>
                        <button onClick={() => decideDispute(dispute.id, "refund")} type="button">
                          Refund
                        </button>
                        <button onClick={() => decideDispute(dispute.id, "escalate")} type="button">
                          Escalate
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>
          )}

          {activeSection === "controls" && (
            <article className="admin-panel control-grid">
              <ControlToggle
                checked={registrationsEnabled}
                label="New user registrations"
                onChange={(enabled) => toggleControl("registrations", enabled)}
              />
              <ControlToggle
                checked={jobPostingEnabled}
                label="New job postings"
                onChange={(enabled) => toggleControl("job-posting", enabled)}
              />
            </article>
          )}

          {activeSection === "audit" && (
            <article className="admin-panel">
              <div className="panel-heading">
                <h3>Audit log</h3>
                <div className="filters audit-filters">
                  <select
                    aria-label="Filter audit action"
                    onChange={(event) => setAuditFilter(event.target.value)}
                    value={auditFilter}
                  >
                    <option value="all">All actions</option>
                    <option value="user">User actions</option>
                    <option value="listing">Listing actions</option>
                    <option value="dispute">Dispute actions</option>
                    <option value="control">Control actions</option>
                  </select>
                  <input
                    aria-label="Filter audit admin"
                    onChange={(event) => setAuditAdminFilter(event.target.value)}
                    placeholder="Admin ID"
                    value={auditAdminFilter}
                  />
                  <input
                    aria-label="Audit from"
                    onChange={(event) => setAuditFrom(event.target.value)}
                    type="date"
                    value={auditFrom}
                  />
                  <input
                    aria-label="Audit to"
                    onChange={(event) => setAuditTo(event.target.value)}
                    type="date"
                    value={auditTo}
                  />
                </div>
              </div>
              <div className="table-wrap">
                <table className="audit-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Admin</th>
                      <th>Action</th>
                      <th>Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAudit.length === 0 ? (
                      <tr>
                        <td className="empty-state" colSpan={4}>
                          No audit events match the current filters.
                        </td>
                      </tr>
                    ) : (
                      filteredAudit.map((entry) => (
                        <tr key={entry.id}>
                          <td>{entry.createdAt}</td>
                          <td>{entry.adminId}</td>
                          <td>{entry.action}</td>
                          <td>{entry.target}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}

function Pagination({ count, page, setPage }: { count: number; page: number; setPage: (page: number) => void }) {
  const totalPages = Math.max(Math.ceil(count / 4), 1);

  return (
    <div className="pagination" aria-label="Pagination">
      <button disabled={page <= 1} onClick={() => setPage(page - 1)} type="button">
        Previous
      </button>
      <span>
        Page {page} of {totalPages}
      </span>
      <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} type="button">
        Next
      </button>
    </div>
  );
}

function ControlToggle({
  checked,
  label,
  onChange
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="control-card">
      <div>
        <h3>{label}</h3>
        <span className={checked ? "control-on" : "control-off"}>{checked ? "Enabled" : "Disabled"}</span>
      </div>
      <button aria-pressed={checked} onClick={() => onChange(!checked)} type="button">
        {checked ? "Disable" : "Enable"}
      </button>
    </div>
  );
}
