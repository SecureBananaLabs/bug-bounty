"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type Overview = {
  totalUsers: number;
  activeJobs: number;
  openDisputes: number;
  flaggedListings: number;
  revenueCurrentPeriod: number;
  trustDistribution: Array<{ label: string; count: number }>;
  settings: {
    registrationsEnabled: boolean;
    jobPostingEnabled: boolean;
  };
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
  trustScore: number;
  activeJobs: number;
  disputes: number;
};

type Listing = {
  id: string;
  title: string;
  posterId: string;
  status: string;
  reason: string;
  reportedAt: string;
};

type Dispute = {
  id: string;
  clientId: string;
  freelancerId: string;
  status: string;
  value: number;
  currency: string;
  subject: string;
  evidence: string[];
  thread: string[];
};

type AuditEntry = {
  id: string;
  adminId: string;
  action: string;
  targetId: string;
  details: string;
  createdAt: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

async function readApi<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}/api/admin${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message ?? "Admin request failed");
  }

  return payload.data;
}

export default function AdminPanelPage() {
  const [token, setToken] = useState("");
  const [draftToken, setDraftToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<PageResult<User> | null>(null);
  const [moderation, setModeration] = useState<PageResult<Listing> | null>(null);
  const [disputes, setDisputes] = useState<PageResult<Dispute> | null>(null);
  const [audit, setAudit] = useState<PageResult<AuditEntry> | null>(null);
  const [filters, setFilters] = useState({ search: "", role: "", status: "" });

  const query = useMemo(() => {
    const params = new URLSearchParams({ pageSize: "10" });
    if (filters.search) params.set("search", filters.search);
    if (filters.role) params.set("role", filters.role);
    if (filters.status) params.set("status", filters.status);
    return params.toString();
  }, [filters]);

  async function refresh(currentToken = token) {
    if (!currentToken) return;
    setLoading(true);
    setError("");

    try {
      const [overviewData, usersData, moderationData, disputesData, auditData] = await Promise.all([
        readApi<Overview>("/overview", currentToken),
        readApi<PageResult<User>>(`/users?${query}`, currentToken),
        readApi<PageResult<Listing>>("/moderation?pageSize=10", currentToken),
        readApi<PageResult<Dispute>>("/disputes?pageSize=10", currentToken),
        readApi<PageResult<AuditEntry>>("/audit?pageSize=10", currentToken)
      ]);

      setOverview(overviewData);
      setUsers(usersData);
      setModeration(moderationData);
      setDisputes(disputesData);
      setAudit(auditData);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load admin data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const storedToken = window.localStorage.getItem("freelanceflow_admin_token") ?? "";
    setToken(storedToken);
    setDraftToken(storedToken);
    refresh(storedToken);
  }, []);

  useEffect(() => {
    refresh();
  }, [query]);

  function saveToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.localStorage.setItem("freelanceflow_admin_token", draftToken);
    setToken(draftToken);
    refresh(draftToken);
  }

  async function runAction(path: string, body: Record<string, unknown>, confirmation: string) {
    if (!window.confirm(confirmation)) return;
    setLoading(true);
    setError("");

    try {
      await readApi(path, token, {
        method: "POST",
        body: JSON.stringify(body)
      });
      await refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Admin action failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="admin-shell" aria-busy={loading}>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Operations</p>
          <h2>Admin Control Room</h2>
        </div>
        <button type="button" onClick={() => refresh()} disabled={!token || loading} aria-label="Refresh admin data">
          Refresh
        </button>
      </div>

      <form className="admin-token" onSubmit={saveToken}>
        <label htmlFor="admin-token">Admin bearer token</label>
        <input
          id="admin-token"
          value={draftToken}
          onChange={(event) => setDraftToken(event.target.value)}
          placeholder="Paste admin JWT"
        />
        <button type="submit">Apply</button>
      </form>

      {error ? <p className="admin-error">{error}</p> : null}

      {!token ? (
        <div className="admin-empty">403 Admin token required.</div>
      ) : (
        <>
          <div className="metric-grid">
            <Metric label="Users" value={overview?.totalUsers} />
            <Metric label="Active Jobs" value={overview?.activeJobs} />
            <Metric label="Open Disputes" value={overview?.openDisputes} />
            <Metric label="Flagged Listings" value={overview?.flaggedListings} />
            <Metric label="Revenue" value={overview ? `GBP ${overview.revenueCurrentPeriod.toLocaleString()}` : undefined} />
          </div>

          <section className="admin-panel">
            <div className="panel-title">
              <h3>Trust Distribution</h3>
              <span>{loading ? "Refreshing" : "Live snapshot"}</span>
            </div>
            <div className="trust-bars">
              {overview?.trustDistribution.map((item) => (
                <div key={item.label} className="trust-row">
                  <span>{item.label}</span>
                  <div>
                    <i style={{ width: `${Math.max(item.count * 24, 8)}%` }} />
                  </div>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-panel">
            <div className="panel-title">
              <h3>Platform Controls</h3>
              <span>Confirmation required</span>
            </div>
            <div className="control-row">
              <button
                type="button"
                onClick={() =>
                  runAction(
                    "/settings/registrationsEnabled",
                    { enabled: !overview?.settings.registrationsEnabled },
                    "Change new user registration availability?"
                  )
                }
                aria-label="Toggle new user registrations"
              >
                Registrations {overview?.settings.registrationsEnabled ? "On" : "Off"}
              </button>
              <button
                type="button"
                onClick={() =>
                  runAction(
                    "/settings/jobPostingEnabled",
                    { enabled: !overview?.settings.jobPostingEnabled },
                    "Change new job posting availability?"
                  )
                }
                aria-label="Toggle new job postings"
              >
                Job Posting {overview?.settings.jobPostingEnabled ? "On" : "Off"}
              </button>
            </div>
          </section>

          <section className="admin-panel">
            <div className="panel-title">
              <h3>User Management</h3>
              <span>{users?.total ?? 0} results</span>
            </div>
            <div className="filters">
              <input
                aria-label="Search users"
                placeholder="Search users"
                value={filters.search}
                onChange={(event) => setFilters({ ...filters, search: event.target.value })}
              />
              <select
                aria-label="Filter users by role"
                value={filters.role}
                onChange={(event) => setFilters({ ...filters, role: event.target.value })}
              >
                <option value="">All roles</option>
                <option value="freelancer">Freelancers</option>
                <option value="client">Clients</option>
              </select>
              <select
                aria-label="Filter users by status"
                value={filters.status}
                onChange={(event) => setFilters({ ...filters, status: event.target.value })}
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </select>
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
                {users?.items.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </td>
                    <td>{user.role}</td>
                    <td>{user.status}</td>
                    <td>{user.trustScore}</td>
                    <td className="table-actions">
                      <button
                        type="button"
                        onClick={() => runAction(`/users/${user.id}/status`, { status: "suspended" }, `Suspend ${user.name}?`)}
                      >
                        Suspend
                      </button>
                      <button
                        type="button"
                        onClick={() => runAction(`/users/${user.id}/status`, { status: "active" }, `Reinstate ${user.name}?`)}
                      >
                        Reinstate
                      </button>
                      <button
                        type="button"
                        onClick={() => runAction(`/users/${user.id}/status`, { status: "banned" }, `Ban ${user.name}?`)}
                      >
                        Ban
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="admin-panel">
            <div className="panel-title">
              <h3>Listing Moderation</h3>
              <span>{moderation?.total ?? 0} queued</span>
            </div>
            <div className="queue-list">
              {moderation?.items.map((listing) => (
                <article key={listing.id}>
                  <div>
                    <strong>{listing.title}</strong>
                    <span>{listing.reason}</span>
                  </div>
                  <div className="table-actions">
                    <button
                      type="button"
                      onClick={() =>
                        runAction(`/moderation/${listing.id}/decision`, { decision: "approved" }, `Approve ${listing.title}?`)
                      }
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        runAction(
                          `/moderation/${listing.id}/decision`,
                          { decision: "rejected", reason: "Policy requirements not met" },
                          `Reject ${listing.title}?`
                        )
                      }
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        runAction(`/moderation/${listing.id}/decision`, { decision: "escalated" }, `Escalate ${listing.title}?`)
                      }
                    >
                      Escalate
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="admin-panel">
            <div className="panel-title">
              <h3>Disputes</h3>
              <span>{disputes?.total ?? 0} cases</span>
            </div>
            <div className="queue-list">
              {disputes?.items.map((dispute) => (
                <article key={dispute.id}>
                  <div>
                    <strong>{dispute.subject}</strong>
                    <span>
                      {dispute.status} - {dispute.currency.toUpperCase()} {dispute.value.toLocaleString()}
                    </span>
                  </div>
                  <div className="table-actions">
                    <button
                      type="button"
                      onClick={() => runAction(`/disputes/${dispute.id}/ruling`, { ruling: "client" }, `Rule for client?`)}
                    >
                      Client
                    </button>
                    <button
                      type="button"
                      onClick={() => runAction(`/disputes/${dispute.id}/ruling`, { ruling: "freelancer" }, `Rule for freelancer?`)}
                    >
                      Freelancer
                    </button>
                    <button
                      type="button"
                      onClick={() => runAction(`/disputes/${dispute.id}/ruling`, { ruling: "senior_admin" }, `Escalate dispute?`)}
                    >
                      Escalate
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="admin-panel">
            <div className="panel-title">
              <h3>Audit Log</h3>
              <span>Append-only</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Admin</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {audit?.items.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.action}</td>
                    <td>{entry.targetId}</td>
                    <td>{entry.adminId}</td>
                    <td>{new Date(entry.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value?: number | string }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value ?? "..."}</strong>
    </div>
  );
}
