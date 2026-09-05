"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, Dispute } from "../../../lib/adminApi";
import { isAdmin } from "../../../lib/adminAuth";

function statusBadge(status: string) {
  const map: Record<string, { color: string; bg: string }> = {
    OPEN: { color: "#818cf8", bg: "rgba(129,140,248,0.15)" },
    UNDER_REVIEW: { color: "#fb923c", bg: "rgba(251,146,60,0.15)" },
    RESOLVED: { color: "#34d399", bg: "rgba(52,211,153,0.15)" },
  };
  const s = map[status] || { color: "#94a3b8", bg: "rgba(148,163,184,0.15)" };
  return (
    <span style={{ color: s.color, background: s.bg, padding: "2px 8px", borderRadius: 12, fontSize: "0.8rem" }}>
      {status.replace("_", " ")}
    </span>
  );
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [rulingAction, setRulingAction] = useState<string>("");
  const [rulingReason, setRulingReason] = useState("");

  const load = (p = 1) => {
    setLoading(true);
    adminApi
      .getDisputes({ page: p, status: statusFilter || undefined })
      .then((res) => { setDisputes(res.data); setTotal(res.total); setPage(p); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (isAdmin()) load(); }, [statusFilter]);

  const totalPages = Math.ceil(total / 20);

  const handleRuling = async () => {
    if (!selected || !rulingAction) return;
    setActionLoading(selected.id);
    try {
      await adminApi.resolveDispute(selected.id, rulingAction, rulingReason || undefined, rulingReason || undefined);
      setSelected(null);
      setRulingAction("");
      setRulingReason("");
      load(page);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAdmin()) {
    return (
      <section className="card">
        <h2>Dispute Resolution</h2>
        <p style={{ color: "#f87171" }}>Access denied.</p>
        <Link href="/admin" className="card" style={{ display: "inline-block", marginTop: "0.5rem" }}>&larr; Back</Link>
      </section>
    );
  }

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2>Dispute Resolution</h2>
        <Link href="/admin" className="card" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>&larr; Back</Link>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); load(1); }}
          className="card"
          style={{ padding: "0.5rem", background: "#0f172a", border: "1px solid #2a3765", color: "#f2f5ff" }}
        >
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      {loading ? (
        <p style={{ color: "#94a3b8" }}>Loading…</p>
      ) : error ? (
        <p style={{ color: "#f87171" }}>{error}</p>
      ) : (
        <>
          <p style={{ color: "#94a3b8", marginBottom: "0.75rem" }}>{total} dispute{total !== 1 ? "s" : ""}</p>
          {disputes.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>No disputes found.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {disputes.map((d) => (
                <div key={d.id} className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{d.job.title}</h3>
                      <p style={{ color: "#94a3b8", margin: "0.25rem 0", fontSize: "0.85rem" }}>
                        Budget: ${d.job.budgetMax.toLocaleString()} &nbsp;|&nbsp;
                        ID: {d.id}
                      </p>
                      <p style={{ color: "#94a3b8", margin: "0.25rem 0", fontSize: "0.85rem" }}>
                        Opened: {new Date(d.createdAt).toLocaleDateString()} &nbsp;|&nbsp;
                        Updated: {new Date(d.updatedAt).toLocaleDateString()}
                      </p>
                      <p style={{ color: "#94a3b8", margin: "0.25rem 0", fontSize: "0.85rem" }}>
                        Freelancer: {d.freelancerId.slice(0, 8)}… &nbsp;|&nbsp;
                        Client: {d.clientId.slice(0, 8)}…
                      </p>
                      <p style={{ marginTop: "0.5rem" }}>Status: {statusBadge(d.status)}</p>
                      {d.ruling && (
                        <p style={{ color: "#94a3b8", margin: "0.25rem 0", fontSize: "0.85rem", fontStyle: "italic" }}>
                          Ruling: {d.ruling}
                        </p>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                      <button
                        onClick={() => { setSelected(d); setRulingAction("RULE_FREELANCER"); }}
                        disabled={d.status === "RESOLVED"}
                        className="card action-btn"
                        style={{ borderColor: "#818cf8", color: "#818cf8" }}
                      >Freelancer Wins</button>
                      <button
                        onClick={() => { setSelected(d); setRulingAction("RULE_CLIENT"); }}
                        disabled={d.status === "RESOLVED"}
                        className="card action-btn"
                        style={{ borderColor: "#fb923c", color: "#fb923c" }}
                      >Client Wins</button>
                      <button
                        onClick={() => { setSelected(d); setRulingAction("TRIGGER_REFUND"); }}
                        disabled={d.status === "RESOLVED"}
                        className="card action-btn"
                        style={{ borderColor: "#fbbf24", color: "#fbbf24" }}
                      >Refund</button>
                      <button
                        onClick={() => { setSelected(d); setRulingAction("ESCALATE"); }}
                        disabled={d.status === "RESOLVED"}
                        className="card action-btn"
                        style={{ borderColor: "#94a3b8", color: "#94a3b8" }}
                      >Escalate</button>
                    </div>
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

      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setSelected(null)}>
          <div className="card" style={{ maxWidth: 440, width: "90%" }} onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Ruling</h3>
            <p style={{ color: "#94a3b8", margin: "0.25rem 0" }}>Dispute: {selected.job.title}</p>
            <p style={{ color: "#94a3b8", marginBottom: "0.75rem" }}>Action: {rulingAction.replace("_", " ")}</p>
            <textarea
              value={rulingReason}
              onChange={(e) => setRulingReason(e.target.value)}
              placeholder="Optional reason / notes…"
              rows={3}
              className="card"
              style={{ width: "100%", resize: "vertical", background: "#0f172a", border: "1px solid #2a3765", color: "#f2f5ff", padding: "0.5rem", marginBottom: "0.75rem" }}
            />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={handleRuling} disabled={actionLoading === selected.id} className="card action-btn" style={{ borderColor: "#34d399", color: "#34d399" }}>
                Confirm
              </button>
              <button onClick={() => setSelected(null)} className="card action-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
