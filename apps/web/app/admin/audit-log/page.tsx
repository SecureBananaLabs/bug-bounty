"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, AuditLog } from "../../../lib/adminApi";
import { isAdmin } from "../../../lib/adminAuth";

function actionBadge(action: string) {
  const map: Record<string, { color: string; bg: string }> = {
    BAN_USER: { color: "#f87171", bg: "rgba(248,113,113,0.15)" },
    SUSPEND_USER: { color: "#fb923c", bg: "rgba(251,146,60,0.15)" },
    REINSTATE_USER: { color: "#34d399", bg: "rgba(52,211,153,0.15)" },
    APPROVE_JOB: { color: "#34d399", bg: "rgba(52,211,153,0.15)" },
    REJECT_JOB: { color: "#f87171", bg: "rgba(248,113,113,0.15)" },
    ESCALATE_JOB: { color: "#fb923c", bg: "rgba(251,146,60,0.15)" },
    RULE_FREELANCER: { color: "#818cf8", bg: "rgba(129,140,248,0.15)" },
    RULE_CLIENT: { color: "#818cf8", bg: "rgba(129,140,248,0.15)" },
    TRIGGER_REFUND: { color: "#fbbf24", bg: "rgba(251,191,36,0.15)" },
    TOGGLE_REGISTRATION: { color: "#fbbf24", bg: "rgba(251,191,36,0.15)" },
    TOGGLE_JOB_POSTING: { color: "#fbbf24", bg: "rgba(251,191,36,0.15)" },
  };
  const s = map[action] || { color: "#94a3b8", bg: "rgba(148,163,184,0.15)" };
  return (
    <span style={{ color: s.color, background: s.bg, padding: "2px 8px", borderRadius: 12, fontSize: "0.75rem" }}>
      {action.replace(/_/g, " ")}
    </span>
  );
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = (p = 1) => {
    setLoading(true);
    adminApi
      .getAuditLogs({ page: p, action: actionFilter || undefined, startDate: startDate || undefined, endDate: endDate || undefined })
      .then((res) => { setLogs(res.data); setTotal(res.total); setPage(p); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (isAdmin()) load(); }, []);

  const handleFilter = (e: React.FormEvent) => { e.preventDefault(); load(1); };
  const totalPages = Math.ceil(total / 20);

  if (!isAdmin()) {
    return (
      <section className="card">
        <h2>Audit Log</h2>
        <p style={{ color: "#f87171" }}>Access denied.</p>
        <Link href="/admin" className="card" style={{ display: "inline-block", marginTop: "0.5rem" }}>&larr; Back</Link>
      </section>
    );
  }

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2>Audit Log</h2>
        <Link href="/admin" className="card" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>&larr; Back</Link>
      </div>

      <form onSubmit={handleFilter} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="card"
          style={{ padding: "0.5rem", background: "#0f172a", border: "1px solid #2a3765", color: "#f2f5ff", minWidth: 180 }}
        >
          <option value="">All Actions</option>
          {[
            "BAN_USER", "SUSPEND_USER", "REINSTATE_USER",
            "APPROVE_JOB", "REJECT_JOB", "ESCALATE_JOB",
            "RULE_FREELANCER", "RULE_CLIENT", "TRIGGER_REFUND",
            "TOGGLE_REGISTRATION", "TOGGLE_JOB_POSTING",
          ].map((a) => (
            <option key={a} value={a}>{a.replace(/_/g, " ")}</option>
          ))}
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="card"
          style={{ padding: "0.5rem", background: "#0f172a", border: "1px solid #2a3765", color: "#f2f5ff" }}
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="card"
          style={{ padding: "0.5rem", background: "#0f172a", border: "1px solid #2a3765", color: "#f2f5ff" }}
        />
        <button type="submit" className="card action-btn">Filter</button>
        <button type="button" onClick={() => { setActionFilter(""); setStartDate(""); setEndDate(""); load(1); }} className="card action-btn">Clear</button>
      </form>

      {loading ? (
        <p style={{ color: "#94a3b8" }}>Loading…</p>
      ) : error ? (
        <p style={{ color: "#f87171" }}>{error}</p>
      ) : (
        <>
          <p style={{ color: "#94a3b8", marginBottom: "0.75rem" }}>{total} log entr{total !== 1 ? "ies" : "y"}</p>
          {logs.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>No audit logs found.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {logs.map((log) => (
                <div key={log.id} className="card" style={{ display: "flex", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ minWidth: 180 }}>
                    <p style={{ margin: 0, fontWeight: 500 }}>{actionBadge(log.action)}</p>
                    <p style={{ color: "#94a3b8", margin: "0.2rem 0 0", fontSize: "0.8rem" }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: "0.85rem" }}>
                      <span style={{ color: "#94a3b8" }}>Admin:</span> {log.admin.fullName}
                      &nbsp;({log.admin.email})
                    </p>
                    <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem" }}>
                      <span style={{ color: "#94a3b8" }}>Target:</span> [{log.targetType}] {log.targetId}
                      {log.details && <span style={{ color: "#94a3b8" }}> — {log.details}</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", alignItems: "center" }}>
              <button onClick={() => load(page - 1)} disabled={page <= 1} className="card action-btn">Prev</button>
              <span style={{ color: "#94a3b8" }}>Page {page} / {totalPages}</span>
              <button onClick={() => load(page + 1)} disabled={page >= totalPages} className="card action-btn">Next</button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
