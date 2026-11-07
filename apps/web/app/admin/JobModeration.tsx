"use client";

import { useEffect, useState, useCallback } from "react";
import { apiGet, apiPost } from "../../lib/api";

interface FlaggedJob {
  id: string;
  title: string;
  status: string;
  isFlagged: boolean;
  moderationStatus: string;
  client: { fullName: string; email: string };
  createdAt: string;
}

interface FlaggedJobsResponse {
  jobs: FlaggedJob[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function JobModeration() {
  const [jobs, setJobs] = useState<FlaggedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionReason, setActionReason] = useState("");
  const [activeJob, setActiveJob] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      const data = await apiGet<FlaggedJobsResponse>(`/admin/jobs/flagged?${params}`);
      setJobs(data.jobs);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleModerate = async (jobId: string, action: string) => {
    try {
      await apiPost(`/admin/jobs/${jobId}/moderate`, { action, reason: actionReason });
      setActiveJob(null);
      setActionReason("");
      loadJobs();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading && jobs.length === 0) {
    return <div style={{ padding: 16 }}>Loading flagged jobs...</div>;
  }

  return (
    <div>
      <h3>Job Moderation</h3>
      <p style={{ color: "#888", marginBottom: 16 }}>Review and moderate flagged job listings.</p>

      <button onClick={loadJobs} style={{ marginBottom: 16, padding: "0.5rem 1rem" }}>
        Refresh
      </button>

      {error && <p className="error" style={{ marginBottom: 12 }}>{error}</p>}

      {jobs.length === 0 ? (
        <p>No flagged jobs at this time.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #333" }}>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Title</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Client</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Status</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Created</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} style={{ borderBottom: "1px solid #222" }}>
                  <td style={{ padding: "0.5rem" }}>{job.title}</td>
                  <td style={{ padding: "0.5rem", fontSize: "0.85rem" }}>{job.client.fullName}</td>
                  <td style={{ padding: "0.5rem" }}>
                    <span style={{
                      padding: "0.2rem 0.5rem",
                      borderRadius: 4,
                      fontSize: "0.8rem",
                      background: job.moderationStatus === "ESCALATED" ? "#d94a4a" : "#d9a020",
                    }}>
                      {job.moderationStatus}
                    </span>
                  </td>
                  <td style={{ padding: "0.5rem", fontSize: "0.85rem" }}>{new Date(job.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: "0.5rem" }}>
                    {activeJob === job.id ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <input
                          type="text"
                          placeholder="Reason (optional)"
                          value={actionReason}
                          onChange={(e) => setActionReason(e.target.value)}
                          style={{ padding: "0.3rem", fontSize: "0.8rem", borderRadius: 4, border: "1px solid #444", background: "#1a1a1a", color: "#fff" }}
                        />
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={() => handleModerate(job.id, "approve")} style={{ fontSize: "0.8rem", padding: "0.2rem 0.5rem", background: "#2a7a2a", border: "none", borderRadius: 4, cursor: "pointer", color: "#fff" }}>
                            Approve
                          </button>
                          <button onClick={() => handleModerate(job.id, "reject")} style={{ fontSize: "0.8rem", padding: "0.2rem 0.5rem", background: "#d94a4a", border: "none", borderRadius: 4, cursor: "pointer", color: "#fff" }}>
                            Reject
                          </button>
                          <button onClick={() => handleModerate(job.id, "escalate")} style={{ fontSize: "0.8rem", padding: "0.2rem 0.5rem", background: "#d9a020", border: "none", borderRadius: 4, cursor: "pointer" }}>
                            Escalate
                          </button>
                          <button onClick={() => { setActiveJob(null); setActionReason(""); }} style={{ fontSize: "0.8rem", padding: "0.2rem 0.5rem", background: "#666", border: "none", borderRadius: 4, cursor: "pointer", color: "#fff" }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setActiveJob(job.id)} style={{ fontSize: "0.8rem", padding: "0.2rem 0.5rem", background: "#4a90d9", border: "none", borderRadius: 4, cursor: "pointer", color: "#fff" }}>
                        Review
                      </button>
                    )}
                  </td>
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
