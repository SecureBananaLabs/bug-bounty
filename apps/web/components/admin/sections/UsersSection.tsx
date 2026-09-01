"use client";

import { useState, useEffect } from "react";
import { api, ApiError, type PaginatedResult, type UserRecord, type UserProfile } from "../../../lib/api";
import { ServerTable, type Column } from "../ServerTable";
import { ConfirmDialog } from "../ConfirmDialog";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  BANNED: "Banned",
};

export function UsersSection({ refreshKey = 0 }: { refreshKey?: number }) {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [joinedBefore, setJoinedBefore] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [localRefreshKey, setLocalRefreshKey] = useState(0);

  const combinedKey = refreshKey + localRefreshKey;

  const fetchPage = (page: number, size: number): Promise<PaginatedResult<UserRecord>> =>
    api.users({ search, role, status, joinedBefore, page, pageSize: size });

  const columns: Column<UserRecord>[] = [
    { key: "fullName", header: "Name" },
    { key: "email", header: "Email" },
    {
      key: "role",
      header: "Role",
      render: (u) => <span style={{ textTransform: "lowercase" }}>{u.role.toLowerCase()}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (u) => STATUS_LABELS[u.status] ?? u.status,
    },
    { key: "trustScore", header: "Trust" },
    {
      key: "joinedAt",
      header: "Joined",
      render: (u) => new Date(u.joinedAt).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <>
          <button
            type="button"
            onClick={() => loadProfile(row)}
            aria-label={`View profile for ${row.fullName}`}
          >
            Profile
          </button>
          {" "}
          {row.status !== "BANNED" && row.status !== "SUSPENDED" && (
            <ConfirmDialog
              title="Suspend user"
              message={`Suspend ${row.fullName}? They will lose access until reinstated.`}
              confirmLabel="Suspend"
              onConfirm={async () => {
                try {
                  await api.setUserStatus(row.id, "suspend", "via admin panel");
                  setLocalRefreshKey((k) => k + 1);
                } catch (e) {
                  setServerError(e instanceof ApiError ? e.message : "Failed to suspend");
                }
              }}
            >
              <button type="button" aria-label={`Suspend ${row.fullName}`}>Suspend</button>
            </ConfirmDialog>
          )}
          {" "}
          {(row.status === "SUSPENDED" || row.status === "BANNED") && (
            <ConfirmDialog
              title="Reinstate user"
              message={`Reinstate ${row.fullName}? They will regain access.`}
              confirmLabel="Reinstate"
              onConfirm={async () => {
                try {
                  await api.setUserStatus(row.id, "reinstate");
                  setLocalRefreshKey((k) => k + 1);
                } catch (e) {
                  setServerError(e instanceof ApiError ? e.message : "Failed to reinstate");
                }
              }}
            >
              <button type="button" aria-label={`Reinstate ${row.fullName}`}>Reinstate</button>
            </ConfirmDialog>
          )}
          {" "}
          {row.status !== "BANNED" && (
            <ConfirmDialog
              title="Ban user permanently"
              message={`Permanently ban ${row.fullName}? This cannot be undone from this panel.`}
              confirmLabel="Ban permanently"
              onConfirm={async () => {
                try {
                  await api.setUserStatus(row.id, "ban", "policy violation");
                  setLocalRefreshKey((k) => k + 1);
                } catch (e) {
                  setServerError(e instanceof ApiError ? e.message : "Failed to ban");
                }
              }}
            >
              <button type="button" aria-label={`Ban ${row.fullName}`} style={{ background: "#c53030", color: "#fff" }}>
                Ban
              </button>
            </ConfirmDialog>
          )}
        </>
      ),
    },
  ];

  async function loadProfile(user: UserRecord) {
    try {
      setServerError(null);
      const profile = await api.userProfile(user.id);
      setSelectedUser(profile);
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : "Failed to load profile");
    }
  }

  useEffect(() => {
    setPageSize(10);
  }, [search, role, status, joinedBefore]);

  return (
    <section aria-labelledby="users-heading">
      <h2 id="users-heading">User Management</h2>

      {serverError && (
        <div className="card" role="alert" aria-label="Error">
          Error: {serverError}
        </div>
      )}

      <div className="filter-bar" role="search" aria-label="Filter users">
        <input
          type="search"
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search users"
        />
        <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Filter by role">
          <option value="">All roles</option>
          <option value="client">Client</option>
          <option value="freelancer">Freelancer</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
        <label>
          Joined on or before
          <input
            type="date"
            value={joinedBefore}
            onChange={(e) => setJoinedBefore(e.target.value)}
            aria-label="Filter by join date"
          />
        </label>
        {(search || role || status || joinedBefore) && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setRole("");
              setStatus("");
              setJoinedBefore("");
            }}
            aria-label="Clear user filters"
          >
            Clear filters
          </button>
        )}
      </div>

      <ServerTable<UserRecord>
        key={`users-${JSON.stringify({ search, role, status, joinedBefore, pageSize, refresh: combinedKey })}`}
        columns={columns}
        fetchPage={fetchPage}
        initialPageSize={pageSize}
      />

      {selectedUser && <UserProfileModal user={selectedUser} onClose={() => setSelectedUser(null)} />}
    </section>
  );
}

function UserProfileModal({ user, onClose }: { user: UserProfile; onClose: () => void }) {
  const activeJobs = Array.isArray(user.activeJobs) ? user.activeJobs : [];

  return (
    <div
      className="confirm-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Profile for ${user.fullName}`}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="card" style={{ maxWidth: "600px", width: "90%" }}>
        <button onClick={onClose} aria-label="Close profile" style={{ float: "right" }}>×</button>
        <h3>{user.fullName}</h3>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role.toLowerCase()}</p>
        <p><strong>Status:</strong> {STATUS_LABELS[user.status] ?? user.status}</p>
        <p><strong>Trust score:</strong> {user.trustScore}</p>

        <h4>Active jobs ({activeJobs.length})</h4>
        {activeJobs.length === 0 ? (
          <p>No active jobs.</p>
        ) : (
          <ul>
            {activeJobs.map((job: any) => (
              <li key={job.id}>{job.title} — {job.status}</li>
            ))}
          </ul>
        )}

        <h4>Dispute history ({user.disputeHistory.length})</h4>
        {user.disputeHistory.length === 0 ? (
          <p>No disputes.</p>
        ) : (
          <ul>
            {user.disputeHistory.map((d) => (
              <li key={d.id}>{d.id} — {d.status} — ${d.amount}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
