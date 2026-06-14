"use client";

import { useState, useEffect, useCallback } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  joinDate: string;
  trustScore: number;
  activeJobs: number;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const updateStatus = async (userId: number, status: string) => {
    await fetch(`/api/admin/users/${userId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchUsers();
  };

  if (loading) return <div role="status">Loading users...</div>;
  if (error) return <div role="alert" style={{ color: "red" }}>{error}</div>;

  return (
    <div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ padding: "0.4rem 0.75rem", borderRadius: 4, border: "1px solid #4b5563", background: "#1f2937", color: "#fff", flex: 1, minWidth: 200 }}
          aria-label="Search users"
        />
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} style={{ padding: "0.4rem", borderRadius: 4, border: "1px solid #4b5563", background: "#1f2937", color: "#fff" }} aria-label="Filter by role">
          <option value="">All Roles</option>
          <option value="freelancer">Freelancer</option>
          <option value="client">Client</option>
          <option value="admin">Admin</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={{ padding: "0.4rem", borderRadius: 4, border: "1px solid #4b5563", background: "#1f2937", color: "#fff" }} aria-label="Filter by status">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }} role="table" aria-label="User list">
          <thead>
            <tr style={{ borderBottom: "2px solid #374151", textAlign: "left" }}>
              <th style={{ padding: "0.5rem" }}>Name</th>
              <th style={{ padding: "0.5rem" }}>Email</th>
              <th style={{ padding: "0.5rem" }}>Role</th>
              <th style={{ padding: "0.5rem" }}>Status</th>
              <th style={{ padding: "0.5rem" }}>Trust</th>
              <th style={{ padding: "0.5rem" }}>Joined</th>
              <th style={{ padding: "0.5rem" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>No users found</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #1f2937" }}>
                  <td style={{ padding: "0.5rem" }}>{u.name}</td>
                  <td style={{ padding: "0.5rem", color: "#9ca3af" }}>{u.email}</td>
                  <td style={{ padding: "0.5rem" }}><Badge>{u.role}</Badge></td>
                  <td style={{ padding: "0.5rem" }}><StatusBadge status={u.status} /></td>
                  <td style={{ padding: "0.5rem" }}>{u.trustScore}</td>
                  <td style={{ padding: "0.5rem", color: "#9ca3af" }}>{u.joinDate}</td>
                  <td style={{ padding: "0.5rem", display: "flex", gap: "0.25rem" }}>
                    {u.status !== "active" && <button onClick={() => updateStatus(u.id, "active")} style={btnStyle("#22c55e")} aria-label={`Reinstate ${u.name}`}>Reinstate</button>}
                    {u.status === "active" && <button onClick={() => updateStatus(u.id, "suspended")} style={btnStyle("#eab308")} aria-label={`Suspend ${u.name}`}>Suspend</button>}
                    {u.status !== "banned" && <button onClick={() => updateStatus(u.id, "banned")} style={btnStyle("#ef4444")} aria-label={`Ban ${u.name}`}>Ban</button>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", fontSize: "0.875rem", color: "#9ca3af" }}>
        <span>{total} total users</span>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={pageBtnStyle} aria-label="Previous page">Prev</button>
          <span style={{ padding: "0.25rem 0.5rem" }}>{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={pageBtnStyle} aria-label="Next page">Next</button>
        </div>
      </div>
    </div>
  );
}

function Badge({ children }: { children: string }) {
  return <span style={{ padding: "0.1rem 0.4rem", borderRadius: 4, background: "#374151", fontSize: "0.75rem" }}>{children}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = { active: "#22c55e", suspended: "#eab308", banned: "#ef4444" };
  return <span style={{ padding: "0.1rem 0.4rem", borderRadius: 4, background: colors[status] || "#6b7280", color: "#000", fontSize: "0.75rem", fontWeight: 600 }}>{status}</span>;
}

const btnStyle = (color: string) => ({
  padding: "0.2rem 0.5rem",
  fontSize: "0.75rem",
  border: "none",
  borderRadius: 4,
  background: color,
  color: "#000",
  cursor: "pointer",
  fontWeight: 600,
} as const);

const pageBtnStyle = {
  padding: "0.25rem 0.75rem",
  border: "1px solid #4b5563",
  borderRadius: 4,
  background: "#1f2937",
  color: "#fff",
  cursor: "pointer",
  fontSize: "0.875rem",
} as const;
