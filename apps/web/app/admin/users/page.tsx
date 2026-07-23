"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, User } from "../../../lib/adminApi";
import { isAdmin } from "../../../lib/adminAuth";

function statusBadge(status: string) {
  const map: Record<string, { color: string; bg: string }> = {
    ACTIVE: { color: "#34d399", bg: "rgba(52,211,153,0.15)" },
    SUSPENDED: { color: "#fb923c", bg: "rgba(251,146,60,0.15)" },
    BANNED: { color: "#f87171", bg: "rgba(248,113,113,0.15)" },
  };
  const s = map[status] || { color: "#94a3b8", bg: "rgba(148,163,184,0.15)" };
  return (
    <span style={{ color: s.color, background: s.bg, padding: "2px 8px", borderRadius: 12, fontSize: "0.8rem" }}>
      {status}
    </span>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const pageSize = 20;

  const load = (p = 1) => {
    setLoading(true);
    adminApi
      .getUsers({ page: p, search: search || undefined, role: roleFilter || undefined, status: statusFilter || undefined })
      .then((res) => { setUsers(res.data); setTotal(res.total); setPage(p); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (isAdmin()) load(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(1); };
  const totalPages = Math.ceil(total / pageSize);

  const changeStatus = async (userId: string, status: string) => {
    setActionLoading(userId);
    try {
      await adminApi.updateUserStatus(userId, status);
      load(page);
      setSelectedUser(null);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAdmin()) {
    return (
      <section className="card">
        <h2>User Management</h2>
        <p style={{ color: "#f87171" }}>Access denied.</p>
        <Link href="/admin" className="card" style={{ display: "inline-block", marginTop: "0.5rem" }}>Back</Link>
      </section>
    );
  }

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2>User Management</h2>
        <Link href="/admin" className="card" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>&larr; Back</Link>
      </div>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="card"
          style={{ flex: 1, minWidth: 200, padding: "0.5rem", background: "#0f172a", border: "1px solid #2a3765", color: "#f2f5ff" }}
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="card" style={{ padding: "0.5rem", background: "#0f172a", border: "1px solid #2a3765", color: "#f2f5ff" }}>
          <option value="">All Roles</option>
          <option value="CLIENT">Client</option>
          <option value="FREELANCER">Freelancer</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="card" style={{ padding: "0.5rem", background: "#0f172a", border: "1px solid #2a3765", color: "#f2f5ff" }}>
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="BANNED">Banned</option>
        </select>
        <button type="submit" className="card action-btn">Search</button>
      </form>

      {loading ? (
        <p style={{ color: "#94a3b8" }}>Loading…</p>
      ) : error ? (
        <p style={{ color: "#f87171" }}>{error}</p>
      ) : (
        <>
          <p style={{ color: "#94a3b8", marginBottom: "0.75rem" }}>{total} user{total !== 1 ? "s" : ""} found</p>
          <div className="card" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #2a3765", textAlign: "left" }}>
                  {["Name", "Email", "Role", "Status", "Joined", "Jobs", "Proposals", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "0.5rem", color: "#94a3b8", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: "1rem", color: "#94a3b8" }}>No users found.</td></tr>
                ) : users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #1e293b" }}>
                    <td style={{ padding: "0.5rem" }}>{u.fullName}</td>
                    <td style={{ padding: "0.5rem", color: "#94a3b8" }}>{u.email}</td>
                    <td style={{ padding: "0.5rem" }}>{u.role}</td>
                    <td style={{ padding: "0.5rem" }}>{statusBadge(u.status)}</td>
                    <td style={{ padding: "0.5rem", color: "#94a3b8" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: "0.5rem", textAlign: "center" }}>{u._count?.postedJobs ?? 0}</td>
                    <td style={{ padding: "0.5rem", textAlign: "center" }}>{u._count?.proposals ?? 0}</td>
                    <td style={{ padding: "0.5rem" }}>
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="card action-btn"
                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", cursor: "pointer" }}
                      >Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", alignItems: "center" }}>
              <button onClick={() => load(page - 1)} disabled={page <= 1} className="card action-btn">Prev</button>
              <span style={{ color: "#94a3b8" }}>Page {page} / {totalPages}</span>
              <button onClick={() => load(page + 1)} disabled={page >= totalPages} className="card action-btn">Next</button>
            </div>
          )}
        </>
      )}

      {selectedUser && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setSelectedUser(null)}>
          <div className="card" style={{ maxWidth: 400, width: "90%" }} onClick={(e) => e.stopPropagation()}>
            <h3>Manage {selectedUser.fullName}</h3>
            <p style={{ color: "#94a3b8", margin: "0.25rem 0" }}>{selectedUser.email}</p>
            <p style={{ margin: "0.5rem 0 1rem" }}>Current status: {statusBadge(selectedUser.status)}</p>
            <p style={{ color: "#94a3b8", marginBottom: "0.75rem", fontSize: "0.85rem" }}>This action will be logged in the audit trail.</p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button onClick={() => changeStatus(selectedUser.id, "ACTIVE")} disabled={actionLoading === selectedUser.id} className="card action-btn">Reinstate</button>
              <button onClick={() => changeStatus(selectedUser.id, "SUSPENDED")} disabled={actionLoading === selectedUser.id} className="card action-btn" style={{ borderColor: "#fb923c" }}>Suspend</button>
              <button onClick={() => changeStatus(selectedUser.id, "BANNED")} disabled={actionLoading === selectedUser.id} className="card action-btn" style={{ borderColor: "#f87171" }}>Ban</button>
              <button onClick={() => setSelectedUser(null)} className="card action-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
