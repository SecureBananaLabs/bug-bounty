"use client";

import { useEffect, useState, useCallback } from "react";
import { apiGet, apiPost } from "../../lib/api";

interface Dispute {
  id: string;
  reason: string;
  status: string;
  job: { title: string };
  client: { fullName: string };
  createdAt: string;
}

interface DisputeListResponse {
  disputes: Dispute[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function DisputeResolution() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [resolving, setResolving] = useState<string | null>(null);
  const [ruling, setRuling] = useState("");
  const [resolution, setResolution] = useState("");

  const loadDisputes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(statusFilter && { status: statusFilter }),
      });
      const data = await apiGet<DisputeListResponse>(`/admin/disputes?${params}`);
      setDisputes(data.disputes);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadDisputes();
  }, [loadDisputes]);

  const handleResolve = async (disputeId: string) => {
    if (!ruling.trim()) {
      setError("Ruling is required");
      return;
    }
    try {
      await apiPost(`/admin/disputes/${disputeId}/resolve`, { ruling, resolution });
      setResolving(null);
      setRuling("");
      setResolution("");
      loadDisputes();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading && disputes.length === 0) {
    return <div style={{ padding: 16 }}>Loading disputes...</div>;
  }

  return (
    <div>
      <h3>Dispute Resolution</h3>
      <p style={{ color: "#888", marginBottom: 16 }}>Review and resolve disputes between clients and freelancers.</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ padding: "0.5rem", borderRadius: 4, border: "1px solid #444", background: "#1a1a1a", color: "#fff" }}
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="RESOLVED">Resolved</option>
        </select>
        <button onClick={loadDisputes} style={{ padding: "0.5rem 1rem" }}>Refresh</button>
      </div>

      {error && <p className="error" style={{ marginBottom: 12 }}>{error}</p>}

      {disputes.length === 0 ? (
        <p>No disputes found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #333" }}>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Job</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Client</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Reason</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Status</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map((dispute) => (
                <tr key={dispute.id} style={{ borderBottom: "1px solid #222" }}>
                  <td style={{ padding: "0.5rem" }}>{dispute.job.title}</td>
                  <td style={{ padding: "0.5rem", fontSize: "0.85rem" }}>{dispute.client.fullName}</td>
                  <td style={{ padding: "0.5rem", fontSize: "0.85rem", maxWidth: 250 }}>{dispute.reason}</td>
                  <td style={{ padding: "0.5rem" }}>
                    <span style={{
                      padding: "0.2rem 0.5rem",
                      borderRadius: 4,
                      fontSize: "0.8rem",
                      background: dispute.status === "RESOLVED" ? "#2a7a2a" : dispute.status === "UNDER_REVIEW" ? "#d9a020" : "#d94a4a",
                    }}>
                      {dispute.status}
                    </span>
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    {dispute.status !== "RESOLVED" && (
                      resolving === dispute.id ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <input
                            type="text"
                            placeholder="Ruling (required)"
                            value={ruling}
                            onChange={(e) => setRuling(e.target.value)}
                            style={{ padding: "0.3rem", fontSize: "0.8rem", borderRadius: 4, border: "1px solid #444", background: "#1a1a1a", color: "#fff" }}
                          />
                          <input
                            type="text"
                            placeholder="Resolution details"
                            value={resolution}
                            onChange={(e) => setResolution(e.target.value)}
                            style={{ padding: "0.3rem", fontSize: "0.8rem", borderRadius: 4, border: "1px solid #444", background: "#1a1a1a", color: "#fff" }}
                          />
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => handleResolve(dispute.id)} style={{ fontSize: "0.8rem", padding: "0.2rem 0.5rem", background: "#2a7a2a", border: "none", borderRadius: 4, cursor: "pointer", color: "#fff" }}>
                              Submit
                            </button>
                            <button onClick={() => { setResolving(null); setRuling(""); setResolution(""); }} style={{ fontSize: "0.8rem", padding: "0.2rem 0.5rem", background: "#666", border: "none", borderRadius: 4, cursor: "pointer", color: "#fff" }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setResolving(dispute.id)} style={{ fontSize: "0.8rem", padding: "0.2rem 0.5rem", background: "#4a90d9", border: "none", borderRadius: 4, cursor: "pointer", color: "#fff" }}>
                          Resolve
                        </button>
                      )
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
