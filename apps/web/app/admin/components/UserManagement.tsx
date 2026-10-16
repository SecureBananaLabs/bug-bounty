"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  email?: string;
  role: string;
  status: string;
  trustScore: number;
  joinedAt: string;
}

const STATUS_OPTIONS = ["active", "flagged", "suspended"];
const ROLE_OPTIONS = ["client", "freelancer", "admin"];

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const fetchUsers = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (roleFilter)   params.set("role", roleFilter);

    fetch(`/api/admin/users?${params}`, { credentials: "include" })
      .then((r) => r.json())
      .then((res) => { if (res.success) setUsers(res.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [statusFilter, roleFilter]);

  const updateStatus = (userId: string, status: string) => {
    fetch(`/api/admin/users/${userId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    }).then(() => fetchUsers());
  };

  const updateRole = (userId: string, role: string) => {
    fetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ role }),
    }).then(() => fetchUsers());
  };

  const statusColor = (s: string) =>
    s === "active" ? "#16a34a" : s === "flagged" ? "#f59e0b" : s === "suspended" ? "#dc2626" : "var(--muted, #6b7280)";

  return (
    <section>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>User Management</h2>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: "0.35rem 0.5rem", borderRadius: 4, border: "1px solid var(--border, #d1d5db)" }}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          style={{ padding: "0.35rem 0.5rem", borderRadius: 4, border: "1px solid var(--border, #d1d5db)" }}>
          <option value="">All roles</option>
          {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : users.length === 0 ? (
        <p style={{ color: "var(--muted, #6b7280)" }}>No users found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid var(--border, #e5e7eb)" }}>
                <th style={{ padding: "0.5rem" }}>ID</th>
                <th style={{ padding: "0.5rem" }}>Email</th>
                <th style={{ padding: "0.5rem" }}>Role</th>
                <th style={{ padding: "0.5rem" }}>Status</th>
                <th style={{ padding: "0.5rem" }}>Trust</th>
                <th style={{ padding: "0.5rem" }}>Joined</th>
                <th style={{ padding: "0.5rem" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid var(--border, #e5e7eb)" }}>
                  <td style={{ padding: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem" }}>{u.id}</td>
                  <td style={{ padding: "0.5rem" }}>{u.email ?? "—"}</td>
                  <td style={{ padding: "0.5rem" }}>
                    <select value={u.role} onChange={(e) => updateRole(u.id, e.target.value)}
                      style={{ padding: "0.2rem 0.35rem", borderRadius: 4, fontSize: "0.75rem" }}>
                      {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    <span style={{ padding: "0.15rem 0.5rem", borderRadius: 999, background: statusColor(u.status) + "20", color: statusColor(u.status), fontWeight: 500, fontSize: "0.75rem" }}>
                      {u.status}
                    </span>
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <div style={{ width: 60, height: 6, background: "var(--bg-secondary, #f3f4f6)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${u.trustScore}%`, background: u.trustScore > 60 ? "#16a34a" : u.trustScore > 30 ? "#f59e0b" : "#dc2626", borderRadius: 3 }} />
                      </div>
                      {u.trustScore}
                    </div>
                  </td>
                  <td style={{ padding: "0.5rem", color: "var(--muted, #6b7280)", fontSize: "0.75rem" }}>{u.joinedAt}</td>
                  <td style={{ padding: "0.5rem" }}>
                    <select value={u.status} onChange={(e) => updateStatus(u.id, e.target.value)}
                      style={{ padding: "0.2rem 0.35rem", borderRadius: 4, fontSize: "0.75rem" }}>
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
