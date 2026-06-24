"use client";

import { useEffect, useState } from "react";

interface AuditEntry {
  id: string;
  adminId: string;
  action: string;
  target: string;
  details: string;
  timestamp: string;
}

const ACTION_FILTERS = [
  "user_active", "user_flagged", "user_suspended", "user_unsuspended",
  "role_change", "job_approved", "job_rejected", "job_flagged",
  "dispute_resolve", "flag_clear", "settings_update",
];

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");

  const fetchLog = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (actionFilter) params.set("action", actionFilter);

    fetch(`/api/admin/audit?${params}`, { credentials: "include" })
      .then((r) => r.json())
      .then((res) => { if (res.success) setEntries(res.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLog(); }, [actionFilter]);

  return (
    <section>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Audit Log</h2>

      <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
        style={{ padding: "0.35rem 0.5rem", borderRadius: 4, border: "1px solid var(--border, #d1d5db)", marginBottom: "1rem" }}>
        <option value="">All actions</option>
        {ACTION_FILTERS.map((a) => <option key={a} value={a}>{a}</option>)}
      </select>

      {loading ? (
        <p>Loading…</p>
      ) : entries.length === 0 ? (
        <p style={{ color: "var(--muted, #6b7280)" }}>No audit entries.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid var(--border, #e5e7eb)" }}>
                <th style={{ padding: "0.5rem" }}>Time</th>
                <th style={{ padding: "0.5rem" }}>Admin</th>
                <th style={{ padding: "0.5rem" }}>Action</th>
                <th style={{ padding: "0.5rem" }}>Target</th>
                <th style={{ padding: "0.5rem" }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} style={{ borderBottom: "1px solid var(--border, #e5e7eb)" }}>
                  <td style={{ padding: "0.5rem", fontSize: "0.75rem", color: "var(--muted, #6b7280)", whiteSpace: "nowrap" }}>
                    {new Date(e.timestamp).toLocaleString()}
                  </td>
                  <td style={{ padding: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem" }}>{e.adminId}</td>
                  <td style={{ padding: "0.5rem" }}>
                    <code style={{ background: "var(--bg-code, #f3f4f6)", padding: "0.15rem 0.4rem", borderRadius: 4, fontSize: "0.75rem" }}>
                      {e.action}
                    </code>
                  </td>
                  <td style={{ padding: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem" }}>{e.target}</td>
                  <td style={{ padding: "0.5rem", fontSize: "0.75rem", color: "var(--muted, #6b7280)" }}>{e.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
