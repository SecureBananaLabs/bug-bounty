"use client";

import { useState, useEffect, useCallback } from "react";

interface FlaggedJob { id: number; title: string; postedBy: string; flagReason: string; status: string; flaggedAt: string; }

export default function JobModeration() {
  const [jobs, setJobs] = useState<FlaggedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/jobs/flagged");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setJobs(data.items);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const moderate = async (jobId: number, action: string) => {
    const reason = prompt(`Reason for ${action}:`);
    await fetch(`/api/admin/jobs/${jobId}/moderate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason: reason || "" }),
    });
    fetch();
  };

  if (loading) return <div role="status">Loading moderation queue...</div>;
  if (error) return <div role="alert" style={{ color: "red" }}>{error}</div>;

  return (
    <div>
      <h3 style={{ marginBottom: "1rem" }}>Flagged Jobs ({jobs.length})</h3>
      {jobs.length === 0 ? (
        <p style={{ color: "#9ca3af" }}>No flagged jobs — queue is clear.</p>
      ) : (
        jobs.map(j => (
          <div key={j.id} className="card" style={{ padding: "1rem", marginBottom: "0.75rem" }}>
            <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{j.title}</div>
            <div style={{ fontSize: "0.875rem", color: "#9ca3af", marginBottom: "0.5rem" }}>
              by {j.postedBy} • {j.flagReason} • {j.flaggedAt}
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={() => moderate(j.id, "approved")} style={btn("#22c55e")} aria-label={`Approve ${j.title}`}>Approve</button>
              <button onClick={() => moderate(j.id, "rejected")} style={btn("#ef4444")} aria-label={`Reject ${j.title}`}>Reject</button>
              <button onClick={() => moderate(j.id, "escalated")} style={btn("#eab308")} aria-label={`Escalate ${j.title}`}>Escalate</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const btn = (c: string) => ({ padding: "0.3rem 0.75rem", border: "none", borderRadius: 4, background: c, color: "#000", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" } as const);
