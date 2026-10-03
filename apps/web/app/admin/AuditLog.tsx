"use client";

import { useEffect, useState, useCallback } from "react";
import { apiGet } from "../../lib/api";

interface AuditLogEntry {
  id: string;
  action: string;
  targetId: string | null;
  details: string | null;
  createdAt: string;
  admin: { fullName: string; email: string };
}

interface AuditLogResponse {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function AuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: String(page),
        limit: "50",
        ...(actionFilter && { action: actionFilter }),
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
      });
      const data = await apiGet<AuditLogResponse>(`/admin/audit-logs?${params}`);
      setLogs(data.logs);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, fromDate, toDate]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  if (loading && logs.length === 0) {
    return <div style={{ padding: 16 }}>Loading audit logs...</div>;
  }

  return (
    <div>
      <h3>Audit Log</h3>
      <p style={{ color: "#888", marginBottom: 16 }}>Track all admin actions for accountability.</p>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          style={{ padding: "0.5rem", borderRadius: 4, border: "1px solid #444", background: "#1a1a1a", color: "#fff" }}
        >
          <option value="">All Actions</option>
          <option value="USER_SUSPEND">User Suspend</option>
          <option value="USER_REINSTATE">User Reinstate</option>
          <option value="USER_BAN">User Ban</option>
          <option value="JOB_APPROVE">Job Approve</option>
          <option value="JOB_REJECT">Job Reject</option>
          <option value="JOB_ESCALATE">Job Escalate</option>
          <option value="DISPUTE_RULING">Dispute Ruling</option>
          <option value="TOGGLE_REGISTRATION">Toggle Registration</option>
          <option value="TOGGLE_JOB_POSTING">Toggle Job Posting</option>
        </select>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
          style={{ padding: "0.5rem", borderRadius: 4, border: "1px solid #444", background: "#1a1a1a", color: "#fff" }}
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => { setToDate(e.target.value); setPage(1); }}
          style={{ padding: "0.5rem", borderRadius: 4, border: "1px solid #444", background: "#1a1a1a", color: "#fff" }}
        />
        <button onClick={loadLogs} style={{ padding: "0.5rem 1rem" }}>Refresh</button>
      </div>

      {error && <p className="error" style={{ marginBottom: 12 }}>{error}</p>}

      {logs.length === 0 ? (
        <p>No audit logs found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #333" }}>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Time</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Admin</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Action</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Target</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid #222" }}>
                  <td style={{ padding: "0.5rem", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: "0.5rem", fontSize: "0.85rem" }}>{log.admin.fullName}</td>
                  <td style={{ padding: "0.5rem" }}>
                    <span style={{
                      padding: "0.2rem 0.5rem",
                      borderRadius: 4,
                      fontSize: "0.75rem",
                      background: "#333",
                      fontFamily: "monospace",
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: "0.5rem", fontSize: "0.85rem", fontFamily: "monospace" }}>
                    {log.targetId || "—"}
                  </td>
                  <td style={{ padding: "0.5rem", fontSize: "0.85rem" }}>{log.details || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center" }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: "0.4rem 0.8rem" }}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: "0.4rem 0.8rem" }}>Next</button>
        </div>
      )}
    </div>
  );
}
