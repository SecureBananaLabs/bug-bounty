"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, FlaggedJob } from "../../../lib/adminApi";
import { isAdmin } from "../../../lib/adminAuth";

function reasonBadge(reason: string | null) {
  if (!reason) return null;
  return (
    <span style={{ color: "#f87171", background: "rgba(248,113,113,0.15)", padding: "2px 8px", borderRadius: 12, fontSize: "0.75rem" }}>
      {reason}
    </span>
  );
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<FlaggedJob[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ jobId: string; reason: string } | null>(null);

  const load = (p = 1) => {
    setLoading(true);
    adminApi
      .getFlaggedJobs({ page: p })
      .then((res) => { setJobs(res.data); setTotal(res.total); setPage(p); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (isAdmin()) load(); }, []);

  const totalPages = Math.ceil(total / 20);

  const handleAction = async (jobId: string, action: string, reason?: string) => {
    setActionLoading(jobId);
    try {
      await adminApi.updateJobFlag(jobId, action, reason);
      setRejectModal(null);
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
        <h2>Job Moderation</h2>
        <p style={{ color: "#f87171" }}>Access denied.</p>
        <Link href="/admin" className="card" style={{ display: "inline-block", marginTop: "0.5rem" }}>&larr; Back</Link>
      </section>
    );
  }

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2>Job Moderation</h2>
        <Link href="/admin" className="card" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>&larr; Back</Link>
      </div>

      {loading ? (
        <p style={{ color: "#94a3b8" }}>Loading…</p>
      ) : error ? (
        <p style={{ color: "#f87171" }}>{error}</p>
      ) : (
        <>
          <p style={{ color: "#94a3b8", marginBottom: "0.75rem" }}>
            {total} flagged listing{total !== 1 ? "s" : ""}
          </p>
          {jobs.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
              No flagged listings — all clear!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {jobs.map((job) => (
                <div key={job.id} className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{job.title}</h3>
                      <p style={{ color: "#94a3b8", margin: "0.25rem 0", fontSize: "0.85rem" }}>
                        By {job.client.fullName} ({job.client.email}) &nbsp;|&nbsp; Status: {job.status}
                      </p>
                      <p style={{ color: "#94a3b8", margin: "0.25rem 0", fontSize: "0.85rem" }}>
                        Posted: {new Date(job.createdAt).toLocaleDateString()} &nbsp;|&nbsp;
                        Proposals: {job._count?.proposals ?? 0}
                      </p>
                      {reasonBadge(job.flagReason)}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                      <button
                        onClick={() => handleAction(job.id, "approve")}
                        disabled={actionLoading === job.id}
                        className="card action-btn"
                        style={{ borderColor: "#34d399", color: "#34d399" }}
                      >Approve</button>
                      <button
                        onClick={() => setRejectModal({ jobId: job.id, reason: "" })}
                        disabled={actionLoading === job.id}
                        className="card action-btn"
                        style={{ borderColor: "#f87171", color: "#f87171" }}
                      >Reject</button>
                      <button
                        onClick={() => handleAction(job.id, "escalate")}
                        disabled={actionLoading === job.id}
                        className="card action-btn"
                        style={{ borderColor: "#fb923c", color: "#fb923c" }}
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

      {rejectModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setRejectModal(null)}>
          <div className="card" style={{ maxWidth: 420, width: "90%" }} onClick={(e) => e.stopPropagation()}>
            <h3>Reject Listing</h3>
            <p style={{ color: "#94a3b8", marginBottom: "0.75rem" }}>Provide a reason that will be sent to the user.</p>
            <textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              placeholder="Reason for rejection…"
              rows={3}
              className="card"
              style={{ width: "100%", resize: "vertical", background: "#0f172a", border: "1px solid #2a3765", color: "#f2f5ff", padding: "0.5rem", marginBottom: "0.75rem" }}
            />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => handleAction(rejectModal.jobId, "reject", rejectModal.reason)}
                disabled={!rejectModal.reason.trim()}
                className="card action-btn"
                style={{ borderColor: "#f87171", color: "#f87171" }}
              >Send Rejection</button>
              <button onClick={() => setRejectModal(null)} className="card action-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
