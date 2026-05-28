"use client";

import { useState } from "react";

type ModerationAction = "APPROVED" | "REJECTED" | "ESCALATED";

interface FlaggedJob {
  id: string;
  title: string;
  postedBy: string;
  flagReason: string;
  flaggedAt: string;
  status: "PENDING" | ModerationAction;
}

const MOCK_FLAGGED_JOBS: FlaggedJob[] = [
  { id: "j1", title: "Build a phishing site", postedBy: "Bob Smith", flagReason: "Potentially malicious content", flaggedAt: "2024-06-01", status: "PENDING" },
  { id: "j2", title: "Scrape competitor data", postedBy: "Dana Lee", flagReason: "Terms of service violation", flaggedAt: "2024-06-02", status: "PENDING" },
  { id: "j3", title: "Write fake reviews", postedBy: "Charlie Doe", flagReason: "Fraudulent activity", flaggedAt: "2024-06-03", status: "PENDING" },
];

export function JobsTab() {
  const [jobs, setJobs] = useState(MOCK_FLAGGED_JOBS);

  function moderate(id: string, action: ModerationAction) {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status: action } : j)));
  }

  const pending = jobs.filter((j) => j.status === "PENDING");
  const resolved = jobs.filter((j) => j.status !== "PENDING");

  return (
    <div>
      <h3 style={{ marginBottom: 12 }}>Flagged Jobs Queue ({pending.length} pending)</h3>

      {pending.length === 0 && <p style={{ color: "#666" }}>No pending flagged jobs.</p>}

      {pending.map((job) => (
        <div key={job.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 16, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <strong>{job.title}</strong>
              <p style={{ margin: "4px 0", fontSize: 14, color: "#666" }}>Posted by: {job.postedBy}</p>
              <p style={{ margin: "4px 0", fontSize: 14, color: "#c00" }}>Flag reason: {job.flagReason}</p>
              <p style={{ margin: "4px 0", fontSize: 12, color: "#999" }}>Flagged: {job.flaggedAt}</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => moderate(job.id, "APPROVED")}
                style={{ padding: "6px 12px", background: "#28a745", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
              >
                Approve
              </button>
              <button
                onClick={() => moderate(job.id, "REJECTED")}
                style={{ padding: "6px 12px", background: "#dc3545", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
              >
                Reject
              </button>
              <button
                onClick={() => moderate(job.id, "ESCALATED")}
                style={{ padding: "6px 12px", background: "#ffc107", color: "#000", border: "none", borderRadius: 4, cursor: "pointer" }}
              >
                Escalate
              </button>
            </div>
          </div>
        </div>
      ))}

      {resolved.length > 0 && (
        <>
          <h4 style={{ marginTop: 24, marginBottom: 8 }}>Resolved ({resolved.length})</h4>
          {resolved.map((job) => (
            <div key={job.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, marginBottom: 8, opacity: 0.7 }}>
              <span style={{ fontWeight: 500 }}>{job.title}</span>
              <span style={{ marginLeft: 12, padding: "2px 8px", borderRadius: 4, fontSize: 12, background: job.status === "APPROVED" ? "#d4edda" : job.status === "REJECTED" ? "#f8d7da" : "#fff3cd" }}>
                {job.status}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
