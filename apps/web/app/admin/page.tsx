"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

type Summary = {
  totalUsers: number;
  activeJobs: number;
  openDisputes: number;
  flaggedListings: number;
  revenue: number;
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
  trustScore: number;
};

type ModerationJob = {
  id: string;
  title: string;
  ownerId: string;
  moderationStatus: string;
  reportReason: string;
};

type Dispute = {
  id: string;
  jobId: string;
  status: string;
  amount: number;
  openedAt: string;
};

type AuditEntry = {
  id: string;
  adminId: string;
  actionType: string;
  targetId: string;
  message: string;
  createdAt: string;
};

type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type Controls = {
  registrationsEnabled: boolean;
  jobPostingEnabled: boolean;
};

const emptyPage = <T,>(): Paginated<T> => ({
  items: [],
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 1
});

const defaultSummary: Summary = {
  totalUsers: 0,
  activeJobs: 0,
  openDisputes: 0,
  flaggedListings: 0,
  revenue: 0
};

const defaultApiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function AdminPanelPage() {
  const [apiBase, setApiBase] = useState(defaultApiBase);
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "forbidden" | "error">("idle");
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState(defaultSummary);
  const [trustDistribution, setTrustDistribution] = useState<{ range: string; count: number }[]>([]);
  const [users, setUsers] = useState<Paginated<User>>(emptyPage<User>());
  const [moderation, setModeration] = useState<Paginated<ModerationJob>>(emptyPage<ModerationJob>());
  const [disputes, setDisputes] = useState<Paginated<Dispute>>(emptyPage<Dispute>());
  const [audit, setAudit] = useState<Paginated<AuditEntry>>(emptyPage<AuditEntry>());
  const [controls, setControls] = useState<Controls>({ registrationsEnabled: false, jobPostingEnabled: false });
  const [userSearch, setUserSearch] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userStatus, setUserStatus] = useState("");
  const [joinedFrom, setJoinedFrom] = useState("");
  const [joinedTo, setJoinedTo] = useState("");
  const [auditAdmin, setAuditAdmin] = useState("");
  const [auditType, setAuditType] = useState("");
  const [auditFrom, setAuditFrom] = useState("");
  const [auditTo, setAuditTo] = useState("");
  const [selectedUser, setSelectedUser] = useState<Record<string, unknown> | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const savedToken = window.localStorage.getItem("admin_token") ?? "";
    const savedApiBase = window.localStorage.getItem("admin_api_base") ?? defaultApiBase;
    setToken(savedToken);
    setApiBase(savedApiBase);
    if (savedToken) {
      void refresh(savedToken, savedApiBase);
    } else {
      setStatus("forbidden");
    }
  }, []);

  const authHeaders = useMemo(
    () => ({
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    }),
    [token]
  );

  async function request<T>(path: string, options: RequestInit = {}, activeToken = token, activeApiBase = apiBase): Promise<T> {
    const response = await fetch(`${activeApiBase}${path}`, {
      ...options,
      headers: {
        authorization: `Bearer ${activeToken}`,
        "content-type": "application/json",
        ...(options.headers ?? {})
      }
    });
    const payload = await response.json();

    if (!response.ok || !payload.success) {
      const error = new Error(payload.message ?? "Admin request failed");
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    return payload.data as T;
  }

  async function refresh(activeToken = token, activeApiBase = apiBase) {
    if (!activeToken) {
      setStatus("forbidden");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const [overview, userPage, moderationPage, disputePage, auditPage, platformControls] = await Promise.all([
        request<{ summary: Summary; trustDistribution: { range: string; count: number }[]; controls: Controls }>(
          "/api/admin/overview",
          {},
          activeToken,
          activeApiBase
        ),
        request<Paginated<User>>(
          `/api/admin/users?${new URLSearchParams({
            search: userSearch,
            role: userRole,
            status: userStatus,
            joinedFrom,
            joinedTo
          }).toString()}`,
          {},
          activeToken,
          activeApiBase
        ),
        request<Paginated<ModerationJob>>("/api/admin/moderation", {}, activeToken, activeApiBase),
        request<Paginated<Dispute>>("/api/admin/disputes", {}, activeToken, activeApiBase),
        request<Paginated<AuditEntry>>(
          `/api/admin/audit?${new URLSearchParams({
            adminId: auditAdmin,
            actionType: auditType,
            from: auditFrom,
            to: auditTo
          }).toString()}`,
          {},
          activeToken,
          activeApiBase
        ),
        request<Controls>("/api/admin/controls", {}, activeToken, activeApiBase)
      ]);

      setSummary(overview.summary);
      setTrustDistribution(overview.trustDistribution);
      setUsers(userPage);
      setModeration(moderationPage);
      setDisputes(disputePage);
      setAudit(auditPage);
      setControls(platformControls);
      setStatus("ready");
    } catch (error) {
      const statusCode = (error as Error & { status?: number }).status;
      setStatus(statusCode === 403 || statusCode === 401 ? "forbidden" : "error");
      setMessage(error instanceof Error ? error.message : "Unable to load admin data");
    }
  }

  function saveAccess() {
    window.localStorage.setItem("admin_token", token);
    window.localStorage.setItem("admin_api_base", apiBase);
    void refresh(token, apiBase);
  }

  async function runAction(label: string, action: () => Promise<void>) {
    if (!window.confirm(label)) {
      return;
    }

    setStatus("loading");
    setMessage("");
    try {
      await action();
      await refresh();
      setMessage("Action recorded in the audit log.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Action failed");
    }
  }

  async function loadUserProfile(userId: string) {
    setSelectedUser(await request<Record<string, unknown>>(`/api/admin/users/${userId}`));
  }

  async function loadDispute(disputeId: string) {
    setSelectedDispute(await request<Record<string, unknown>>(`/api/admin/disputes/${disputeId}`));
  }

  const isBlocked = status === "forbidden";
  const isLoading = status === "loading";

  return (
    <section className="admin-shell" aria-label="Admin operations panel">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h2>Admin Control Room</h2>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={isLoading || !token} aria-label="Refresh admin data">
          Refresh
        </button>
      </header>

      <section className="admin-access" aria-label="Admin access">
        <label>
          API base
          <input value={apiBase} onChange={(event) => setApiBase(event.target.value)} />
        </label>
        <label>
          Admin token
          <input
            value={token}
            onChange={(event) => setToken(event.target.value)}
            type="password"
            autoComplete="off"
          />
        </label>
        <button type="button" onClick={saveAccess}>
          Connect
        </button>
      </section>

      {isBlocked ? (
        <section className="admin-state" role="alert">
          <strong>403</strong>
          <span>Admin credentials are required.</span>
        </section>
      ) : null}

      {message ? (
        <section className="admin-state" role="status">
          {message}
        </section>
      ) : null}

      <section className="metric-grid" aria-label="Trust and platform metrics">
        <Metric label="Users" value={summary.totalUsers} />
        <Metric label="Active jobs" value={summary.activeJobs} />
        <Metric label="Open disputes" value={summary.openDisputes} />
        <Metric label="Flagged listings" value={summary.flaggedListings} />
        <Metric label="Revenue" value={`$${summary.revenue.toLocaleString()}`} />
      </section>

      <section className="admin-band">
        <div>
          <h3>Trust Score Distribution</h3>
          <div className="trust-chart">
            {trustDistribution.length ? (
              trustDistribution.map((bucket) => (
                <div key={bucket.range}>
                  <span>{bucket.range}</span>
                  <meter min="0" max={summary.totalUsers || 1} value={bucket.count} />
                  <strong>{bucket.count}</strong>
                </div>
              ))
            ) : (
              <p>No trust data available.</p>
            )}
          </div>
        </div>
        <div>
          <h3>Platform Controls</h3>
          <ControlRow
            label="New registrations"
            enabled={controls.registrationsEnabled}
            onChange={(enabled) =>
              runAction("Update registration control?", () =>
                request("/api/admin/controls", {
                  method: "PATCH",
                  headers: authHeaders,
                  body: JSON.stringify({ key: "registrationsEnabled", enabled })
                })
              )
            }
          />
          <ControlRow
            label="New job postings"
            enabled={controls.jobPostingEnabled}
            onChange={(enabled) =>
              runAction("Update job posting control?", () =>
                request("/api/admin/controls", {
                  method: "PATCH",
                  headers: authHeaders,
                  body: JSON.stringify({ key: "jobPostingEnabled", enabled })
                })
              )
            }
          />
        </div>
      </section>

      <section className="admin-panel">
        <div className="table-toolbar">
          <h3>User Management</h3>
          <input placeholder="Search users" value={userSearch} onChange={(event) => setUserSearch(event.target.value)} />
          <select aria-label="Filter users by role" value={userRole} onChange={(event) => setUserRole(event.target.value)}>
            <option value="">All roles</option>
            <option value="client">Clients</option>
            <option value="freelancer">Freelancers</option>
          </select>
          <select
            aria-label="Filter users by status"
            value={userStatus}
            onChange={(event) => setUserStatus(event.target.value)}
          >
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
          <input
            aria-label="Filter users joined after"
            type="date"
            value={joinedFrom}
            onChange={(event) => setJoinedFrom(event.target.value)}
          />
          <input
            aria-label="Filter users joined before"
            type="date"
            value={joinedTo}
            onChange={(event) => setJoinedTo(event.target.value)}
          />
          <button type="button" onClick={() => void refresh()}>
            Apply
          </button>
        </div>
        <DataTable
          empty="No users match the current filters."
          columns={["Name", "Role", "Status", "Joined", "Trust", "Actions"]}
          rows={users.items.map((user) => [
            <span key="name">{user.name}</span>,
            user.role,
            user.status,
            user.joinedAt,
            user.trustScore,
            <div className="row-actions" key="actions">
              <button type="button" onClick={() => void loadUserProfile(user.id)}>
                View
              </button>
              <button
                type="button"
                onClick={() =>
                  runAction("Suspend this user?", () =>
                    request(`/api/admin/users/${user.id}/status`, {
                      method: "PATCH",
                      headers: authHeaders,
                      body: JSON.stringify({ status: "suspended", reason: "Manual admin review" })
                    })
                  )
                }
              >
                Suspend
              </button>
              <button
                type="button"
                onClick={() =>
                  runAction("Reinstate this user?", () =>
                    request(`/api/admin/users/${user.id}/status`, {
                      method: "PATCH",
                      headers: authHeaders,
                      body: JSON.stringify({ status: "active", reason: "Admin reinstatement" })
                    })
                  )
                }
              >
                Reinstate
              </button>
              <button
                type="button"
                onClick={() =>
                  runAction("Permanently ban this user?", () =>
                    request(`/api/admin/users/${user.id}/status`, {
                      method: "PATCH",
                      headers: authHeaders,
                      body: JSON.stringify({ status: "banned", reason: "Policy violation" })
                    })
                  )
                }
              >
                Ban
              </button>
            </div>
          ])}
        />
      </section>

      <section className="admin-panel">
        <h3>Job Moderation</h3>
        <DataTable
          empty="No listings are waiting for review."
          columns={["Listing", "Status", "Reason", "Actions"]}
          rows={moderation.items.map((job) => [
            job.title,
            job.moderationStatus,
            job.reportReason || "No reason recorded",
            <div className="row-actions" key="actions">
              {(["approve", "reject", "escalate"] as const).map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() =>
                    runAction(`${action} listing ${job.id}?`, () =>
                      request(`/api/admin/moderation/${job.id}`, {
                        method: "PATCH",
                        headers: authHeaders,
                        body: JSON.stringify({ action, reason: `${action} from admin panel` })
                      })
                    )
                  }
                >
                  {action}
                </button>
              ))}
            </div>
          ])}
        />
      </section>

      <section className="admin-panel">
        <h3>Dispute Resolution</h3>
        <DataTable
          empty="No disputes are open."
          columns={["Dispute", "Job", "Status", "Amount", "Opened", "Actions"]}
          rows={disputes.items.map((dispute) => [
            dispute.id,
            dispute.jobId,
            dispute.status,
            `$${dispute.amount}`,
            dispute.openedAt,
            <div className="row-actions" key="actions">
              <button type="button" onClick={() => void loadDispute(dispute.id)}>
                View
              </button>
              {(["client", "freelancer", "refund", "escalate"] as const).map((ruling) => (
                <button
                  key={ruling}
                  type="button"
                  onClick={() =>
                    runAction(`Record ${ruling} ruling?`, () =>
                      request(`/api/admin/disputes/${dispute.id}/ruling`, {
                        method: "PATCH",
                        headers: authHeaders,
                        body: JSON.stringify({ ruling, reason: `${ruling} ruling from admin panel` })
                      })
                    )
                  }
                >
                  {ruling}
                </button>
              ))}
            </div>
          ])}
        />
      </section>

      <section className="admin-panel">
        <div className="table-toolbar">
          <h3>Audit Log</h3>
          <input
            placeholder="Admin ID"
            value={auditAdmin}
            onChange={(event) => setAuditAdmin(event.target.value)}
          />
          <input
            placeholder="Action type"
            value={auditType}
            onChange={(event) => setAuditType(event.target.value)}
          />
          <input
            aria-label="Filter audit from"
            type="datetime-local"
            value={auditFrom}
            onChange={(event) => setAuditFrom(event.target.value)}
          />
          <input
            aria-label="Filter audit to"
            type="datetime-local"
            value={auditTo}
            onChange={(event) => setAuditTo(event.target.value)}
          />
          <button type="button" onClick={() => void refresh()}>
            Filter
          </button>
        </div>
        <DataTable
          empty="No audit entries match the current filters."
          columns={["Time", "Admin", "Action", "Target", "Message"]}
          rows={audit.items.map((entry) => [
            new Date(entry.createdAt).toLocaleString(),
            entry.adminId,
            entry.actionType,
            entry.targetId,
            entry.message
          ])}
        />
      </section>

      {(selectedUser || selectedDispute) && (
        <section className="admin-detail" aria-label="Selected record detail">
          <button
            type="button"
            onClick={() => {
              setSelectedUser(null);
              setSelectedDispute(null);
            }}
          >
            Close
          </button>
          <pre>{JSON.stringify(selectedUser ?? selectedDispute, null, 2)}</pre>
        </section>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function ControlRow({ label, enabled, onChange }: { label: string; enabled: boolean; onChange: (enabled: boolean) => void }) {
  return (
    <label className="control-row">
      <span>{label}</span>
      <input type="checkbox" checked={enabled} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function DataTable({
  columns,
  rows,
  empty
}: {
  columns: string[];
  rows: Array<Array<ReactNode>>;
  empty: string;
}) {
  if (!rows.length) {
    return <p className="empty-state">{empty}</p>;
  }

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
