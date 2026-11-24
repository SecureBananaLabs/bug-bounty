"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000";

type Overview = {
  totals: {
    totalUsers: number;
    activeJobs: number;
    openDisputes: number;
    flaggedListings: number;
    revenueCurrentPeriod: number;
  };
  trustDistribution: Array<{ label: string; count: number }>;
  platformControls: Record<string, boolean>;
};

type Paginated<T> = {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

type UserRow = {
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

type ListingRow = {
  id: string;
  title: string;
  clientName: string;
  status: string;
  budget: number;
  flagReason?: string;
  reportCount?: number;
};

type DisputeRow = {
  id: string;
  title: string;
  clientName: string;
  freelancerName: string;
  amount: number;
  status: string;
  thread: string[];
  evidence: string[];
};

type AuditRow = {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt: string;
};

type AdminPayload = {
  overview: Overview | null;
  users: Paginated<UserRow>;
  listings: Paginated<ListingRow>;
  disputes: Paginated<DisputeRow>;
  audit: Paginated<AuditRow>;
};

const emptyPage = { items: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 } };

function money(value: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value));
}

async function parseApiResponse(response: Response) {
  const payload = await response.json();
  if (!response.ok || payload.success === false) {
    throw new Error(payload.message ?? `Request failed with ${response.status}`);
  }
  return payload.data;
}

export default function AdminPanelPage() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("Admin JWT required");
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ userSearch: "", role: "", status: "" });
  const [data, setData] = useState<AdminPayload>({
    overview: null,
    users: emptyPage,
    listings: emptyPage,
    disputes: emptyPage,
    audit: emptyPage
  });

  const headers = useMemo(
    () => ({
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    }),
    [token]
  );

  useEffect(() => {
    const stored = window.localStorage.getItem("freelanceflow_admin_token");
    if (stored) setToken(stored);
  }, []);

  async function loadDashboard(nextToken = token) {
    if (!nextToken) {
      setStatus("403: admin token required");
      return;
    }

    setLoading(true);
    setStatus("Refreshing admin data...");

    try {
      window.localStorage.setItem("freelanceflow_admin_token", nextToken);
      const query = new URLSearchParams();
      if (filters.userSearch) query.set("search", filters.userSearch);
      if (filters.role) query.set("role", filters.role);
      if (filters.status) query.set("status", filters.status);

      const [overview, users, listings, disputes, audit] = await Promise.all([
        fetch(`${API_BASE}/api/admin/overview`, { headers }).then(parseApiResponse),
        fetch(`${API_BASE}/api/admin/users?${query}`, { headers }).then(parseApiResponse),
        fetch(`${API_BASE}/api/admin/moderation?status=all`, { headers }).then(parseApiResponse),
        fetch(`${API_BASE}/api/admin/disputes`, { headers }).then(parseApiResponse),
        fetch(`${API_BASE}/api/admin/audit`, { headers }).then(parseApiResponse)
      ]);

      setData({ overview, users, listings, disputes, audit });
      setStatus("Admin data refreshed");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  async function patch(path: string, body: Record<string, unknown>, confirmation: string) {
    if (!window.confirm(confirmation)) return;

    setLoading(true);
    try {
      await fetch(`${API_BASE}${path}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body)
      }).then(parseApiResponse);
      await loadDashboard();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Admin action failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="admin-shell" aria-busy={loading}>
      <div className="admin-header">
        <div>
          <h2>Admin Operations</h2>
          <p>{status}</p>
        </div>
        <div className="admin-token">
          <label htmlFor="admin-token">Admin token</label>
          <input
            id="admin-token"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Bearer token value"
            aria-label="Admin bearer token"
          />
          <button type="button" onClick={() => loadDashboard(token)} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {data.overview ? (
        <>
          <div className="admin-metrics" aria-label="Platform metrics">
            <Metric label="Total users" value={data.overview.totals.totalUsers.toString()} />
            <Metric label="Active jobs" value={data.overview.totals.activeJobs.toString()} />
            <Metric label="Open disputes" value={data.overview.totals.openDisputes.toString()} />
            <Metric label="Flagged listings" value={data.overview.totals.flaggedListings.toString()} />
            <Metric label="Current revenue" value={money(data.overview.totals.revenueCurrentPeriod)} />
          </div>

          <div className="admin-section">
            <div className="section-heading">
              <h3>Trust Distribution</h3>
            </div>
            <div className="trust-chart" role="img" aria-label="Trust score distribution">
              {data.overview.trustDistribution.map((bucket) => (
                <div className="trust-bar" key={bucket.label}>
                  <span>{bucket.label}</span>
                  <div>
                    <b style={{ width: `${Math.max(8, bucket.count * 22)}%` }} />
                  </div>
                  <strong>{bucket.count}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-section">
            <div className="section-heading">
              <h3>Platform Controls</h3>
            </div>
            <div className="control-row">
              {Object.entries(data.overview.platformControls).map(([control, enabled]) => (
                <button
                  key={control}
                  type="button"
                  className={enabled ? "control-on" : "control-off"}
                  onClick={() =>
                    patch(
                      `/api/admin/controls/${control}`,
                      { enabled: !enabled },
                      `Confirm changing ${control} to ${!enabled ? "enabled" : "disabled"}`
                    )
                  }
                  aria-pressed={enabled}
                >
                  {control}: {enabled ? "Enabled" : "Disabled"}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-section">
            <div className="section-heading">
              <h3>User Management</h3>
              <div className="filters">
                <input
                  value={filters.userSearch}
                  onChange={(event) => setFilters({ ...filters, userSearch: event.target.value })}
                  placeholder="Search users"
                  aria-label="Search users"
                />
                <select
                  value={filters.role}
                  onChange={(event) => setFilters({ ...filters, role: event.target.value })}
                  aria-label="Filter users by role"
                >
                  <option value="">All roles</option>
                  <option value="client">Clients</option>
                  <option value="freelancer">Freelancers</option>
                  <option value="admin">Admins</option>
                </select>
                <select
                  value={filters.status}
                  onChange={(event) => setFilters({ ...filters, status: event.target.value })}
                  aria-label="Filter users by status"
                >
                  <option value="">All statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
                </select>
              </div>
            </div>
            <AdminTable
              columns={["User", "Role", "Status", "Joined", "Trust", "Jobs", "Disputes", "Actions"]}
              empty="No users match the current filters."
              rows={data.users.items.map((user) => [
                <span key="user">
                  <strong>{user.name}</strong>
                  <small>{user.email}</small>
                </span>,
                user.role,
                <Status key="status" value={user.status} />,
                dateLabel(user.joinedAt),
                user.trustScore,
                user.activeJobs,
                user.disputeCount,
                <div className="table-actions" key="actions">
                  <button type="button" onClick={() => patch(`/api/admin/users/${user.id}/status`, { status: "active" }, `Reinstate ${user.email}?`)}>
                    Reinstate
                  </button>
                  <button type="button" onClick={() => patch(`/api/admin/users/${user.id}/status`, { status: "suspended" }, `Suspend ${user.email}?`)}>
                    Suspend
                  </button>
                  <button type="button" onClick={() => patch(`/api/admin/users/${user.id}/status`, { status: "banned" }, `Ban ${user.email}?`)}>
                    Ban
                  </button>
                </div>
              ])}
            />
          </div>

          <div className="admin-section">
            <div className="section-heading">
              <h3>Listing Moderation</h3>
              <span>{data.listings.pagination.total} listings</span>
            </div>
            <AdminTable
              columns={["Listing", "Client", "Reports", "Status", "Actions"]}
              empty="No listings are in moderation."
              rows={data.listings.items.map((listing) => [
                <span key="listing">
                  <strong>{listing.title}</strong>
                  <small>{listing.flagReason ?? "No reason recorded"}</small>
                </span>,
                listing.clientName,
                listing.reportCount ?? 0,
                <Status key="status" value={listing.status} />,
                <div className="table-actions" key="actions">
                  <button type="button" onClick={() => patch(`/api/admin/moderation/${listing.id}`, { decision: "approved" }, `Approve ${listing.title}?`)}>
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      patch(`/api/admin/moderation/${listing.id}`, { decision: "rejected", reason: "Rejected by admin review." }, `Reject ${listing.title}?`)
                    }
                  >
                    Reject
                  </button>
                  <button type="button" onClick={() => patch(`/api/admin/moderation/${listing.id}`, { decision: "escalated" }, `Escalate ${listing.title}?`)}>
                    Escalate
                  </button>
                </div>
              ])}
            />
          </div>

          <div className="admin-section">
            <div className="section-heading">
              <h3>Dispute Resolution</h3>
              <span>{data.disputes.pagination.total} disputes</span>
            </div>
            <AdminTable
              columns={["Dispute", "Parties", "Amount", "Status", "Evidence", "Actions"]}
              empty="No open disputes."
              rows={data.disputes.items.map((dispute) => [
                <span key="dispute">
                  <strong>{dispute.title}</strong>
                  <small>{dispute.thread.join(" ")}</small>
                </span>,
                `${dispute.clientName} / ${dispute.freelancerName}`,
                money(dispute.amount),
                <Status key="status" value={dispute.status} />,
                dispute.evidence.join(", "),
                <div className="table-actions" key="actions">
                  <button
                    type="button"
                    onClick={() =>
                      patch(`/api/admin/disputes/${dispute.id}/ruling`, { ruling: "client", notes: "Refund approved after admin review." }, `Rule for client on ${dispute.id}?`)
                    }
                  >
                    Client
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      patch(`/api/admin/disputes/${dispute.id}/ruling`, { ruling: "freelancer", notes: "Payment released after admin review." }, `Rule for freelancer on ${dispute.id}?`)
                    }
                  >
                    Freelancer
                  </button>
                  <button
                    type="button"
                    onClick={() => patch(`/api/admin/disputes/${dispute.id}/ruling`, { ruling: "escalated", notes: "Escalated to senior admin." }, `Escalate ${dispute.id}?`)}
                  >
                    Escalate
                  </button>
                </div>
              ])}
            />
          </div>

          <div className="admin-section">
            <div className="section-heading">
              <h3>Audit Log</h3>
              <span>{data.audit.pagination.total} entries</span>
            </div>
            <AdminTable
              columns={["Time", "Admin", "Action", "Target", "Details"]}
              empty="No audit records."
              rows={data.audit.items.map((entry) => [
                new Date(entry.createdAt).toLocaleString("en-GB"),
                entry.adminId,
                entry.action,
                `${entry.targetType}:${entry.targetId}`,
                entry.details
              ])}
            />
          </div>
        </>
      ) : (
        <div className="admin-empty" role="status">
          <strong>403</strong>
          <span>Admin-only data is hidden until an authenticated admin token is supplied.</span>
        </div>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Status({ value }: { value: string }) {
  return <span className={`status status-${value.replace("_", "-")}`}>{value}</span>;
}

function AdminTable({ columns, rows, empty }: { columns: string[]; rows: Array<Array<ReactNode>>; empty: string }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length}>{empty}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
