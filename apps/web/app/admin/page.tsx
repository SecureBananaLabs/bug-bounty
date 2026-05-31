"use client";

import { useEffect, useMemo, useState } from "react";

type PageResult<T> = {
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
  trustScoreDistribution: { label: string; count: number }[];
  refreshedAt: string;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
  trustScore: number;
  activeJobs: number;
  disputes?: unknown[];
};

type ModerationItem = {
  id: string;
  title: string;
  posterName: string;
  status: string;
  reason: string;
  budget: number;
  notifications: unknown[];
};

type Dispute = {
  id: string;
  jobTitle: string;
  clientName: string;
  freelancerName: string;
  status: string;
  amount: number;
  thread?: unknown[];
  evidence?: string[];
};

type Settings = {
  registrationsEnabled: boolean;
  jobPostingEnabled: boolean;
  updatedAt: string;
};

type AuditEntry = {
  id: string;
  adminId: string;
  actionType: string;
  targetId: string;
  details: string;
  createdAt: string;
};

type AdminState = {
  metrics?: Metrics;
  users?: PageResult<AdminUser>;
  moderation?: PageResult<ModerationItem>;
  disputes?: PageResult<Dispute>;
  settings?: Settings;
  audit?: PageResult<AuditEntry>;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const configuredAdminToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN ?? "";

const views = ["users", "moderation", "disputes", "controls", "audit"] as const;

export default function AdminPanelPage() {
  const [token, setToken] = useState(configuredAdminToken);
  const [tokenInput, setTokenInput] = useState("");
  const [state, setState] = useState<AdminState>({});
  const [activeView, setActiveView] = useState<(typeof views)[number]>("users");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accessDenied, setAccessDenied] = useState(!configuredAdminToken);

  const maxTrustBucket = useMemo(() => {
    return Math.max(...(state.metrics?.trustScoreDistribution.map((bucket) => bucket.count) ?? [1]));
  }, [state.metrics]);

  useEffect(() => {
    const savedToken = window.localStorage.getItem("freelanceflow-admin-token");
    if (savedToken && !configuredAdminToken) {
      setToken(savedToken);
      setAccessDenied(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      void refreshAll();
    }
  }, [token]);

  async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        ...(options.headers ?? {})
      }
    });
    const payload = await response.json();

    if (response.status === 401 || response.status === 403) {
      setAccessDenied(true);
    }

    if (!response.ok) {
      throw new Error(payload.message ?? "Admin request failed");
    }

    return payload.data;
  }

  async function refreshAll() {
    setLoading(true);
    setError("");
    try {
      const [metrics, users, moderation, disputes, settings, audit] = await Promise.all([
        adminFetch<Metrics>("/api/admin/metrics"),
        adminFetch<PageResult<AdminUser>>("/api/admin/users?pageSize=10"),
        adminFetch<PageResult<ModerationItem>>("/api/admin/moderation?pageSize=10"),
        adminFetch<PageResult<Dispute>>("/api/admin/disputes?pageSize=10"),
        adminFetch<Settings>("/api/admin/settings"),
        adminFetch<PageResult<AuditEntry>>("/api/admin/audit?pageSize=10")
      ]);

      setState({ metrics, users, moderation, disputes, settings, audit });
      setAccessDenied(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load admin data");
    } finally {
      setLoading(false);
    }
  }

  async function updateUserStatus(user: AdminUser, status: "active" | "suspended" | "banned") {
    await adminFetch(`/api/admin/users/${user.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, reason: `Admin set account to ${status}` })
    });
    await refreshAll();
  }

  async function viewUser(user: AdminUser) {
    const profile = await adminFetch<AdminUser>(`/api/admin/users/${user.id}`);
    setSelectedUser(profile);
  }

  async function decideListing(item: ModerationItem, decision: "approve" | "reject" | "escalate") {
    await adminFetch(`/api/admin/moderation/${item.id}/decision`, {
      method: "POST",
      body: JSON.stringify({ decision, reason: `Admin selected ${decision}` })
    });
    await refreshAll();
  }

  async function decideDispute(dispute: Dispute, ruling: "client" | "freelancer" | "refund" | "escalate") {
    await adminFetch(`/api/admin/disputes/${dispute.id}/ruling`, {
      method: "POST",
      body: JSON.stringify({ ruling, reason: `Admin ruling: ${ruling}` })
    });
    await refreshAll();
  }

  async function toggleSetting(key: keyof Pick<Settings, "registrationsEnabled" | "jobPostingEnabled">) {
    if (!state.settings) {
      return;
    }

    const nextValue = !state.settings[key];
    if (!window.confirm(`Confirm ${key} = ${nextValue}`)) {
      return;
    }

    await adminFetch("/api/admin/settings", {
      method: "PATCH",
      body: JSON.stringify({ [key]: nextValue, reason: `Admin toggled ${key}` })
    });
    await refreshAll();
  }

  function saveToken() {
    window.localStorage.setItem("freelanceflow-admin-token", tokenInput);
    setToken(tokenInput);
    setAccessDenied(false);
  }

  if (accessDenied) {
    return (
      <section className="admin-shell">
        <div className="admin-access" role="alert">
          <span className="status-pill danger">403</span>
          <h2>Admin access required</h2>
          <label>
            Admin token
            <input
              aria-label="Admin token"
              value={tokenInput}
              onChange={(event) => setTokenInput(event.target.value)}
              placeholder="Paste admin JWT"
            />
          </label>
          <button type="button" onClick={saveToken} disabled={!tokenInput.trim()}>
            Unlock panel
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-shell">
      <div className="admin-topbar">
        <div>
          <p className="eyebrow">Admin operations</p>
          <h2>Platform control center</h2>
        </div>
        <button type="button" onClick={refreshAll} disabled={loading} aria-label="Refresh admin data">
          Refresh
        </button>
      </div>

      {error ? <p className="admin-alert" role="alert">{error}</p> : null}
      {loading ? <p className="admin-alert muted">Loading latest admin data...</p> : null}

      <div className="admin-metrics" aria-label="Admin metrics">
        <Metric label="Users" value={state.metrics?.totalUsers ?? 0} />
        <Metric label="Active jobs" value={state.metrics?.activeJobs ?? 0} />
        <Metric label="Open disputes" value={state.metrics?.openDisputes ?? 0} />
        <Metric label="Flagged listings" value={state.metrics?.flaggedListings ?? 0} />
        <Metric label="Revenue" value={`$${(state.metrics?.revenueCurrentPeriod ?? 0).toLocaleString()}`} />
      </div>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <h3>Trust distribution</h3>
          <span>{state.metrics?.refreshedAt ? new Date(state.metrics.refreshedAt).toLocaleString() : "Not loaded"}</span>
        </div>
        <div className="trust-bars">
          {state.metrics?.trustScoreDistribution.map((bucket) => (
            <div key={bucket.label} className="trust-row">
              <span>{bucket.label}</span>
              <div aria-label={`${bucket.label} trust bucket`}><i style={{ width: `${(bucket.count / maxTrustBucket) * 100}%` }} /></div>
              <strong>{bucket.count}</strong>
            </div>
          ))}
        </div>
      </section>

      <div className="segmented" role="tablist" aria-label="Admin views">
        {views.map((view) => (
          <button
            key={view}
            type="button"
            role="tab"
            aria-selected={activeView === view}
            className={activeView === view ? "active" : ""}
            onClick={() => setActiveView(view)}
          >
            {view}
          </button>
        ))}
      </div>

      {activeView === "users" ? (
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <h3>User management</h3>
            <span>{state.users?.total ?? 0} users</span>
          </div>
          <table className="admin-table">
            <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Trust</th><th>Actions</th></tr></thead>
            <tbody>
              {state.users?.items.map((user) => (
                <tr key={user.id}>
                  <td><strong>{user.name}</strong><small>{user.email}</small></td>
                  <td>{user.role}</td>
                  <td><span className={`status-pill ${user.status}`}>{user.status}</span></td>
                  <td>{user.trustScore}</td>
                  <td className="row-actions">
                    <button type="button" onClick={() => viewUser(user)}>View</button>
                    <button type="button" onClick={() => updateUserStatus(user, "suspended")}>Suspend</button>
                    <button type="button" onClick={() => updateUserStatus(user, "active")}>Reinstate</button>
                    <button type="button" onClick={() => updateUserStatus(user, "banned")}>Ban</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {selectedUser ? (
            <aside className="admin-inspector" aria-label="Selected user profile">
              <strong>{selectedUser.name}</strong>
              <span>{selectedUser.activeJobs} active jobs</span>
              <span>{selectedUser.disputes?.length ?? 0} linked disputes</span>
            </aside>
          ) : null}
        </section>
      ) : null}

      {activeView === "moderation" ? (
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <h3>Listing moderation</h3>
            <span>{state.moderation?.total ?? 0} queued</span>
          </div>
          <table className="admin-table">
            <thead><tr><th>Listing</th><th>Poster</th><th>Reason</th><th>Status</th><th>Decision</th></tr></thead>
            <tbody>
              {state.moderation?.items.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.title}</strong><small>${item.budget.toLocaleString()}</small></td>
                  <td>{item.posterName}</td>
                  <td>{item.reason}</td>
                  <td><span className={`status-pill ${item.status}`}>{item.status}</span></td>
                  <td className="row-actions">
                    <button type="button" onClick={() => decideListing(item, "approve")}>Approve</button>
                    <button type="button" onClick={() => decideListing(item, "reject")}>Reject</button>
                    <button type="button" onClick={() => decideListing(item, "escalate")}>Escalate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {activeView === "disputes" ? (
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <h3>Dispute resolution</h3>
            <span>{state.disputes?.total ?? 0} disputes</span>
          </div>
          <table className="admin-table">
            <thead><tr><th>Dispute</th><th>Parties</th><th>Amount</th><th>Status</th><th>Ruling</th></tr></thead>
            <tbody>
              {state.disputes?.items.map((dispute) => (
                <tr key={dispute.id}>
                  <td><strong>{dispute.jobTitle}</strong><small>{dispute.evidence?.length ?? 0} evidence files</small></td>
                  <td>{dispute.clientName} / {dispute.freelancerName}</td>
                  <td>${dispute.amount.toLocaleString()}</td>
                  <td><span className={`status-pill ${dispute.status}`}>{dispute.status}</span></td>
                  <td className="row-actions">
                    <button type="button" onClick={() => decideDispute(dispute, "client")}>Client</button>
                    <button type="button" onClick={() => decideDispute(dispute, "freelancer")}>Freelancer</button>
                    <button type="button" onClick={() => decideDispute(dispute, "refund")}>Refund</button>
                    <button type="button" onClick={() => decideDispute(dispute, "escalate")}>Escalate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {activeView === "controls" ? (
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <h3>Platform controls</h3>
            <span>{state.settings?.updatedAt ? new Date(state.settings.updatedAt).toLocaleString() : "Not loaded"}</span>
          </div>
          <div className="control-list">
            <ControlRow label="New user registrations" value={state.settings?.registrationsEnabled} onToggle={() => toggleSetting("registrationsEnabled")} />
            <ControlRow label="New job postings" value={state.settings?.jobPostingEnabled} onToggle={() => toggleSetting("jobPostingEnabled")} />
          </div>
        </section>
      ) : null}

      {activeView === "audit" ? (
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <h3>Audit log</h3>
            <span>{state.audit?.total ?? 0} entries</span>
          </div>
          <table className="admin-table">
            <thead><tr><th>Action</th><th>Admin</th><th>Target</th><th>Details</th><th>Time</th></tr></thead>
            <tbody>
              {state.audit?.items.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.actionType}</td>
                  <td>{entry.adminId}</td>
                  <td>{entry.targetId}</td>
                  <td>{entry.details}</td>
                  <td>{new Date(entry.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="metric-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ControlRow({ label, value, onToggle }: { label: string; value?: boolean; onToggle: () => void }) {
  return (
    <div className="control-row">
      <span>{label}</span>
      <button type="button" role="switch" aria-checked={Boolean(value)} onClick={onToggle}>
        {value ? "Enabled" : "Disabled"}
      </button>
    </div>
  );
}
