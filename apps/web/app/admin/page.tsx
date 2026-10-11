"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type Metrics = {
  totalUsers: number;
  activeJobs: number;
  openDisputes: number;
  flaggedListings: number;
  revenueCurrentPeriod: number;
  trustScoreDistribution: {
    high: number;
    medium: number;
    low: number;
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
  disputeCount: number;
};

type Listing = {
  id: string;
  title: string;
  postedBy: string;
  reason: string;
  risk: string;
  status: string;
  createdAt: string;
};

type Dispute = {
  id: string;
  clientId: string;
  freelancerId: string;
  jobId: string;
  amount: number;
  status: string;
  openedAt: string;
  transactionId: string;
};

type PlatformControls = {
  registrationEnabled: boolean;
  jobPostingEnabled: boolean;
  updatedAt: string;
  updatedBy: string;
};

type AuditEntry = {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
  reason: string;
};

type AdminState = {
  metrics: Metrics | null;
  users: Paginated<User>;
  listings: Paginated<Listing>;
  disputes: Paginated<Dispute>;
  controls: PlatformControls | null;
  auditLog: Paginated<AuditEntry>;
};

const emptyPage = <T,>(): Paginated<T> => ({
  items: [],
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 1
});

const emptyState: AdminState = {
  metrics: null,
  users: emptyPage<User>(),
  listings: emptyPage<Listing>(),
  disputes: emptyPage<Dispute>(),
  controls: null,
  auditLog: emptyPage<AuditEntry>()
};

export default function AdminPanelPage() {
  const [token, setToken] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [state, setState] = useState<AdminState>(emptyState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    const storedToken = window.localStorage.getItem("adminToken");
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  useEffect(() => {
    if (token) {
      window.localStorage.setItem("adminToken", token);
      void loadAdminData();
    }
  }, [token]);

  const userParams = useMemo(() => {
    const params = new URLSearchParams();
    if (query) {
      params.set("q", query);
    }
    if (roleFilter) {
      params.set("role", roleFilter);
    }
    if (statusFilter) {
      params.set("status", statusFilter);
    }
    return params.toString();
  }, [query, roleFilter, statusFilter]);

  async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
        ...(init.headers ?? {})
      }
    });

    const payload = await response.json();
    if (response.status === 403) {
      setForbidden(true);
    }
    if (!response.ok) {
      throw new Error(payload.message ?? "Admin request failed");
    }
    return payload.data as T;
  }

  async function loadAdminData() {
    if (!token) {
      return;
    }

    setLoading(true);
    setError("");
    setForbidden(false);

    try {
      const [metrics, users, listings, disputes, controls, auditLog] = await Promise.all([
        adminFetch<Metrics>("/api/admin/metrics"),
        adminFetch<Paginated<User>>(`/api/admin/users${userParams ? `?${userParams}` : ""}`),
        adminFetch<Paginated<Listing>>("/api/admin/moderation/jobs"),
        adminFetch<Paginated<Dispute>>("/api/admin/disputes"),
        adminFetch<PlatformControls>("/api/admin/platform-controls"),
        adminFetch<Paginated<AuditEntry>>("/api/admin/audit-log")
      ]);

      setState({ metrics, users, listings, disputes, controls, auditLog });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Admin request failed");
    } finally {
      setLoading(false);
    }
  }

  async function setUserStatus(userId: string, status: string) {
    await adminFetch(`/api/admin/users/${userId}/status`, {
      method: "POST",
      body: JSON.stringify({ status, reason: `Admin selected ${status}` })
    });
    await loadAdminData();
  }

  async function moderateListing(listingId: string, action: string) {
    await adminFetch(`/api/admin/moderation/jobs/${listingId}`, {
      method: "POST",
      body: JSON.stringify({
        action,
        reason: action === "reject" ? "Rejected by admin moderation review" : ""
      })
    });
    await loadAdminData();
  }

  async function resolveDispute(disputeId: string, decision: string) {
    await adminFetch(`/api/admin/disputes/${disputeId}/ruling`, {
      method: "POST",
      body: JSON.stringify({ decision, reason: `Admin ruled for ${decision}` })
    });
    await loadAdminData();
  }

  async function toggleControl(control: keyof PlatformControls, enabled: boolean) {
    if (!window.confirm("Confirm platform control change")) {
      return;
    }

    await adminFetch("/api/admin/platform-controls", {
      method: "POST",
      body: JSON.stringify({
        control,
        enabled,
        confirm: true,
        reason: `Set ${control} to ${enabled}`
      })
    });
    await loadAdminData();
  }

  return (
    <section className="admin-shell" aria-busy={loading}>
      <div className="admin-toolbar">
        <div>
          <h2>Admin Panel</h2>
          <p className="admin-muted">Users, listings, disputes, platform controls, and audit trail.</p>
        </div>
        <div className="admin-token">
          <label htmlFor="admin-token">Admin token</label>
          <input
            id="admin-token"
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Bearer token"
          />
          <button type="button" onClick={() => void loadAdminData()} disabled={!token || loading}>
            Refresh
          </button>
        </div>
      </div>

      {forbidden ? <div className="admin-alert">403: admin access required.</div> : null}
      {error ? <div className="admin-alert">{error}</div> : null}
      {loading ? <div className="admin-status">Loading admin data...</div> : null}

      <div className="admin-grid admin-metrics" aria-label="Admin metrics">
        <Metric label="Users" value={state.metrics?.totalUsers ?? 0} />
        <Metric label="Active jobs" value={state.metrics?.activeJobs ?? 0} />
        <Metric label="Open disputes" value={state.metrics?.openDisputes ?? 0} />
        <Metric label="Flagged listings" value={state.metrics?.flaggedListings ?? 0} />
        <Metric label="Revenue" value={`$${(state.metrics?.revenueCurrentPeriod ?? 0).toLocaleString()}`} />
        <Metric
          label="Trust high/med/low"
          value={`${state.metrics?.trustScoreDistribution.high ?? 0}/${state.metrics?.trustScoreDistribution.medium ?? 0}/${state.metrics?.trustScoreDistribution.low ?? 0}`}
        />
      </div>

      <div className="admin-panel">
        <div className="admin-panel-title">
          <h3>User Management</h3>
          <div className="admin-filters">
            <input
              aria-label="Search users"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
            />
            <select aria-label="Role filter" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              <option value="">All roles</option>
              <option value="client">Client</option>
              <option value="freelancer">Freelancer</option>
              <option value="admin">Admin</option>
            </select>
            <select
              aria-label="Status filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
            <button type="button" onClick={() => void loadAdminData()} disabled={!token || loading}>
              Apply
            </button>
          </div>
        </div>
        <TableState empty={state.users.items.length === 0} />
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Trust</th>
                <th>Jobs</th>
                <th>Disputes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.users.items.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </td>
                  <td>{user.role}</td>
                  <td>{user.status}</td>
                  <td>{user.trustScore}</td>
                  <td>{user.activeJobs}</td>
                  <td>{user.disputeCount}</td>
                  <td className="admin-actions">
                    <button type="button" onClick={() => void setUserStatus(user.id, "suspended")}>
                      Suspend
                    </button>
                    <button type="button" onClick={() => void setUserStatus(user.id, "active")}>
                      Reinstate
                    </button>
                    <button type="button" onClick={() => void setUserStatus(user.id, "banned")}>
                      Ban
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-grid">
        <div className="admin-panel">
          <h3>Job Moderation</h3>
          <TableState empty={state.listings.items.length === 0} />
          {state.listings.items.map((listing) => (
            <div className="admin-row-card" key={listing.id}>
              <div>
                <strong>{listing.title}</strong>
                <span>{listing.reason}</span>
                <small>{listing.risk} risk · {listing.status}</small>
              </div>
              <div className="admin-actions">
                <button type="button" onClick={() => void moderateListing(listing.id, "approve")}>
                  Approve
                </button>
                <button type="button" onClick={() => void moderateListing(listing.id, "reject")}>
                  Reject
                </button>
                <button type="button" onClick={() => void moderateListing(listing.id, "escalate")}>
                  Escalate
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="admin-panel">
          <h3>Dispute Resolution</h3>
          <TableState empty={state.disputes.items.length === 0} />
          {state.disputes.items.map((dispute) => (
            <div className="admin-row-card" key={dispute.id}>
              <div>
                <strong>{dispute.id}</strong>
                <span>{dispute.clientId} vs {dispute.freelancerId}</span>
                <small>${dispute.amount} · {dispute.status} · {dispute.transactionId}</small>
              </div>
              <div className="admin-actions">
                <button type="button" onClick={() => void resolveDispute(dispute.id, "client")}>
                  Client
                </button>
                <button type="button" onClick={() => void resolveDispute(dispute.id, "freelancer")}>
                  Freelancer
                </button>
                <button type="button" onClick={() => void resolveDispute(dispute.id, "escalate")}>
                  Escalate
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-grid">
        <div className="admin-panel">
          <h3>Platform Controls</h3>
          <label className="admin-switch">
            <span>New registrations</span>
            <input
              type="checkbox"
              checked={state.controls?.registrationEnabled ?? false}
              onChange={(event) => void toggleControl("registrationEnabled", event.target.checked)}
            />
          </label>
          <label className="admin-switch">
            <span>New job postings</span>
            <input
              type="checkbox"
              checked={state.controls?.jobPostingEnabled ?? false}
              onChange={(event) => void toggleControl("jobPostingEnabled", event.target.checked)}
            />
          </label>
          <p className="admin-muted">
            Last changed by {state.controls?.updatedBy ?? "system"} at {state.controls?.updatedAt ?? "n/a"}.
          </p>
        </div>

        <div className="admin-panel">
          <h3>Audit Log</h3>
          <TableState empty={state.auditLog.items.length === 0} />
          <div className="admin-audit">
            {state.auditLog.items.map((entry) => (
              <div key={entry.id}>
                <strong>{entry.action}</strong>
                <span>{entry.targetType}:{entry.targetId}</span>
                <small>{entry.adminId} · {entry.createdAt}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="admin-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TableState({ empty }: { empty: boolean }) {
  if (!empty) {
    return null;
  }

  return <div className="admin-empty">No records.</div>;
}
