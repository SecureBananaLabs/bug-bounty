"use client";

import { useState, useEffect, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const TOKEN = typeof window !== "undefined" ? localStorage.getItem("token") : "";

async function fetchAPI(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}`, ...options.headers },
    ...options,
  });
  if (res.status === 403) window.location.href = "/login?error=forbidden";
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

function MetricCard({ label, value, color }) {
  return (
    <div className="card" style={{ borderLeft: `4px solid ${color || "#667eea"}` }}>
      <div style={{ fontSize: "0.85rem", color: "#888", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function DataTable({ columns, data, loading, emptyText }) {
  if (loading) return <p style={{ color: "#888" }}>Loading...</p>;
  if (!data?.length) return <p style={{ color: "#888" }}>{emptyText || "No data"}</p>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>{columns.map(c => <th key={c.key} style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid #e5e7eb", fontSize: "0.8rem", color: "#666", fontWeight: 600 }}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.id || i} style={{ borderBottom: "1px solid #f0f0f0" }}>
              {columns.map(c => <td key={c.key} style={{ padding: "8px 12px", fontSize: "0.9rem" }}>{c.render ? c.render(row) : row[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Toggle({ label, description, checked, onChange, disabled }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
      <div>
        <div style={{ fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: "0.8rem", color: "#888" }}>{description}</div>
      </div>
      <button
        onClick={onChange}
        disabled={disabled}
        aria-label={`Toggle ${label}`}
        aria-pressed={checked}
        style={{
          width: 52, height: 28, borderRadius: 14, border: "none", cursor: disabled ? "not-allowed" : "pointer",
          background: checked ? "#10b981" : "#d1d5db", position: "relative", transition: "background 0.2s",
        }}
      >
        <span style={{ display: "block", width: 22, height: 22, borderRadius: 11, background: "#fff", position: "absolute", top: 3, left: checked ? 27 : 3, transition: "left 0.2s" }} />
      </button>
    </div>
  );
}

export default function AdminPanelPage() {
  const [tab, setTab] = useState("metrics");
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState(null);
  const [flaggedJobs, setFlaggedJobs] = useState(null);
  const [disputes, setDisputes] = useState(null);
  const [auditLog, setAuditLog] = useState(null);
  const [platformSettings, setPlatformSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (endpoint, setter) => {
    setLoading(true); setError("");
    try {
      const data = await fetchAPI(endpoint);
      setter(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    switch (tab) {
      case "metrics": load("/api/admin/metrics", setMetrics); break;
      case "users": load("/api/admin/users?page=1&limit=50", setUsers); break;
      case "moderation": load("/api/admin/jobs/flagged", setFlaggedJobs); break;
      case "disputes": load("/api/admin/disputes", setDisputes); break;
      case "audit": load("/api/admin/audit-log", setAuditLog); break;
      case "settings": load("/api/admin/settings", setPlatformSettings); break;
    }
  }, [tab, load]);

  const handleToggle = async (key, currentValue) => {
    if (!confirm(`Are you sure you want to ${currentValue ? "disable" : "enable"} ${key === "registrationOpen" ? "new registrations" : "new job postings"}?`)) return;
    try {
      const res = await fetchAPI("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ key, value: !currentValue }),
      });
      setPlatformSettings(res);
    } catch (e) {
      alert(e.message);
    }
  };

  const tabs = [
    { key: "metrics", label: "📊 Metrics" },
    { key: "users", label: "👥 Users" },
    { key: "moderation", label: "🔍 Moderation" },
    { key: "disputes", label: "⚖️ Disputes" },
    { key: "audit", label: "📝 Audit Log" },
    { key: "settings", label: "⚙️ Controls" },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
      <h1>Admin Panel</h1>

      <nav aria-label="Admin sections" style={{ display: "flex", gap: 4, marginBottom: 24, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            aria-current={tab === t.key ? "page" : undefined}
            style={{
              padding: "8px 16px",
              border: tab === t.key ? "2px solid #667eea" : "2px solid transparent",
              borderRadius: 8,
              background: tab === t.key ? "#667eea15" : "transparent",
              fontWeight: tab === t.key ? 600 : 400,
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {error && <div className="card" style={{ background: "#fef2f2", color: "#dc2626", marginBottom: 16 }}>{error}</div>}

      {tab === "metrics" && metrics && (
        <section aria-label="Metrics dashboard">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
            <MetricCard label="Total Users" value={metrics.totalUsers} color="#667eea" />
            <MetricCard label="Active Jobs" value={metrics.activeJobs} color="#10b981" />
            <MetricCard label="Open Disputes" value={metrics.openDisputes} color="#f59e0b" />
            <MetricCard label="Flagged Listings" value={metrics.flaggedListings} color="#ef4444" />
            <MetricCard label="Revenue (period)" value={`$${(metrics.revenue || 0).toLocaleString()}`} color="#8b5cf6" />
          </div>
          <div className="card">
            <h3>Trust Score Distribution</h3>
            {metrics.trustScoreDistribution && Object.entries(metrics.trustScoreDistribution).map(([range, count]) => (
              <div key={range} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: 4 }}>
                  <span>{range}</span><span>{count} users</span>
                </div>
                <div style={{ height: 8, background: "#e5e7eb", borderRadius: 4 }}>
                  <div style={{ height: 8, borderRadius: 4, background: "#667eea", width: `${(count / metrics.totalUsers) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "users" && (
        <section aria-label="User management">
          <DataTable
            columns={[
              { key: "name", label: "Name" },
              { key: "email", label: "Email" },
              { key: "role", label: "Role", render: row => <span style={{ textTransform: "capitalize" }}>{row.role}</span> },
              { key: "status", label: "Status", render: row => (
                <span style={{
                  padding: "2px 8px", borderRadius: 12, fontSize: "0.8rem", fontWeight: 600,
                  background: row.status === "active" ? "#d1fae5" : row.status === "suspended" ? "#fef3c7" : "#fee2e2",
                  color: row.status === "active" ? "#065f46" : row.status === "suspended" ? "#92400e" : "#991b1b",
                }}>{row.status}</span>
              )},
              { key: "trustScore", label: "Trust" },
              { key: "actions", label: "Actions", render: row => (
                <div style={{ display: "flex", gap: 4 }}>
                  {row.status !== "banned" && (
                    <button onClick={async () => {
                      try {
                        await fetchAPI(`/api/admin/users/${row.id}/status`, { method: "PATCH", body: JSON.stringify({ status: "banned" }) });
                        load("/api/admin/users?page=1&limit=50", setUsers);
                      } catch (e) { alert(e.message); }
                    }} style={{ padding: "2px 8px", fontSize: "0.75rem", border: "1px solid #ef4444", borderRadius: 4, color: "#ef4444", background: "#fff", cursor: "pointer" }}>Ban</button>
                  )}
                  {row.status !== "active" && (
                    <button onClick={async () => {
                      try {
                        await fetchAPI(`/api/admin/users/${row.id}/status`, { method: "PATCH", body: JSON.stringify({ status: "active" }) });
                        load("/api/admin/users?page=1&limit=50", setUsers);
                      } catch (e) { alert(e.message); }
                    }} style={{ padding: "2px 8px", fontSize: "0.75rem", border: "1px solid #10b981", borderRadius: 4, color: "#10b981", background: "#fff", cursor: "pointer" }}>Reinstate</button>
                  )}
                </div>
              )}
            ]}
            data={users?.items}
            loading={loading}
            emptyText="No users found"
          />
        </section>
      )}

      {tab === "moderation" && (
        <section aria-label="Job moderation queue">
          <DataTable
            columns={[
              { key: "title", label: "Job" },
              { key: "poster", label: "Poster" },
              { key: "flagReason", label: "Flag Reason" },
              {
                key: "actions", label: "Actions", render: row => (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={async () => {
                      await fetchAPI(`/api/admin/jobs/${row.id}/moderate`, { method: "POST", body: JSON.stringify({ action: "approve" }) });
                      load("/api/admin/jobs/flagged", setFlaggedJobs);
                    }} style={{ padding: "4px 10px", fontSize: "0.8rem", border: "1px solid #10b981", borderRadius: 4, color: "#10b981", background: "#fff", cursor: "pointer" }}>Approve</button>
                    <button onClick={async () => {
                      const reason = prompt("Rejection reason:");
                      await fetchAPI(`/api/admin/jobs/${row.id}/moderate`, { method: "POST", body: JSON.stringify({ action: "reject", reason }) });
                      load("/api/admin/jobs/flagged", setFlaggedJobs);
                    }} style={{ padding: "4px 10px", fontSize: "0.8rem", border: "1px solid #ef4444", borderRadius: 4, color: "#ef4444", background: "#fff", cursor: "pointer" }}>Reject</button>
                  </div>
                )
              }
            ]}
            data={flaggedJobs?.items}
            loading={loading}
            emptyText="No flagged jobs"
          />
        </section>
      )}

      {tab === "disputes" && (
        <section aria-label="Dispute resolution">
          {disputes?.items?.map(d => (
            <div key={d.id} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h3 style={{ margin: 0 }}>{d.title}</h3>
                <span style={{
                  padding: "2px 10px", borderRadius: 12, fontSize: "0.75rem", fontWeight: 600,
                  background: d.status === "open" ? "#fef3c7" : d.status === "under_review" ? "#dbeafe" : "#d1fae5",
                  color: d.status === "open" ? "#92400e" : d.status === "under_review" ? "#1e40af" : "#065f46",
                }}>{d.status.replace("_", " ")}</span>
              </div>
              <div style={{ fontSize: "0.85rem", color: "#666" }}>{d.freelancer} vs {d.client} • ${d.amount}</div>
              {d.thread?.map((msg, i) => (
                <div key={i} style={{ marginTop: 8, padding: "6px 10px", background: "#f9fafb", borderRadius: 6, fontSize: "0.85rem" }}>
                  <strong>{msg.from}:</strong> {msg.msg}
                </div>
              ))}
              {d.status !== "resolved" && (
                <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                  <button onClick={async () => {
                    await fetchAPI(`/api/admin/disputes/${d.id}/resolve`, { method: "POST", body: JSON.stringify({ ruling: { inFavor: "freelancer", note: "Admin decision" } }) });
                    load("/api/admin/disputes", setDisputes);
                  }} style={{ padding: "6px 14px", border: "1px solid #667eea", borderRadius: 6, color: "#667eea", background: "#fff", cursor: "pointer", fontSize: "0.85rem" }}>Rule for Freelancer</button>
                  <button onClick={async () => {
                    await fetchAPI(`/api/admin/disputes/${d.id}/resolve`, { method: "POST", body: JSON.stringify({ ruling: { inFavor: "client", note: "Admin decision" } }) });
                    load("/api/admin/disputes", setDisputes);
                  }} style={{ padding: "6px 14px", border: "1px solid #f59e0b", borderRadius: 6, color: "#f59e0b", background: "#fff", cursor: "pointer", fontSize: "0.85rem" }}>Rule for Client</button>
                  <button onClick={async () => {
                    await fetchAPI(`/api/admin/disputes/${d.id}/resolve`, { method: "POST", body: JSON.stringify({ ruling: { inFavor: "refund", note: "Admin decision" } }) });
                    load("/api/admin/disputes", setDisputes);
                  }} style={{ padding: "6px 14px", border: "1px solid #ef4444", borderRadius: 6, color: "#ef4444", background: "#fff", cursor: "pointer", fontSize: "0.85rem" }}>Refund</button>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {tab === "audit" && (
        <section aria-label="Audit log">
          <DataTable
            columns={[
              { key: "timestamp", label: "Time", render: row => new Date(row.timestamp).toLocaleString() },
              { key: "adminId", label: "Admin" },
              { key: "action", label: "Action" },
              { key: "target", label: "Target" },
            ]}
            data={auditLog?.items}
            loading={loading}
            emptyText="No audit entries yet"
          />
        </section>
      )}

      {tab === "settings" && platformSettings && (
        <section aria-label="Platform controls">
          <Toggle
            label="New User Registrations"
            description="Allow new users to sign up"
            checked={platformSettings.registrationOpen}
            onChange={() => handleToggle("registrationOpen", platformSettings.registrationOpen)}
          />
          <Toggle
            label="New Job Postings"
            description="Allow clients to post new jobs"
            checked={platformSettings.jobPostingOpen}
            onChange={() => handleToggle("jobPostingOpen", platformSettings.jobPostingOpen)}
          />
        </section>
      )}
    </div>
  );
}
