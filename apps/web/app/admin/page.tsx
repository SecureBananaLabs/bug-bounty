"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
};

type MetricData = {
  totalUsers: number;
  activeJobs: number;
  openDisputes: number;
  flaggedListings: number;
  revenueCurrentPeriod: number;
  trustScoreDistribution: { range: string; count: number }[];
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
  activeJobs: number;
  disputes: number;
  trustScore: number;
};

type ListingRow = {
  id: string;
  title: string;
  status: string;
  reason: string;
  risk: string;
};

type DisputeRow = {
  id: string;
  jobId: string;
  status: string;
  amount: number;
  evidence: string[];
  thread: string[];
};

type ControlRow = {
  key: string;
  label: string;
  enabled: boolean;
  updatedAt: string;
  updatedBy: string;
};

type AuditRow = {
  id: string;
  adminId: string;
  action: string;
  targetId: string;
  detail: string;
  createdAt: string;
};

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000";

export default function AdminPanelPage() {
  const [token, setToken] = useState("");
  const [draftToken, setDraftToken] = useState("");
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [users, setUsers] = useState<PageResult<UserRow> | null>(null);
  const [listings, setListings] = useState<PageResult<ListingRow> | null>(null);
  const [disputes, setDisputes] = useState<PageResult<DisputeRow> | null>(null);
  const [controls, setControls] = useState<ControlRow[]>([]);
  const [auditLog, setAuditLog] = useState<PageResult<AuditRow> | null>(null);
  const [filters, setFilters] = useState({ search: "", role: "", status: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const headers = useMemo(() => ({
    authorization: `Bearer ${token}`,
    "content-type": "application/json"
  }), [token]);

  useEffect(() => {
    const storedToken = window.localStorage.getItem("adminToken");
    if (storedToken) {
      setToken(storedToken);
      setDraftToken(storedToken);
    }
  }, []);

  useEffect(() => {
    if (token) {
      void refreshData();
    }
  }, [token]);

  async function refreshData() {
    setLoading(true);
    setError("");

    try {
      const query = new URLSearchParams(filters);
      const [metricsData, usersData, listingsData, disputesData, controlsData, auditData] = await Promise.all([
        request<MetricData>("/api/admin/metrics"),
        request<PageResult<UserRow>>(`/api/admin/users?${query}`),
        request<PageResult<ListingRow>>("/api/admin/moderation/jobs"),
        request<PageResult<DisputeRow>>("/api/admin/disputes"),
        request<ControlRow[]>("/api/admin/platform-controls"),
        request<PageResult<AuditRow>>("/api/admin/audit-log")
      ]);

      setMetrics(metricsData);
      setUsers(usersData);
      setListings(listingsData);
      setDisputes(disputesData);
      setControls(controlsData);
      setAuditLog(auditData);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load admin data.");
    } finally {
      setLoading(false);
    }
  }

  async function request<T>(path: string, options: RequestInit = {}) {
    const response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers ?? {})
      }
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message ?? "Admin request failed.");
    }

    return payload.data as T;
  }

  function saveToken() {
    window.localStorage.setItem("adminToken", draftToken);
    setToken(draftToken);
  }

  async function updateUserStatus(userId: string, status: string) {
    await request(`/api/admin/users/${userId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    await refreshData();
  }

  async function moderateListing(listingId: string, decision: string) {
    const reason = window.prompt(`Reason for ${decision}?`);
    if (!reason) return;

    await request(`/api/admin/moderation/jobs/${listingId}/decision`, {
      method: "POST",
      body: JSON.stringify({ decision, reason })
    });
    await refreshData();
  }

  async function ruleDispute(disputeId: string, ruling: string) {
    const reason = window.prompt(`Reason for ruling ${ruling}?`);
    if (!reason) return;

    await request(`/api/admin/disputes/${disputeId}/ruling`, {
      method: "POST",
      body: JSON.stringify({ ruling, reason })
    });
    await refreshData();
  }

  async function toggleControl(control: ControlRow) {
    const nextValue = !control.enabled;
    const confirmed = window.confirm(`${nextValue ? "Enable" : "Disable"} ${control.label}?`);
    if (!confirmed) return;

    await request(`/api/admin/platform-controls/${control.key}`, {
      method: "PATCH",
      body: JSON.stringify({ enabled: nextValue })
    });
    await refreshData();
  }

  if (!token) {
    return (
      <section className="admin-shell">
        <div className="admin-guard" role="alert">
          <h1>403</h1>
          <p>Admin access requires an authenticated admin API token.</p>
          <label>
            Admin token
            <input
              aria-label="Admin token"
              type="password"
              value={draftToken}
              onChange={(event) => setDraftToken(event.target.value)}
            />
          </label>
          <button type="button" onClick={saveToken}>Unlock</button>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-shell">
      <header className="admin-header">
        <div>
          <h1>Admin Operations</h1>
          <p>Users, moderation, disputes, controls, and audit history.</p>
        </div>
        <button type="button" onClick={refreshData} disabled={loading}>
          {loading ? "Refreshing" : "Refresh"}
        </button>
      </header>

      {error ? <p className="admin-error" role="alert">{error}</p> : null}

      <section className="metric-grid" aria-label="Platform metrics">
        <Metric label="Total users" value={metrics?.totalUsers} />
        <Metric label="Active jobs" value={metrics?.activeJobs} />
        <Metric label="Open disputes" value={metrics?.openDisputes} />
        <Metric label="Flagged listings" value={metrics?.flaggedListings} />
        <Metric label="Revenue" value={metrics ? `$${metrics.revenueCurrentPeriod.toLocaleString()}` : undefined} />
      </section>

      <section className="admin-section">
        <div className="section-heading">
          <h2>User Management</h2>
          <div className="filter-row">
            <input aria-label="Search users" placeholder="Search" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
            <select aria-label="Filter users by role" value={filters.role} onChange={(event) => setFilters({ ...filters, role: event.target.value })}>
              <option value="">Any role</option>
              <option value="client">Client</option>
              <option value="freelancer">Freelancer</option>
              <option value="admin">Admin</option>
            </select>
            <select aria-label="Filter users by status" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
              <option value="">Any status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
            <button type="button" onClick={refreshData}>Apply</button>
          </div>
        </div>
        <DataTable empty={!users?.items.length}>
          <thead>
            <tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th>Profile</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users?.items.map((user) => (
              <tr key={user.id}>
                <td><strong>{user.name}</strong><span>{user.email}</span></td>
                <td>{user.role}</td>
                <td><Status value={user.status} /></td>
                <td>{user.joinedAt}</td>
                <td>{user.activeJobs} jobs, {user.disputes} disputes, trust {user.trustScore}</td>
                <td className="action-cell">
                  <button type="button" onClick={() => updateUserStatus(user.id, "suspended")}>Suspend</button>
                  <button type="button" onClick={() => updateUserStatus(user.id, "active")}>Reinstate</button>
                  <button type="button" onClick={() => updateUserStatus(user.id, "banned")}>Ban</button>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </section>

      <section className="admin-section two-column">
        <div>
          <h2>Trust Scores</h2>
          <div className="bars" aria-label="Trust score distribution">
            {metrics?.trustScoreDistribution.map((bucket) => (
              <div key={bucket.range}>
                <span>{bucket.range}</span>
                <meter min={0} max={metrics.totalUsers} value={bucket.count} />
                <strong>{bucket.count}</strong>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2>Platform Controls</h2>
          <div className="control-list">
            {controls.map((control) => (
              <label key={control.key} className="switch-row">
                <span>{control.label}<small>Updated by {control.updatedBy}</small></span>
                <input aria-label={control.label} type="checkbox" checked={control.enabled} onChange={() => toggleControl(control)} />
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="admin-section">
        <h2>Job Moderation</h2>
        <DataTable empty={!listings?.items.length}>
          <thead>
            <tr><th>Listing</th><th>Risk</th><th>Status</th><th>Reason</th><th>Decision</th></tr>
          </thead>
          <tbody>
            {listings?.items.map((listing) => (
              <tr key={listing.id}>
                <td>{listing.title}</td>
                <td>{listing.risk}</td>
                <td><Status value={listing.status} /></td>
                <td>{listing.reason}</td>
                <td className="action-cell">
                  <button type="button" onClick={() => moderateListing(listing.id, "approved")}>Approve</button>
                  <button type="button" onClick={() => moderateListing(listing.id, "rejected")}>Reject</button>
                  <button type="button" onClick={() => moderateListing(listing.id, "escalated")}>Escalate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </section>

      <section className="admin-section">
        <h2>Dispute Resolution</h2>
        <DataTable empty={!disputes?.items.length}>
          <thead>
            <tr><th>Dispute</th><th>Status</th><th>Evidence</th><th>Thread</th><th>Ruling</th></tr>
          </thead>
          <tbody>
            {disputes?.items.map((dispute) => (
              <tr key={dispute.id}>
                <td><strong>{dispute.id}</strong><span>{dispute.jobId} · ${dispute.amount}</span></td>
                <td><Status value={dispute.status} /></td>
                <td>{dispute.evidence.join(", ")}</td>
                <td>{dispute.thread.join(" ")}</td>
                <td className="action-cell">
                  <button type="button" onClick={() => ruleDispute(dispute.id, "client")}>Client</button>
                  <button type="button" onClick={() => ruleDispute(dispute.id, "freelancer")}>Freelancer</button>
                  <button type="button" onClick={() => ruleDispute(dispute.id, "refund")}>Refund</button>
                  <button type="button" onClick={() => ruleDispute(dispute.id, "escalate")}>Escalate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </section>

      <section className="admin-section">
        <h2>Audit Log</h2>
        <DataTable empty={!auditLog?.items.length}>
          <thead>
            <tr><th>Time</th><th>Admin</th><th>Action</th><th>Target</th><th>Detail</th></tr>
          </thead>
          <tbody>
            {auditLog?.items.map((entry) => (
              <tr key={entry.id}>
                <td>{new Date(entry.createdAt).toLocaleString()}</td>
                <td>{entry.adminId}</td>
                <td>{entry.action}</td>
                <td>{entry.targetId}</td>
                <td>{entry.detail}</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </section>
    </section>
  );
}

function Metric({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value ?? "..."}</strong>
    </div>
  );
}

function Status({ value }: { value: string }) {
  return <span className={`status-pill ${value.replace("_", "-")}`}>{value.replace("_", " ")}</span>;
}

function DataTable({ children, empty }: { children: ReactNode; empty: boolean }) {
  return (
    <div className="table-wrap">
      {empty ? <p className="empty-state">No records match the current view.</p> : <table>{children}</table>}
    </div>
  );
}
