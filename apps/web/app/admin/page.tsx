"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ──
type User = { id: string; username: string; email: string; role: string; status: string; joinedAt: string; trustScore: number; activeJobs: number };
type FlaggedJob = { id: string; jobId: string; title: string; reason: string; flaggedAt: string; status: string };
type Dispute = { id: string; jobId: string; status: string; reason: string; messages: Array<{ from: string; text: string }>; createdAt: string };
type AuditEntry = { id: string; adminId: string; action: string; target: string; details: Record<string, unknown>; timestamp: string };
type Metrics = { totalUsers: number; activeJobs: number; openDisputes: number; flaggedListings: number; revenue: number; registrationsOpen: boolean; postingsOpen: boolean; trustDistribution: Record<string, number> };
type Paginated<T> = { items: T[]; total: number; page: number; totalPages: number };

const BASE = "/api/admin";

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer admin-demo` },
    ...options,
  });
  if (!res.ok) throw new Error(`${res.status}`);
  const json = await res.json();
  return json.data as T;
}

// ── Main Page ──
export default function AdminPanelPage() {
  const [section, setSection] = useState<string>("metrics");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Metrics>("/metrics").then(setMetrics).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (!metrics) return <ErrorState />;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.25rem" }}>Admin Panel</h1>
      <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>Moderation, metrics, and platform controls.</p>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <MetricCard label="Total Users" value={metrics.totalUsers} color="#3b82f6" />
        <MetricCard label="Active Jobs" value={metrics.activeJobs} color="#10b981" />
        <MetricCard label="Open Disputes" value={metrics.openDisputes} color="#f59e0b" />
        <MetricCard label="Flagged" value={metrics.flaggedListings} color="#ef4444" />
        <MetricCard label="Revenue" value={`$${(metrics.revenue / 1000).toFixed(1)}k`} color="#8b5cf6" />
      </div>

      {/* Trust Distribution */}
      <TrustChart distribution={metrics.trustDistribution} />

      {/* Nav Tabs */}
      <nav style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", margin: "2rem 0 1.5rem" }}>
        {[
          { key: "users", label: "Users" },
          { key: "flagged", label: "Flagged Jobs" },
          { key: "disputes", label: "Disputes" },
          { key: "controls", label: "Controls" },
          { key: "audit", label: "Audit Log" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setSection(tab.key)}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "999px",
              border: section === tab.key ? "2px solid #3b82f6" : "1px solid #e5e7eb",
              background: section === tab.key ? "#eff6ff" : "#fff",
              color: section === tab.key ? "#3b82f6" : "#374151",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Section Content */}
      {section === "users" && <UsersSection />}
      {section === "flagged" && <FlaggedJobsSection />}
      {section === "disputes" && <DisputesSection />}
      {section === "controls" && <ControlsSection metrics={metrics} onUpdate={setMetrics} />}
      {section === "audit" && <AuditLogSection />}
    </div>
  );
}

// ── Sub-components ──

function MetricCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="card" style={{ borderLeft: `4px solid ${color}` }}>
      <p style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
      <p style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: "0.25rem" }}>{value}</p>
    </div>
  );
}

function TrustChart({ distribution }: { distribution: Record<string, number> }) {
  const max = Math.max(...Object.values(distribution), 1);
  return (
    <div className="card" style={{ marginBottom: "1rem" }}>
      <h3 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.75rem" }}>Trust Score Distribution</h3>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "0.75rem", height: 100 }}>
        {Object.entries(distribution).map(([range, count]) => (
          <div key={range} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ height: `${(count / max) * 80}px`, background: "linear-gradient(180deg, #3b82f6, #8b5cf6)", borderRadius: "4px 4px 0 0", minHeight: 4 }} />
            <p style={{ fontSize: "0.65rem", marginTop: "0.25rem", color: "#6b7280" }}>{range}</p>
            <p style={{ fontSize: "0.75rem", fontWeight: 600 }}>{count}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Users ──
function UsersSection() {
  const [data, setData] = useState<Paginated<User> | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10", ...(search && { search }) });
      setData(await api<Paginated<User>>(`/users?${params}`));
    } catch { /* handled by error state */ }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleStatus = async (userId: string, status: string) => {
    await api("/users/status", { method: "PATCH", body: JSON.stringify({ userId, status }) });
    fetchUsers();
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search users..."
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }}
        style={{ padding: "0.5rem 1rem", borderRadius: 8, border: "1px solid #e5e7eb", marginBottom: "1rem", width: "100%", maxWidth: 320 }}
      />
      {loading ? <LoadingState /> : !data ? <ErrorState /> : (
        <>
          <Table
            columns={["Username", "Email", "Role", "Status", "Trust", "Actions"]}
            rows={data.items.map(u => [
              u.username,
              u.email,
              <Badge key="role" color={u.role === "admin" ? "#8b5cf6" : "#6b7280"}>{u.role}</Badge>,
              <Badge key="status" color={u.status === "active" ? "#10b981" : u.status === "suspended" ? "#f59e0b" : "#ef4444"}>{u.status}</Badge>,
              `${u.trustScore}%`,
              <div key="actions" style={{ display: "flex", gap: "0.25rem" }}>
                {u.role !== "admin" && (
                  <>
                    {u.status !== "active" && <Button small onClick={() => handleStatus(u.id, "active")}>Reinstate</Button>}
                    {u.status !== "suspended" && <Button small danger onClick={() => handleStatus(u.id, "suspended")}>Suspend</Button>}
                    {u.status !== "banned" && <Button small danger onClick={() => handleStatus(u.id, "banned")}>Ban</Button>}
                  </>
                )}
              </div>,
            ])}
          />
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPage={setPage} />
        </>
      )}
    </div>
  );
}

// ── Flagged Jobs ──
function FlaggedJobsSection() {
  const [data, setData] = useState<Paginated<FlaggedJob> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    setData(await api<Paginated<FlaggedJob>>(`/flagged-jobs?page=${page}`));
    setLoading(false);
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleAction = async (flagId: string, action: string) => {
    await api("/flagged-jobs", { method: "PATCH", body: JSON.stringify({ flagId, action, reason: `Moderated as ${action}` }) });
    fetch();
  };

  if (loading) return <LoadingState />;
  if (!data) return <ErrorState />;

  return (
    <>
      <Table
        columns={["Job", "Reason", "Flagged At", "Status", "Actions"]}
        rows={data.items.map(j => [
          j.title,
          j.reason,
          new Date(j.flaggedAt).toLocaleDateString(),
          <Badge key="s" color={j.status === "pending" ? "#f59e0b" : j.status === "approved" ? "#10b981" : "#ef4444"}>{j.status}</Badge>,
          j.status === "pending" ? (
            <div key="a" style={{ display: "flex", gap: "0.25rem" }}>
              <Button small onClick={() => handleAction(j.id, "approved")}>Approve</Button>
              <Button small danger onClick={() => handleAction(j.id, "rejected")}>Reject</Button>
              <Button small onClick={() => handleAction(j.id, "escalated")}>Escalate</Button>
            </div>
          ) : null,
        ])}
      />
      <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPage={setPage} />
    </>
  );
}

// ── Disputes ──
function DisputesSection() {
  const [data, setData] = useState<Paginated<Dispute> | null>(null);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    setData(await api<Paginated<Dispute>>(`/disputes?page=${page}`));
    setLoading(false);
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleRuling = async (disputeId: string, inFavorOf: string, action: string) => {
    await api("/disputes/resolve", { method: "PATCH", body: JSON.stringify({ disputeId, ruling: { inFavorOf, action } }) });
    fetch();
  };

  if (loading) return <LoadingState />;
  if (!data) return <ErrorState />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {data.items.map(d => (
        <div key={d.id} className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong>#{d.id}</strong> — {d.jobId} · <Badge color={d.status === "open" ? "#ef4444" : d.status === "under_review" ? "#f59e0b" : "#10b981"}>{d.status}</Badge>
              <p style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.25rem" }}>{d.reason}</p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={() => setExpanded(expanded === d.id ? null : d.id)} style={{ ...btnStyle, background: "#f3f4f6", color: "#374151" }}>
                {expanded === d.id ? "Hide" : "View Thread"}
              </button>
              {d.status !== "resolved" && (
                <>
                  <Button small onClick={() => handleRuling(d.id, "freelancer", "release")}>Rule Freelancer</Button>
                  <Button small danger onClick={() => handleRuling(d.id, "client", "refund")}>Rule Client</Button>
                </>
              )}
            </div>
          </div>
          {expanded === d.id && (
            <div style={{ marginTop: "1rem", padding: "1rem", background: "#f9fafb", borderRadius: 8 }}>
              {d.messages.map((m, i) => (
                <div key={i} style={{ marginBottom: "0.5rem" }}>
                  <strong>{m.from}:</strong> {m.text}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPage={setPage} />
    </div>
  );
}

// ── Controls ──
function ControlsSection({ metrics, onUpdate }: { metrics: Metrics; onUpdate: (m: Metrics) => void }) {
  const [confirm, setConfirm] = useState<string | null>(null);

  const toggle = async (type: "registrations" | "postings", enabled: boolean) => {
    const path = type === "registrations" ? "/controls/registrations" : "/controls/postings";
    await api(path, { method: "PATCH", body: JSON.stringify({ enabled }) });
    const updated = await api<Metrics>("/metrics");
    onUpdate(updated);
    setConfirm(null);
  };

  return (
    <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
      <ToggleCard
        label="New User Registrations"
        enabled={metrics.registrationsOpen}
        onToggle={(v) => v ? setConfirm("registrations-off") : toggle("registrations", true)}
      />
      <ToggleCard
        label="New Job Postings"
        enabled={metrics.postingsOpen}
        onToggle={(v) => v ? setConfirm("postings-off") : toggle("postings", true)}
      />
      {confirm === "registrations-off" && (
        <ConfirmDialog message="Disable new user registrations?" onConfirm={() => toggle("registrations", false)} onCancel={() => setConfirm(null)} />
      )}
      {confirm === "postings-off" && (
        <ConfirmDialog message="Disable new job postings?" onConfirm={() => toggle("postings", false)} onCancel={() => setConfirm(null)} />
      )}
    </div>
  );
}

function ToggleCard({ label, enabled, onToggle }: { label: string; enabled: boolean; onToggle: (v: boolean) => void }) {
  return (
    <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <strong>{label}</strong>
        <p style={{ fontSize: "0.75rem", color: "#6b7280" }}>{enabled ? "Currently open" : "Currently closed"}</p>
      </div>
      <button
        onClick={() => onToggle(enabled)}
        style={{
          padding: "0.5rem 1.25rem",
          borderRadius: 999,
          border: "none",
          background: enabled ? "#10b981" : "#ef4444",
          color: "#fff",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {enabled ? "Enabled" : "Disabled"}
      </button>
    </div>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="card" style={{ border: "2px solid #f59e0b", gridColumn: "1 / -1" }}>
      <p style={{ fontWeight: 600, marginBottom: "0.75rem" }}>{message}</p>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Button onClick={onConfirm}>Confirm</Button>
        <Button onClick={onCancel} style={{ background: "#f3f4f6", color: "#374151" }}>Cancel</Button>
      </div>
    </div>
  );
}

// ── Audit Log ──
function AuditLogSection() {
  const [data, setData] = useState<Paginated<AuditEntry> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api<Paginated<AuditEntry>>(`/audit-log?page=${page}`).then(setData).finally(() => setLoading(false));
  }, [page]);

  if (loading) return <LoadingState />;
  if (!data) return <ErrorState />;

  return (
    <>
      <Table
        columns={["Time", "Admin", "Action", "Target", "Details"]}
        rows={data.items.map(e => [
          new Date(e.timestamp).toLocaleString(),
          e.adminId,
          <code key="act" style={{ fontSize: "0.75rem" }}>{e.action}</code>,
          e.target,
          <code key="det" style={{ fontSize: "0.7rem" }}>{JSON.stringify(e.details).slice(0, 60)}</code>,
        ])}
      />
      <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPage={setPage} />
    </>
  );
}

// ── Shared Components ──

function Table({ columns, rows }: { columns: string[]; rows: React.ReactNode[][] }) {
  if (rows.length === 0) return <EmptyState message="No data to display." />;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
            {columns.map(c => <th key={c} style={{ textAlign: "left", padding: "0.75rem 0.5rem", color: "#6b7280", fontWeight: 600 }}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
              {row.map((cell, j) => <td key={j} style={{ padding: "0.75rem 0.5rem" }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pagination({ page, totalPages, total, onPage }: { page: number; totalPages: number; total: number; onPage: (p: number) => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", fontSize: "0.8rem", color: "#6b7280" }}>
      <span>{total} total</span>
      <div style={{ display: "flex", gap: "0.25rem" }}>
        <button disabled={page <= 1} onClick={() => onPage(page - 1)} style={pageBtnStyle}>←</button>
        <span style={{ padding: "0.25rem 0.5rem" }}>{page} / {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => onPage(page + 1)} style={pageBtnStyle}>→</button>
      </div>
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "0.15rem 0.5rem",
      borderRadius: 999,
      background: `${color}18`,
      color,
      fontSize: "0.7rem",
      fontWeight: 600,
    }}>
      {children}
    </span>
  );
}

function Button({ children, small, danger, onClick, style }: {
  children: React.ReactNode; small?: boolean; danger?: boolean; onClick?: () => void; style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: small ? "0.25rem 0.5rem" : "0.5rem 1.25rem",
        borderRadius: 999,
        border: "none",
        background: danger ? "#ef4444" : "#3b82f6",
        color: "#fff",
        fontWeight: 600,
        fontSize: small ? "0.7rem" : "0.875rem",
        cursor: "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function LoadingState() {
  return <div className="card" style={{ textAlign: "center", padding: "3rem" }}><p style={{ color: "#6b7280" }}>Loading…</p></div>;
}

function ErrorState() {
  return <div className="card" style={{ textAlign: "center", padding: "3rem", border: "1px solid #fca5a5" }}><p style={{ color: "#ef4444" }}>Failed to load. Ensure you are authenticated as admin.</p></div>;
}

function EmptyState({ message }: { message: string }) {
  return <div className="card" style={{ textAlign: "center", padding: "2rem" }}><p style={{ color: "#9ca3af" }}>{message}</p></div>;
}

const btnStyle: React.CSSProperties = { padding: "0.25rem 0.75rem", borderRadius: 999, border: "none", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" };
const pageBtnStyle: React.CSSProperties = { padding: "0.25rem 0.5rem", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer" };
