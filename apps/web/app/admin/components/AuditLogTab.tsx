"use client";

import { useState } from "react";

type AuditActionType =
  | "USER_SUSPENDED"
  | "USER_REINSTATED"
  | "USER_BANNED"
  | "JOB_APPROVED"
  | "JOB_REJECTED"
  | "JOB_ESCALATED"
  | "DISPUTE_RESOLVED"
  | "CONFIG_UPDATED";

interface AuditLog {
  id: string;
  action: AuditActionType;
  performedBy: string;
  targetId: string;
  details: string;
  createdAt: string;
}

const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: "log-1",
    action: "USER_SUSPENDED",
    performedBy: "Admin Alice",
    targetId: "usr-123",
    details: "Status changed from ACTIVE to SUSPENDED",
    createdAt: "2024-06-05T14:30:00Z"
  },
  {
    id: "log-2",
    action: "JOB_APPROVED",
    performedBy: "Admin Bob",
    targetId: "job-456",
    details: 'Job "Build an AI customer support widget" was approved',
    createdAt: "2024-06-05T13:15:00Z"
  },
  {
    id: "log-3",
    action: "DISPUTE_RESOLVED",
    performedBy: "Admin Alice",
    targetId: "disp-789",
    details: "Ruling: Payment released to freelancer after review",
    createdAt: "2024-06-05T11:45:00Z"
  },
  {
    id: "log-4",
    action: "CONFIG_UPDATED",
    performedBy: "Admin Carol",
    targetId: "config-1",
    details: '{"registrationEnabled":false}',
    createdAt: "2024-06-04T16:20:00Z"
  },
  {
    id: "log-5",
    action: "USER_BANNED",
    performedBy: "Admin Bob",
    targetId: "usr-999",
    details: "Status changed from SUSPENDED to BANNED",
    createdAt: "2024-06-04T10:00:00Z"
  },
  {
    id: "log-6",
    action: "JOB_REJECTED",
    performedBy: "Admin Alice",
    targetId: "job-321",
    details: 'Job "Write fake reviews" was rejected',
    createdAt: "2024-06-03T15:30:00Z"
  }
];

export function AuditLogTab() {
  const [logs] = useState(MOCK_AUDIT_LOGS);
  const [actionFilter, setActionFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filtered = logs.filter((log) => {
    const matchesAction = !actionFilter || log.action === actionFilter;
    const logDate = new Date(log.createdAt);
    const matchesStart = !startDate || logDate >= new Date(startDate);
    const matchesEnd = !endDate || logDate <= new Date(endDate);
    return matchesAction && matchesStart && matchesEnd;
  });

  const actionColors: Record<AuditActionType, string> = {
    USER_SUSPENDED: "#fff3cd",
    USER_REINSTATED: "#d4edda",
    USER_BANNED: "#f8d7da",
    JOB_APPROVED: "#d4edda",
    JOB_REJECTED: "#f8d7da",
    JOB_ESCALATED: "#fff3cd",
    DISPUTE_RESOLVED: "#cce5ff",
    CONFIG_UPDATED: "#e2e3e5"
  };

  return (
    <div>
      <h3 style={{ marginBottom: 12 }}>Audit Trail</h3>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 4 }}
          aria-label="Filter by action"
        >
          <option value="">All Actions</option>
          <option value="USER_SUSPENDED">User Suspended</option>
          <option value="USER_REINSTATED">User Reinstated</option>
          <option value="USER_BANNED">User Banned</option>
          <option value="JOB_APPROVED">Job Approved</option>
          <option value="JOB_REJECTED">Job Rejected</option>
          <option value="JOB_ESCALATED">Job Escalated</option>
          <option value="DISPUTE_RESOLVED">Dispute Resolved</option>
          <option value="CONFIG_UPDATED">Config Updated</option>
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 4 }}
          aria-label="Start date"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 4 }}
          aria-label="End date"
        />

        {(actionFilter || startDate || endDate) && (
          <button
            onClick={() => {
              setActionFilter("");
              setStartDate("");
              setEndDate("");
            }}
            style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 4, cursor: "pointer" }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Logs Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }} aria-label="Audit logs table">
          <thead>
            <tr style={{ borderBottom: "2px solid #eee", textAlign: "left", background: "#f9f9f9" }}>
              <th style={{ padding: 12 }}>Timestamp</th>
              <th style={{ padding: 12 }}>Action</th>
              <th style={{ padding: 12 }}>Performed By</th>
              <th style={{ padding: 12 }}>Target ID</th>
              <th style={{ padding: 12 }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => (
              <tr key={log.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 12, fontSize: 13, color: "#666" }}>
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td style={{ padding: 12 }}>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: 4,
                      fontSize: 12,
                      background: actionColors[log.action],
                      whiteSpace: "nowrap"
                    }}
                  >
                    {log.action.replace(/_/g, " ")}
                  </span>
                </td>
                <td style={{ padding: 12, fontSize: 14 }}>{log.performedBy}</td>
                <td style={{ padding: 12, fontSize: 13, fontFamily: "monospace", color: "#555" }}>
                  {log.targetId}
                </td>
                <td style={{ padding: 12, fontSize: 13, color: "#555" }}>{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p style={{ textAlign: "center", padding: 24, color: "#666" }}>No audit logs found.</p>
      )}

      <p style={{ marginTop: 16, fontSize: 13, color: "#999" }}>
        Showing {filtered.length} of {logs.length} total logs
      </p>
    </div>
  );
}
