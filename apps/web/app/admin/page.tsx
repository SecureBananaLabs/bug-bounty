"use client";

import { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
type Tab = "metrics" | "users" | "jobs" | "disputes" | "controls" | "audit";

interface User { id: string; name: string; email: string; role: string; status: string; joinDate: string; trustScore: number; }
interface FlaggedJob { id: string; title: string; postedBy: string; reason: string; status: string; flaggedAt: string; }
interface Dispute { id: string; title: string; freelancer: string; client: string; status: string; amount: number; openedAt: string; }
interface AuditEntry { id: string; adminId: string; action: string; target: string; detail: string; timestamp: string; }
interface Metrics { totalUsers: number; activeJobs: number; openDisputes: number; flaggedListings: number; revenue: number; trustDistribution: { high: number; medium: number; low: number }; platformSettings: { registrationsEnabled: boolean; jobPostingsEnabled: boolean }; }

// ── Mock data (mirrors backend in-memory store) ────────────────────────────
const MOCK_METRICS: Metrics = {
  totalUsers: 5, activeJobs: 42, openDisputes: 1, flaggedListings: 2, revenue: 128900,
  trustDistribution: { high: 2, medium: 1, low: 2 },
  platformSettings: { registrationsEnabled: true, jobPostingsEnabled: true },
};
const MOCK_USERS: User[] = [
  { id: "u1", name: "Alice Johnson", email: "alice@example.com", role: "freelancer", status: "active", joinDate: "2025-01-15", trustScore: 92 },
  { id: "u2", name: "Bob Smith", email: "bob@example.com", role: "client", status: "active", joinDate: "2025-02-20", trustScore: 88 },
  { id: "u3", name: "Carol White", email: "carol@example.com", role: "freelancer", status: "suspended", joinDate: "2025-03-10", trustScore: 45 },
  { id: "u4", name: "Dan Brown", email: "dan@example.com", role: "client", status: "active", joinDate: "2025-04-05", trustScore: 76 },
  { id: "u5", name: "Eve Davis", email: "eve@example.com", role: "freelancer", status: "banned", joinDate: "2025-05-01", trustScore: 12 },
];
const MOCK_JOBS: FlaggedJob[] = [
  { id: "j1", title: "Build AI chatbot", postedBy: "u2", reason: "Suspicious budget", status: "pending", flaggedAt: "2026-05-10" },
  { id: "j2", title: "SEO optimization", postedBy: "u4", reason: "Duplicate listing", status: "pending", flaggedAt: "2026-05-12" },
  { id: "j3", title: "Logo design", postedBy: "u2", reason: "User report", status: "escalated", flaggedAt: "2026-05-14" },
];
const MOCK_DISPUTES: Dispute[] = [
  { id: "d1", title: "Payment not received", freelancer: "u1", client: "u2", status: "open", amount: 500, openedAt: "2026-05-08" },
  { id: "d2", title: "Work quality issue", freelancer: "u3", client: "u4", status: "under_review", amount: 1200, openedAt: "2026-05-11" },
  { id: "d3", title: "Scope creep dispute", freelancer: "u1", client: "u4", status: "resolved", amount: 800, openedAt: "2026-05-05" },
];

// ── Helpers ────────────────────────────────────────────────────────────────
const statusColor = (s: string) => ({ active: "#16a34a", suspended: "#d97706", banned: "#dc2626", pending: "#d97706", escalated: "#7c3aed", approved: "#16a34a", rejected: "#dc2626", open: "#dc2626", under_review: "#d97706", resolved: "#16a34a" }[s] ?? "#6b7280");
const badge = (s: string) => <span style={{ background: statusColor(s), color: "#fff", borderRadius: 4, padding: "2px 8px", fontSize: 12 }}>{s}</span>;

// ── Sub-components ─────────────────────────────────────────────────────────
function MetricsTab({ data }: { data: Metrics }) {
  return (
    <div>
      <h3>Platform Overview</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12, marginBottom: 24 }}>
        {[
          ["Total Users", data.totalUsers],
          ["Active Jobs", data.activeJobs],
          ["Open Disputes", data.openDisputes],
          ["Flagged Listings", data.flaggedListings],
          ["Revenue ($)", data.revenue.toLocaleString()],
        ].map(([label, val]) => (
          <div key={label as string} className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{val}</div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>{label}</div>
          </div>
        ))}
      </div>
      <h3>Trust Score Distribution</h3>
      <div style={{ display: "flex", gap: 12 }}>
        {Object.entries(data.trustDistribution).map(([k, v]) => (
          <div key={k} className="card" style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{v}</div>
            <div style={{ fontSize: 13, color: "#6b7280", textTransform: "capitalize" }}>{k} trust</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UsersTab({ onAudit }: { onAudit: (e: AuditEntry) => void }) {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [confirm, setConfirm] = useState<{ userId: string; action: string } | null>(null);

  const filtered = users.filter(u =>
    (!search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) &&
    (!roleFilter || u.role === roleFilter) &&
    (!statusFilter || u.status === statusFilter)
  );

  function applyAction(userId: string, action: string) {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: action } : u));
    onAudit({ id: `log-${Date.now()}`, adminId: "admin-1", action: `user_${action}`, target: userId, detail: `Status set to ${action}`, timestamp: new Date().toISOString() });
    setConfirm(null);
  }

  return (
    <div>
      <h3>User Management</h3>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <input aria-label="Search users" placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #d1d5db", flex: 1, minWidth: 180 }} />
        <select aria-label="Filter by role" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #d1d5db" }}>
          <option value="">All roles</option>
          <option value="freelancer">Freelancer</option>
          <option value="client">Client</option>
        </select>
        <select aria-label="Filter by status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #d1d5db" }}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
      </div>
      {filtered.length === 0 ? <p style={{ color: "#6b7280" }}>No users found.</p> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead><tr style={{ background: "#f9fafb" }}>
              {["Name", "Email", "Role", "Status", "Trust", "Joined", "Actions"].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "8px 12px" }}>{u.name}</td>
                  <td style={{ padding: "8px 12px", color: "#6b7280" }}>{u.email}</td>
                  <td style={{ padding: "8px 12px" }}>{u.role}</td>
                  <td style={{ padding: "8px 12px" }}>{badge(u.status)}</td>
                  <td style={{ padding: "8px 12px" }}>{u.trustScore}</td>
                  <td style={{ padding: "8px 12px", color: "#6b7280" }}>{u.joinDate}</td>
                  <td style={{ padding: "8px 12px", display: "flex", gap: 6 }}>
                    {u.status !== "active" && <button aria-label={`Reinstate ${u.name}`} onClick={() => setConfirm({ userId: u.id, action: "active" })} style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid #16a34a", color: "#16a34a", cursor: "pointer", background: "none" }}>Reinstate</button>}
                    {u.status !== "suspended" && <button aria-label={`Suspend ${u.name}`} onClick={() => setConfirm({ userId: u.id, action: "suspended" })} style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid #d97706", color: "#d97706", cursor: "pointer", background: "none" }}>Suspend</button>}
                    {u.status !== "banned" && <button aria-label={`Ban ${u.name}`} onClick={() => setConfirm({ userId: u.id, action: "banned" })} style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid #dc2626", color: "#dc2626", cursor: "pointer", background: "none" }}>Ban</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {confirm && (
        <div role="dialog" aria-modal="true" aria-label="Confirm action" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div className="card" style={{ maxWidth: 360, width: "100%", padding: 24 }}>
            <p>Set user <strong>{users.find(u => u.id === confirm.userId)?.name}</strong> to <strong>{confirm.action}</strong>?</p>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={() => applyAction(confirm.userId, confirm.action)} style={{ flex: 1, padding: "8px", borderRadius: 6, background: "#1d4ed8", color: "#fff", border: "none", cursor: "pointer" }}>Confirm</button>
              <button onClick={() => setConfirm(null)} style={{ flex: 1, padding: "8px", borderRadius: 6, border: "1px solid #d1d5db", cursor: "pointer", background: "none" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function JobsTab({ onAudit }: { onAudit: (e: AuditEntry) => void }) {
  const [jobs, setJobs] = useState<FlaggedJob[]>(MOCK_JOBS);
  const [confirm, setConfirm] = useState<{ jobId: string; action: string } | null>(null);

  function applyAction(jobId: string, action: string) {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: action } : j));
    onAudit({ id: `log-${Date.now()}`, adminId: "admin-1", action: `job_${action}`, target: jobId, detail: `Job marked as ${action}`, timestamp: new Date().toISOString() });
    setConfirm(null);
  }

  return (
    <div>
      <h3>Job Moderation Queue</h3>
      {jobs.length === 0 ? <p style={{ color: "#6b7280" }}>No flagged jobs.</p> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead><tr style={{ background: "#f9fafb" }}>
              {["Title", "Reason", "Status", "Flagged", "Actions"].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {jobs.map(j => (
                <tr key={j.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "8px 12px" }}>{j.title}</td>
                  <td style={{ padding: "8px 12px", color: "#6b7280" }}>{j.reason}</td>
                  <td style={{ padding: "8px 12px" }}>{badge(j.status)}</td>
                  <td style={{ padding: "8px 12px", color: "#6b7280" }}>{j.flaggedAt}</td>
                  <td style={{ padding: "8px 12px", display: "flex", gap: 6 }}>
                    <button aria-label={`Approve job ${j.title}`} onClick={() => setConfirm({ jobId: j.id, action: "approved" })} style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid #16a34a", color: "#16a34a", cursor: "pointer", background: "none" }}>Approve</button>
                    <button aria-label={`Reject job ${j.title}`} onClick={() => setConfirm({ jobId: j.id, action: "rejected" })} style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid #dc2626", color: "#dc2626", cursor: "pointer", background: "none" }}>Reject</button>
                    <button aria-label={`Escalate job ${j.title}`} onClick={() => setConfirm({ jobId: j.id, action: "escalated" })} style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid #7c3aed", color: "#7c3aed", cursor: "pointer", background: "none" }}>Escalate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {confirm && (
        <div role="dialog" aria-modal="true" aria-label="Confirm moderation" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div className="card" style={{ maxWidth: 360, width: "100%", padding: 24 }}>
            <p>Mark job as <strong>{confirm.action}</strong>?</p>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={() => applyAction(confirm.jobId, confirm.action)} style={{ flex: 1, padding: "8px", borderRadius: 6, background: "#1d4ed8", color: "#fff", border: "none", cursor: "pointer" }}>Confirm</button>
              <button onClick={() => setConfirm(null)} style={{ flex: 1, padding: "8px", borderRadius: 6, border: "1px solid #d1d5db", cursor: "pointer", background: "none" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DisputesTab({ onAudit }: { onAudit: (e: AuditEntry) => void }) {
  const [disputes, setDisputes] = useState<Dispute[]>(MOCK_DISPUTES);
  const [ruling, setRuling] = useState<{ id: string; value: string } | null>(null);

  function applyRuling(id: string, value: string) {
    setDisputes(prev => prev.map(d => d.id === id ? { ...d, status: "resolved" } : d));
    onAudit({ id: `log-${Date.now()}`, adminId: "admin-1", action: "dispute_resolved", target: id, detail: `Ruled in favour of: ${value}`, timestamp: new Date().toISOString() });
    setRuling(null);
  }

  return (
    <div>
      <h3>Dispute Queue</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead><tr style={{ background: "#f9fafb" }}>
            {["Title", "Amount", "Status", "Opened", "Actions"].map(h => (
              <th key={h} style={{ padding: "8px 12px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {disputes.map(d => (
              <tr key={d.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "8px 12px" }}>{d.title}</td>
                <td style={{ padding: "8px 12px" }}>${d.amount}</td>
                <td style={{ padding: "8px 12px" }}>{badge(d.status)}</td>
                <td style={{ padding: "8px 12px", color: "#6b7280" }}>{d.openedAt}</td>
                <td style={{ padding: "8px 12px" }}>
                  {d.status !== "resolved" && (
                    <button aria-label={`Resolve dispute ${d.title}`} onClick={() => setRuling({ id: d.id, value: "" })} style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid #1d4ed8", color: "#1d4ed8", cursor: "pointer", background: "none" }}>Resolve</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {ruling && (
        <div role="dialog" aria-modal="true" aria-label="Resolve dispute" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div className="card" style={{ maxWidth: 400, width: "100%", padding: 24 }}>
            <h4 style={{ marginTop: 0 }}>Rule in favour of:</h4>
            <select aria-label="Select ruling" value={ruling.value} onChange={e => setRuling({ ...ruling, value: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid #d1d5db", marginBottom: 12 }}>
              <option value="">Select…</option>
              <option value="freelancer">Freelancer</option>
              <option value="client">Client</option>
              <option value="split">Split refund</option>
            </select>
            <div style={{ display: "flex", gap: 8 }}>
              <button disabled={!ruling.value} onClick={() => applyRuling(ruling.id, ruling.value)} style={{ flex: 1, padding: "8px", borderRadius: 6, background: "#1d4ed8", color: "#fff", border: "none", cursor: ruling.value ? "pointer" : "not-allowed", opacity: ruling.value ? 1 : 0.5 }}>Confirm</button>
              <button onClick={() => setRuling(null)} style={{ flex: 1, padding: "8px", borderRadius: 6, border: "1px solid #d1d5db", cursor: "pointer", background: "none" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ControlsTab({ onAudit }: { onAudit: (e: AuditEntry) => void }) {
  const [settings, setSettings] = useState({ registrationsEnabled: true, jobPostingsEnabled: true });
  const [confirm, setConfirm] = useState<{ key: keyof typeof settings; value: boolean } | null>(null);

  function applyToggle(key: keyof typeof settings, value: boolean) {
    setSettings(prev => ({ ...prev, [key]: value }));
    onAudit({ id: `log-${Date.now()}`, adminId: "admin-1", action: `toggle_${key}`, target: "platform", detail: `Set to ${value}`, timestamp: new Date().toISOString() });
    setConfirm(null);
  }

  return (
    <div>
      <h3>Platform Controls</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 480 }}>
        {([["registrationsEnabled", "New User Registrations"], ["jobPostingsEnabled", "New Job Postings"]] as const).map(([key, label]) => (
          <div key={key} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{label}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {badge(settings[key] ? "active" : "suspended")}
              <button aria-label={`Toggle ${label}`} onClick={() => setConfirm({ key, value: !settings[key] })} style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #d1d5db", cursor: "pointer", background: settings[key] ? "#fee2e2" : "#dcfce7", color: settings[key] ? "#dc2626" : "#16a34a" }}>
                {settings[key] ? "Disable" : "Enable"}
              </button>
            </div>
          </div>
        ))}
      </div>
      {confirm && (
        <div role="dialog" aria-modal="true" aria-label="Confirm toggle" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div className="card" style={{ maxWidth: 360, width: "100%", padding: 24 }}>
            <p>{confirm.value ? "Enable" : "Disable"} <strong>{confirm.key}</strong>?</p>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={() => applyToggle(confirm.key, confirm.value)} style={{ flex: 1, padding: "8px", borderRadius: 6, background: "#1d4ed8", color: "#fff", border: "none", cursor: "pointer" }}>Confirm</button>
              <button onClick={() => setConfirm(null)} style={{ flex: 1, padding: "8px", borderRadius: 6, border: "1px solid #d1d5db", cursor: "pointer", background: "none" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AuditTab({ entries }: { entries: AuditEntry[] }) {

  return (
    <div>
      <h3>Audit Log</h3>
      {entries.length === 0 ? <p style={{ color: "#6b7280" }}>No audit entries yet.</p> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead><tr style={{ background: "#f9fafb" }}>
              {["Timestamp", "Admin", "Action", "Target", "Detail"].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "8px 12px", color: "#6b7280", whiteSpace: "nowrap" }}>{new Date(e.timestamp).toLocaleString()}</td>
                  <td style={{ padding: "8px 12px" }}>{e.adminId}</td>
                  <td style={{ padding: "8px 12px" }}><code style={{ background: "#f3f4f6", padding: "2px 6px", borderRadius: 4 }}>{e.action}</code></td>
                  <td style={{ padding: "8px 12px", color: "#6b7280" }}>{e.target}</td>
                  <td style={{ padding: "8px 12px" }}>{e.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function AdminPanelPage() {
  const [tab, setTab] = useState<Tab>("metrics");
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  function addAudit(entry: AuditEntry) {
    setAuditLog(prev => [entry, ...prev]);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "metrics", label: "📊 Metrics" },
    { id: "users", label: "👥 Users" },
    { id: "jobs", label: "🔍 Jobs" },
    { id: "disputes", label: "⚖️ Disputes" },
    { id: "controls", label: "🔧 Controls" },
    { id: "audit", label: "📋 Audit Log" },
  ];

  return (
    <section>
      <h2>Admin Panel</h2>
      <nav aria-label="Admin sections" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            aria-current={tab === t.id ? "page" : undefined}
            onClick={() => setTab(t.id)}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              background: tab === t.id ? "#1d4ed8" : "#f3f4f6",
              color: tab === t.id ? "#fff" : "#374151",
              fontWeight: tab === t.id ? 600 : 400,
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="card">
        {tab === "metrics" && <MetricsTab data={MOCK_METRICS} />}
        {tab === "users" && <UsersTab onAudit={addAudit} />}
        {tab === "jobs" && <JobsTab onAudit={addAudit} />}
        {tab === "disputes" && <DisputesTab onAudit={addAudit} />}
        {tab === "controls" && <ControlsTab onAudit={addAudit} />}
        {tab === "audit" && <AuditTab entries={auditLog} />}
      </div>
    </section>
  );
}
