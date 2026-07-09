"use client";

import { useState } from "react";

interface Dispute {
  id: string;
  jobTitle: string;
  filer: string;
  target: string;
  reason: string;
  description: string;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED";
  ruling?: string;
  createdAt: string;
}

const MOCK_DISPUTES: Dispute[] = [
  {
    id: "d1",
    jobTitle: "Build an AI customer support widget",
    filer: "Alice Johnson",
    target: "Bob Smith",
    reason: "Non-payment",
    description: "Client has not released milestone payment after delivery was accepted.",
    status: "OPEN",
    createdAt: "2024-06-01"
  },
  {
    id: "d2",
    jobTitle: "Design SaaS onboarding flows",
    filer: "Eve Park",
    target: "Charlie Doe",
    reason: "Quality issues",
    description: "Delivered work does not match agreed specifications. Missing 3 of 5 screens.",
    status: "UNDER_REVIEW",
    createdAt: "2024-06-03"
  }
];

export function DisputesTab() {
  const [disputes, setDisputes] = useState(MOCK_DISPUTES);
  const [rulingInputs, setRulingInputs] = useState<Record<string, string>>({});

  function handleResolve(id: string) {
    const ruling = rulingInputs[id]?.trim();
    if (!ruling) return;

    setDisputes((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status: "RESOLVED" as const, ruling } : d
      )
    );
    setRulingInputs((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  const open = disputes.filter((d) => d.status !== "RESOLVED");
  const resolved = disputes.filter((d) => d.status === "RESOLVED");

  return (
    <div>
      <h3 style={{ marginBottom: 12 }}>Dispute Resolution Queue ({open.length} open)</h3>

      {open.length === 0 && <p style={{ color: "#666" }}>No open disputes.</p>}

      {open.map((d) => (
        <div key={d.id} className="card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <strong>{d.jobTitle}</strong>
              <p style={{ margin: "4px 0", fontSize: 14 }}>
                <span style={{ color: "#666" }}>Filed by:</span> {d.filer}{" "}
                <span style={{ color: "#666" }}>against:</span> {d.target}
              </p>
              <p style={{ margin: "4px 0", fontSize: 14, color: "#c00" }}>Reason: {d.reason}</p>
              <p style={{ margin: "4px 0", fontSize: 13 }}>{d.description}</p>
              <p style={{ margin: "4px 0", fontSize: 12, color: "#999" }}>Opened: {d.createdAt}</p>
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 12,
                  background: d.status === "OPEN" ? "#fff3cd" : "#cce5ff",
                  marginTop: 4
                }}
              >
                {d.status}
              </span>
            </div>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder="Enter ruling…"
              value={rulingInputs[d.id] ?? ""}
              onChange={(e) => setRulingInputs((prev) => ({ ...prev, [d.id]: e.target.value }))}
              style={{ flex: 1, padding: "8px 12px", border: "1px solid #ddd", borderRadius: 4 }}
              aria-label={`Ruling for dispute ${d.id}`}
            />
            <button
              onClick={() => handleResolve(d.id)}
              disabled={!rulingInputs[d.id]?.trim()}
              style={{
                padding: "8px 16px",
                background: rulingInputs[d.id]?.trim() ? "#0070f3" : "#ccc",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: rulingInputs[d.id]?.trim() ? "pointer" : "default"
              }}
            >
              Resolve
            </button>
          </div>
        </div>
      ))}

      {resolved.length > 0 && (
        <>
          <h4 style={{ marginTop: 24, marginBottom: 8 }}>Resolved ({resolved.length})</h4>
          {resolved.map((d) => (
            <div key={d.id} className="card" style={{ padding: 12, marginBottom: 8, opacity: 0.7 }}>
              <strong>{d.jobTitle}</strong>
              <span
                style={{ marginLeft: 12, padding: "2px 8px", borderRadius: 4, fontSize: 12, background: "#d4edda" }}
              >
                RESOLVED
              </span>
              <p style={{ margin: "4px 0", fontSize: 13, color: "#555" }}>Ruling: {d.ruling}</p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
