"use client";

import { useEffect, useState } from "react";

interface Job {
  id: string;
  title: string;
  status: string;
  clientId: string;
  budget: number;
  createdAt: string;
}

const STATUS_OPTIONS = ["pending", "approved", "rejected", "flagged"];

export default function JobManagement() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchJobs = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/admin/jobs?${params}`, { credentials: "include" })
      .then((r) => r.json())
      .then((res) => { if (res.success) setJobs(res.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchJobs(); }, [statusFilter]);

  const updateStatus = (jobId: string, status: string) => {
    fetch(`/api/admin/jobs/${jobId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    }).then(() => fetchJobs());
  };

  const statusColor = (s: string) =>
    s === "approved" ? "#16a34a" : s === "rejected" ? "#dc2626" : s === "flagged" ? "#f59e0b" : "var(--muted, #6b7280)";

  return (
    <section>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Job Management</h2>

      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
        style={{ padding: "0.35rem 0.5rem", borderRadius: 4, border: "1px solid var(--border, #d1d5db)", marginBottom: "1rem" }}>
        <option value="">All statuses</option>
        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      {loading ? (
        <p>Loading…</p>
      ) : jobs.length === 0 ? (
        <p style={{ color: "var(--muted, #6b7280)" }}>No jobs found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid var(--border, #e5e7eb)" }}>
                <th style={{ padding: "0.5rem" }}>ID</th>
                <th style={{ padding: "0.5rem" }}>Title</th>
                <th style={{ padding: "0.5rem" }}>Client</th>
                <th style={{ padding: "0.5rem" }}>Budget</th>
                <th style={{ padding: "0.5rem" }}>Status</th>
                <th style={{ padding: "0.5rem" }}>Created</th>
                <th style={{ padding: "0.5rem" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} style={{ borderBottom: "1px solid var(--border, #e5e7eb)" }}>
                  <td style={{ padding: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem" }}>{j.id}</td>
                  <td style={{ padding: "0.5rem" }}>{j.title}</td>
                  <td style={{ padding: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem" }}>{j.clientId}</td>
                  <td style={{ padding: "0.5rem" }}>${j.budget}</td>
                  <td style={{ padding: "0.5rem" }}>
                    <span style={{ padding: "0.15rem 0.5rem", borderRadius: 999, background: statusColor(j.status) + "20", color: statusColor(j.status), fontWeight: 500, fontSize: "0.75rem" }}>
                      {j.status}
                    </span>
                  </td>
                  <td style={{ padding: "0.5rem", color: "var(--muted, #6b7280)", fontSize: "0.75rem" }}>{j.createdAt}</td>
                  <td style={{ padding: "0.5rem" }}>
                    <select value={j.status} onChange={(e) => updateStatus(j.id, e.target.value)}
                      style={{ padding: "0.2rem 0.35rem", borderRadius: 4, fontSize: "0.75rem" }}>
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
