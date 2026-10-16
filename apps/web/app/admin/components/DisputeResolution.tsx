"use client";

import { useEffect, useState } from "react";

interface Dispute {
  id: string;
  jobId: string;
  filedBy: string;
  reason: string;
  status: string;
  ruling: string | null;
  refundAmount: number | null;
  messages: { from: string; text: string; at: string }[];
  createdAt: string;
}

export default function DisputeResolution() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Record<string, { ruling: string; refundAmount: string; message: string }>>({});

  const fetchDisputes = () => {
    setLoading(true);
    fetch("/api/admin/disputes", { credentials: "include" })
      .then((r) => r.json())
      .then((res) => { if (res.success) setDisputes(res.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDisputes(); }, []);

  const updateForm = (disputeId: string, field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [disputeId]: { ...(prev[disputeId] ?? { ruling: "", refundAmount: "", message: "" }), [field]: value },
    }));
  };

  const resolve = async (disputeId: string) => {
    const f = form[disputeId];
    if (!f?.ruling) return;

    await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        ruling: f.ruling,
        refundAmount: f.refundAmount ? Number(f.refundAmount) : null,
        message: f.message || undefined,
      }),
    });
    fetchDisputes();
  };

  return (
    <section>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Dispute Resolution</h2>

      {loading ? (
        <p>Loading…</p>
      ) : disputes.length === 0 ? (
        <p style={{ color: "var(--muted, #6b7280)" }}>No disputes.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {disputes.map((d) => {
            const f = form[d.id] ?? { ruling: "", refundAmount: "", message: "" };
            const resolved = d.status === "resolved";

            return (
              <div key={d.id} className="card" style={{ padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <div>
                    <strong style={{ fontSize: "0.9rem" }}>{d.reason}</strong>
                    <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", color: "var(--muted, #6b7280)", fontFamily: "monospace" }}>
                      job: {d.jobId} • by {d.filedBy}
                    </span>
                  </div>
                  <span style={{
                    padding: "0.15rem 0.5rem", borderRadius: 999, fontSize: "0.75rem", fontWeight: 500,
                    background: resolved ? "#16a34a20" : d.status === "escalated" ? "#dc262620" : "#f59e0b20",
                    color: resolved ? "#16a34a" : d.status === "escalated" ? "#dc2626" : "#f59e0b",
                  }}>
                    {resolved ? `Resolved — ${d.ruling}` : d.status}
                  </span>
                </div>

                {resolved ? (
                  <div style={{ fontSize: "0.8rem", color: "var(--muted, #6b7280)" }}>
                    {d.ruling && <div>Ruling: {d.ruling}</div>}
                    {d.refundAmount != null && <div>Refund: ${d.refundAmount}</div>}
                    {d.messages.length > 0 && (
                      <div style={{ marginTop: "0.35rem" }}>
                        {d.messages.map((m, i) => (
                          <div key={i} style={{ padding: "0.25rem 0" }}><em>{m.from}:</em> {m.text}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                    <label style={{ fontSize: "0.75rem" }}>
                      Ruling
                      <select value={f.ruling} onChange={(e) => updateForm(d.id, "ruling", e.target.value)}
                        style={{ display: "block", marginTop: 2, padding: "0.25rem", borderRadius: 4, fontSize: "0.8rem" }}>
                        <option value="">Select…</option>
                        <option value="refund_client">Refund Client</option>
                        <option value="release_to_freelancer">Release to Freelancer</option>
                        <option value="split">Split</option>
                        <option value="dismiss">Dismiss</option>
                      </select>
                    </label>
                    <label style={{ fontSize: "0.75rem" }}>
                      Refund ($)
                      <input type="number" value={f.refundAmount} onChange={(e) => updateForm(d.id, "refundAmount", e.target.value)}
                        style={{ display: "block", marginTop: 2, padding: "0.25rem", borderRadius: 4, fontSize: "0.8rem", width: 100 }} />
                    </label>
                    <label style={{ fontSize: "0.75rem", flex: 1, minWidth: 180 }}>
                      Message
                      <input value={f.message} onChange={(e) => updateForm(d.id, "message", e.target.value)}
                        style={{ display: "block", marginTop: 2, padding: "0.25rem", borderRadius: 4, fontSize: "0.8rem", width: "100%" }} />
                    </label>
                    <button onClick={() => resolve(d.id)}
                      style={{ padding: "0.35rem 0.9rem", background: "var(--accent, #2563eb)", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                      Resolve
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
