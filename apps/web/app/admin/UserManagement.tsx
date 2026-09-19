"use client";

import { useEffect, useState, useCallback } from "react";
import { apiGet, apiPatch } from "../../lib/api";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  isVerified: boolean;
  createdAt: string;
}

interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UserDetail extends User {
  postedJobs: { id: string; title: string; status: string }[];
  disputes: { id: string; reason: string; status: string }[];
  reviewsGot: { id: string; rating: number; comment: string }[];
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(search && { search }),
      });
      const data = await apiGet<UserListResponse>(`/admin/users?${params}`);
      setUsers(data.users);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, statusFilter, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const loadUserDetail = async (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
      setUserDetail(null);
      return;
    }
    setExpandedUser(userId);
    setDetailLoading(true);
    try {
      const data = await apiGet<UserDetail>(`/admin/users/${userId}`);
      setUserDetail(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      await apiPatch(`/admin/users/${userId}/status`, { status: newStatus });
      loadUsers();
      if (userDetail?.id === userId) {
        setUserDetail({ ...userDetail, status: newStatus });
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading && users.length === 0) {
    return <div style={{ padding: 16 }}>Loading users...</div>;
  }

  return (
    <div>
      <h3>User Management</h3>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ padding: "0.5rem", borderRadius: 4, border: "1px solid #444", background: "#1a1a1a", color: "#fff", minWidth: 200 }}
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          style={{ padding: "0.5rem", borderRadius: 4, border: "1px solid #444", background: "#1a1a1a", color: "#fff" }}
        >
          <option value="">All Roles</option>
          <option value="CLIENT">Client</option>
          <option value="FREELANCER">Freelancer</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ padding: "0.5rem", borderRadius: 4, border: "1px solid #444", background: "#1a1a1a", color: "#fff" }}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="BANNED">Banned</option>
        </select>
        <button onClick={loadUsers} style={{ padding: "0.5rem 1rem" }}>
          Refresh
        </button>
      </div>

      {error && <p className="error" style={{ marginBottom: 12 }}>{error}</p>}

      {/* Table */}
      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #333" }}>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Name</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Email</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Role</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Status</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Verified</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <>
                  <tr key={user.id} style={{ borderBottom: "1px solid #222" }}>
                    <td style={{ padding: "0.5rem" }}>
                      <button
                        onClick={() => loadUserDetail(user.id)}
                        style={{ background: "none", border: "none", color: "#4a90d9", cursor: "pointer", textDecoration: "underline", padding: 0 }}
                      >
                        {user.fullName}
                      </button>
                    </td>
                    <td style={{ padding: "0.5rem", fontSize: "0.85rem" }}>{user.email}</td>
                    <td style={{ padding: "0.5rem" }}>
                      <span style={{
                        padding: "0.2rem 0.5rem",
                        borderRadius: 4,
                        fontSize: "0.8rem",
                        background: user.role === "ADMIN" ? "#d94a4a" : user.role === "FREELANCER" ? "#4a90d9" : "#666",
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: "0.5rem" }}>
                      <span style={{
                        padding: "0.2rem 0.5rem",
                        borderRadius: 4,
                        fontSize: "0.8rem",
                        background: user.status === "ACTIVE" ? "#2a7a2a" : user.status === "SUSPENDED" ? "#d9a020" : "#d94a4a",
                      }}>
                        {user.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.5rem" }}>{user.isVerified ? "✅" : "❌"}</td>
                    <td style={{ padding: "0.5rem", display: "flex", gap: 4 }}>
                      {user.status !== "SUSPENDED" && (
                        <button onClick={() => handleStatusChange(user.id, "SUSPENDED")} style={{ fontSize: "0.8rem", padding: "0.2rem 0.5rem", background: "#d9a020", border: "none", borderRadius: 4, cursor: "pointer" }}>
                          Suspend
                        </button>
                      )}
                      {user.status !== "ACTIVE" && (
                        <button onClick={() => handleStatusChange(user.id, "ACTIVE")} style={{ fontSize: "0.8rem", padding: "0.2rem 0.5rem", background: "#2a7a2a", border: "none", borderRadius: 4, cursor: "pointer", color: "#fff" }}>
                          Reinstate
                        </button>
                      )}
                      {user.status !== "BANNED" && (
                        <button onClick={() => handleStatusChange(user.id, "BANNED")} style={{ fontSize: "0.8rem", padding: "0.2rem 0.5rem", background: "#d94a4a", border: "none", borderRadius: 4, cursor: "pointer", color: "#fff" }}>
                          Ban
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedUser === user.id && (
                    <tr key={`${user.id}-detail`}>
                      <td colSpan={6} style={{ padding: "1rem", background: "#1a1a1a" }}>
                        {detailLoading ? (
                          <p>Loading details...</p>
                        ) : userDetail ? (
                          <div>
                            <h4>User Details: {userDetail.fullName}</h4>
                            <p><strong>ID:</strong> {userDetail.id}</p>
                            <p><strong>Email:</strong> {userDetail.email}</p>
                            <p><strong>Joined:</strong> {new Date(userDetail.createdAt).toLocaleDateString()}</p>
                            {userDetail.postedJobs.length > 0 && (
                              <div style={{ marginTop: 8 }}>
                                <strong>Jobs Posted ({userDetail.postedJobs.length}):</strong>
                                <ul>{userDetail.postedJobs.map(j => <li key={j.id}>{j.title} ({j.status})</li>)}</ul>
                              </div>
                            )}
                            {userDetail.disputes.length > 0 && (
                              <div style={{ marginTop: 8 }}>
                                <strong>Disputes ({userDetail.disputes.length}):</strong>
                                <ul>{userDetail.disputes.map(d => <li key={d.id}>{d.reason} ({d.status})</li>)}</ul>
                              </div>
                            )}
                            {userDetail.reviewsGot.length > 0 && (
                              <div style={{ marginTop: 8 }}>
                                <strong>Recent Reviews:</strong>
                                <ul>{userDetail.reviewsGot.map(r => <li key={r.id}>{"⭐".repeat(r.rating)} {r.comment}</li>)}</ul>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center" }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: "0.4rem 0.8rem" }}>
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: "0.4rem 0.8rem" }}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
