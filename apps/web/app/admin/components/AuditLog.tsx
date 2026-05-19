"use client";

import { useState, useEffect, useCallback } from "react";

interface AuditEntry { id: number; adminId: number; action: string; details: string; timestamp: string; }

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (actionFilter) params.set("action", actionFilter);
      const res = await fetch(`/api/admin/audit-log?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setEntries(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [page, actionFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <div role="status">Loading audit log...</div>;
  if (error) return <div role="alert" style={{ color: "red" }}>{error}</div>;

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }} style={{ padding: "0.4rem", borderRadius: 4, border: "1px solid #4b5563", background: "#1f2937", color: "#fff" }} aria-label="Filter by action type">
          <option value="">All Actions</option>
          <option value="user_suspended">User Suspended</option>
          <option value="user_banned">User Banned</option>
          <option value="user_active">User Reinstate</option>
          <option value="job_approved">Job Approved</option>
          <option value="job_rejected">Job Rejected</option>
          <option value="dispute_resolved">Dispute Resolved</option>
          <option value="toggle_registrations">Toggle Registrations</option>
          <option value="toggle_job_postings">Toggle Postings</option>
        </select>
      </div>

      {entries.length === 0 ? (
        <p style={{ color: "#9ca3af" }}>No audit entries yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }} role="table" aria-label="Audit log">
            <thead>
              <tr style={{ borderBottom: "2px solid #374151", textAlign: "left" }}>
                <th style={{ padding: "0.5rem" }}>Time</th>
                <th style={{ padding: "0.5rem" }}>Admin</th>
                <th style={{ padding: "0.5rem" }}>Action</th>
                <th style={{ padding: "0.5rem" }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id} style={{ borderBottom: "1px solid #1f2937" }}>
                  <td style={{ padding: "0.5rem", whiteSpace: "nowrap", color: "#9ca3af" }}>{new Date(e.timestamp).toLocaleString()}</td>
                  <td style={{ padding: "0.5rem" }}>#{e.adminId}</td>
                  <td style={{ padding: "0.5rem" }}><Badge>{e.action}</Badge></td>
                  <td style={{ padding: "0.5rem", color: "#9ca3af" }}>{e.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", fontSize: "0.875rem", color: "#9ca3af" }}>
        <span>{total} total entries</span>
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

const pageBtnStyle = { padding: "0.25rem 0.75rem", border: "1px solid #4b5563", borderRadius: 4, background: "#1f2937", color: "#fff", cursor: "pointer", fontSize: "0.875rem" } as const;
