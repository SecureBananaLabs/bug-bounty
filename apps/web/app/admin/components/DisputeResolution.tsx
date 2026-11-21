"use client";

import { useState, useEffect, useCallback } from "react";

interface Dispute { id: number; jobId: number; freelancerId: number; clientId: number; status: string; reason: string; amount: number; openedAt: string; resolvedAt?: string; ruling?: string; }

export default function DisputeResolution() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter ? `/api/admin/disputes?status=${filter}` : "/api/admin/disputes";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setDisputes(data.items);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetch(); }, [fetch]);

  const resolve = async (disputeId: number, ruling: string) => {
    await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ruling }),
    });
    fetch();
  };

  if (loading) return <div role="status">Loading disputes...</div>;
  if (error) return <div role="alert" style={{ color: "red" }}>{error}</div>;

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: "0.4rem", borderRadius: 4, border: "1px solid #4b5563", background: "#1f2937", color: "#fff" }} aria-label="Filter disputes">
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="under_review">Under Review</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {disputes.length === 0 ? (
        <p style={{ color: "#9ca3af" }}>No disputes found.</p>
      ) : (
        disputes.map(d => (
          <div key={d.id} className="card" style={{ padding: "1rem", marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
              <strong>Dispute #{d.id}</strong>
              <StatusBadge status={d.status} />
            </div>
            <div style={{ fontSize: "0.875rem", color: "#9ca3af", marginBottom: "0.25rem" }}>
              Job #{d.jobId} • ${d.amount} • {d.reason}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.5rem" }}>
              Freelancer #{d.freelancerId} vs Client #{d.clientId} • {d.openedAt}
              {d.resolvedAt && ` • Resolved: ${d.resolvedAt}`}
              {d.ruling && ` • Ruling: ${d.ruling}`}
            </div>
            {d.status !== "resolved" && (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => resolve(d.id, "freelancer")} style={btn("#22c55e")} aria-label="Rule in favor of freelancer">Freelancer</button>
                <button onClick={() => resolve(d.id, "client")} style={btn("#3b82f6")} aria-label="Rule in favor of client">Client</button>
                <button onClick={() => resolve(d.id, "escalate")} style={btn("#eab308")} aria-label="Escalate dispute">Escalate</button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = { open: "#ef4444", under_review: "#eab308", resolved: "#22c55e" };
  return <span style={{ padding: "0.1rem 0.4rem", borderRadius: 4, background: colors[status] || "#6b7280", color: "#000", fontSize: "0.75rem", fontWeight: 600 }}>{status}</span>;
}

const btn = (c: string) => ({ padding: "0.3rem 0.75rem", border: "none", borderRadius: 4, background: c, color: "#000", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" } as const);
