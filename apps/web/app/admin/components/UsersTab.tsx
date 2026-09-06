"use client";

import { useState } from "react";

type UserStatus = "ACTIVE" | "SUSPENDED" | "BANNED";

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: UserStatus;
  trustScore: number;
  createdAt: string;
}

const MOCK_USERS: MockUser[] = [
  { id: "u1", name: "Alice Johnson", email: "alice@example.com", role: "FREELANCER", status: "ACTIVE", trustScore: 92, createdAt: "2024-01-10" },
  { id: "u2", name: "Bob Smith", email: "bob@example.com", role: "CLIENT", status: "ACTIVE", trustScore: 78, createdAt: "2024-02-15" },
  { id: "u3", name: "Charlie Doe", email: "charlie@example.com", role: "FREELANCER", status: "SUSPENDED", trustScore: 35, createdAt: "2024-03-22" },
  { id: "u4", name: "Dana Lee", email: "dana@example.com", role: "CLIENT", status: "BANNED", trustScore: 12, createdAt: "2024-04-01" },
  { id: "u5", name: "Eve Park", email: "eve@example.com", role: "FREELANCER", status: "ACTIVE", trustScore: 88, createdAt: "2024-05-05" }
];

export function UsersTab() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    const matchesSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    const matchesStatus = !statusFilter || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  function changeStatus(id: string, newStatus: UserStatus) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u)));
  }

  return (
    <div>
      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: "8px 12px", border: "1px solid #ddd", borderRadius: 4 }}
          aria-label="Search users"
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} aria-label="Filter by role">
          <option value="">All Roles</option>
          <option value="FREELANCER">Freelancer</option>
          <option value="CLIENT">Client</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="BANNED">Banned</option>
        </select>
      </div>

      {/* Table */}
      <table style={{ width: "100%", borderCollapse: "collapse" }} aria-label="Users table">
        <thead>
          <tr style={{ borderBottom: "2px solid #eee", textAlign: "left" }}>
            <th style={{ padding: 8 }}>Name</th>
            <th style={{ padding: 8 }}>Email</th>
            <th style={{ padding: 8 }}>Role</th>
            <th style={{ padding: 8 }}>Status</th>
            <th style={{ padding: 8 }}>Trust</th>
            <th style={{ padding: 8 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((u) => (
            <>
              <tr key={u.id} style={{ borderBottom: "1px solid #eee", cursor: "pointer" }} onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}>
                <td style={{ padding: 8 }}>{u.name}</td>
                <td style={{ padding: 8 }}>{u.email}</td>
                <td style={{ padding: 8 }}>{u.role}</td>
                <td style={{ padding: 8 }}>
                  <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 12, background: u.status === "ACTIVE" ? "#d4edda" : u.status === "SUSPENDED" ? "#fff3cd" : "#f8d7da" }}>
                    {u.status}
                  </span>
                </td>
                <td style={{ padding: 8 }}>{u.trustScore}</td>
                <td style={{ padding: 8 }}>
                  {u.status !== "SUSPENDED" && (
                    <button onClick={(e) => { e.stopPropagation(); changeStatus(u.id, "SUSPENDED"); }} style={{ marginRight: 4, fontSize: 12 }}>
                      Suspend
                    </button>
                  )}
                  {u.status === "SUSPENDED" && (
                    <button onClick={(e) => { e.stopPropagation(); changeStatus(u.id, "ACTIVE"); }} style={{ marginRight: 4, fontSize: 12 }}>
                      Reinstate
                    </button>
                  )}
                  {u.status !== "BANNED" && (
                    <button onClick={(e) => { e.stopPropagation(); changeStatus(u.id, "BANNED"); }} style={{ fontSize: 12, color: "red" }}>
                      Ban
                    </button>
                  )}
                </td>
              </tr>
              {expandedId === u.id && (
                <tr key={`${u.id}-detail`}>
                  <td colSpan={6} style={{ padding: 16, background: "#f9f9f9" }}>
                    <strong>User Detail</strong>
                    <p>Joined: {u.createdAt}</p>
                    <p>Trust Score: {u.trustScore}/100</p>
                    <p>Recent jobs: (mock) 3 completed, 1 in progress</p>
                    <p>Disputes: (mock) 0 open</p>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <p style={{ textAlign: "center", padding: 24, color: "#666" }}>No users found.</p>}
    </div>
  );
}
