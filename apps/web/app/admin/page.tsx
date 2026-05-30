import { headers } from "next/headers";

async function fetchJSON<T>(path: string): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const token = process.env.ADMIN_TOKEN || "";
  const res = await fetch(`${base}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

type User = {
  id: string;
  name: string;
  email: string;
  role: "client" | "freelancer" | "admin";
  status: "active" | "suspended" | "banned";
  joinedAt: string;
  jobCount?: number;
  disputeCount?: number;
};

type Dispute = {
  id: string;
  jobId: string;
  clientId: string;
  freelancerId: string;
  status: "open" | "under_review" | "resolved";
  reason: string;
  createdAt: string;
};

type FlaggedJob = {
  id: string;
  title: string;
  flaggedBy: string;
  reason: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected" | "escalated";
};

type AuditEntry = {
  id: string;
  adminId: string;
  action: string;
  target: string;
  timestamp: string;
  details: string;
};

type Metrics = {
  totalUsers: number;
  activeJobs: number;
  openDisputes: number;
  flaggedListings: number;
  revenue: number;
};

type PlatformControls = {
  registrationsEnabled: boolean;
  jobPostingsEnabled: boolean;
};

export default async function AdminPanelPage() {
  let metrics: Metrics | null = null;
  let users: User[] | null = null;
  let disputes: Dispute[] | null = null;
  let flagged: FlaggedJob[] | null = null;
  let controls: PlatformControls | null = null;
  let auditLog: AuditEntry[] | null = null;
  let error = "";

  try {
    const data = await fetchJSON<{ data: { metrics: Metrics; users: User[]; disputes: Dispute[]; flaggedJobs: FlaggedJob[]; controls: PlatformControls; auditLog: AuditEntry[] } }>("/api/admin");
    metrics = data.data.metrics;
    users = data.data.users;
    disputes = data.data.disputes;
    flagged = data.data.flaggedJobs;
    controls = data.data.controls;
    auditLog = data.data.auditLog;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load admin data";
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "1rem" }}>
      <h2>Admin Panel</h2>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {metrics && (
        <section aria-label="Trust and Metrics Dashboard" style={{ marginBottom: "2rem" }}>
          <h3>Platform Metrics</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
            <MetricCard label="Total Users" value={metrics.totalUsers} />
            <MetricCard label="Active Jobs" value={metrics.activeJobs} />
            <MetricCard label="Open Disputes" value={metrics.openDisputes} />
            <MetricCard label="Flagged Listings" value={metrics.flaggedListings} />
            <MetricCard label="Revenue" value={`$${metrics.revenue.toLocaleString()}`} />
          </div>
        </section>
      )}

      {controls && (
        <section aria-label="Platform Controls" style={{ marginBottom: "2rem" }}>
          <h3>Platform Controls</h3>
          <div style={{ display: "flex", gap: "2rem" }}>
            <ToggleControl id="registrations" label="New Registrations" enabled={controls.registrationsEnabled} />
            <ToggleControl id="jobPostings" label="New Job Postings" enabled={controls.jobPostingsEnabled} />
          </div>
        </section>
      )}

      {users && users.length > 0 && (
        <section aria-label="User Management" style={{ marginBottom: "2rem" }}>
          <h3>User Management</h3>
          <FilterBar />
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
                <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td><StatusBadge status={u.status} /></td>
                  <td>{new Date(u.joinedAt).toLocaleDateString()}</td>
                  <td>
                    {u.status === "active" && <ActionButton label="Suspend" variant="warning" />}
                    {u.status === "suspended" && <ActionButton label="Reactivate" variant="success" />}
                    {u.status !== "banned" && <ActionButton label="Ban" variant="danger" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination />
        </section>
      )}

      {flagged && flagged.length > 0 && (
        <section aria-label="Job and Listing Moderation" style={{ marginBottom: "2rem" }}>
          <h3>Moderation Queue</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
                <th>Job</th><th>Reason</th><th>Flagged By</th><th>Date</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {flagged.map((j) => (
                <tr key={j.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td>{j.title}</td>
                  <td>{j.reason}</td>
                  <td>{j.flaggedBy}</td>
                  <td>{new Date(j.createdAt).toLocaleDateString()}</td>
                  <td><StatusBadge status={j.status} /></td>
                  <td>
                    {j.status === "pending" && (
                      <>
                        <ActionButton label="Approve" variant="success" />
                        <ActionButton label="Reject" variant="danger" />
                        <ActionButton label="Escalate" variant="warning" />
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {disputes && disputes.length > 0 && (
        <section aria-label="Dispute Resolution" style={{ marginBottom: "2rem" }}>
          <h3>Dispute Resolution</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
                <th>ID</th><th>Job</th><th>Client</th><th>Freelancer</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map((d) => (
                <tr key={d.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td>{d.id}</td>
                  <td>{d.jobId}</td>
                  <td>{d.clientId}</td>
                  <td>{d.freelancerId}</td>
                  <td><StatusBadge status={d.status} /></td>
                  <td>
                    {d.status === "open" && <ActionButton label="Review" variant="warning" />}
                    {d.status === "under_review" && (
                      <>
                        <ActionButton label="Favor Client" variant="success" />
                        <ActionButton label="Favor Freelancer" variant="success" />
                        <ActionButton label="Escalate" variant="warning" />
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination />
        </section>
      )}

      {auditLog && auditLog.length > 0 && (
        <section aria-label="Audit Log" style={{ marginBottom: "2rem" }}>
          <h3>Audit Log</h3>
          <FilterBar placeholder="Filter by admin, action, or date" />
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
                <th>Timestamp</th><th>Admin</th><th>Action</th><th>Target</th><th>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map((e) => (
                <tr key={e.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td>{new Date(e.timestamp).toLocaleString()}</td>
                  <td>{e.adminId}</td>
                  <td>{e.action}</td>
                  <td>{e.target}</td>
                  <td>{e.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination />
        </section>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card" style={{ padding: "1rem", textAlign: "center" }}>
      <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{value}</div>
      <div style={{ fontSize: "0.875rem", color: "#666" }}>{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "#22c55e",
    suspended: "#f59e0b",
    banned: "#ef4444",
    open: "#3b82f6",
    under_review: "#f59e0b",
    resolved: "#22c55e",
    pending: "#6366f1",
    approved: "#22c55e",
    rejected: "#ef4444",
    escalated: "#f59e0b",
  };
  const bg = colors[status] || "#999";
  return (
    <span style={{ display: "inline-block", padding: "0.2rem 0.6rem", borderRadius: 999, fontSize: "0.75rem", color: "#fff", backgroundColor: bg }}>
      {status.replace("_", " ")}
    </span>
  );
}

function ActionButton({ label, variant }: { label: string; variant: "success" | "warning" | "danger" }) {
  const bg: Record<string, string> = { success: "#22c55e", warning: "#f59e0b", danger: "#ef4444" };
  return (
    <button style={{ padding: "0.25rem 0.5rem", marginRight: "0.25rem", border: "none", borderRadius: 4, color: "#fff", backgroundColor: bg[variant], cursor: "pointer", fontSize: "0.75rem" }}>
      {label}
    </button>
  );
}

function ToggleControl({ id, label, enabled }: { id: string; label: string; enabled: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <label htmlFor={id} style={{ fontWeight: 500 }}>{label}</label>
      <input id={id} type="checkbox" defaultChecked={enabled} aria-label={`Toggle ${label}`} />
      <span style={{ fontSize: "0.8rem", color: enabled ? "#22c55e" : "#ef4444" }}>
        {enabled ? "Enabled" : "Disabled"}
      </span>
    </div>
  );
}

function FilterBar({ placeholder }: { placeholder?: string }) {
  return (
    <div style={{ marginBottom: "0.5rem" }}>
      <input type="search" placeholder={placeholder || "Search by role, status, date..."} style={{ width: "100%", padding: "0.5rem", border: "1px solid #ddd", borderRadius: 4 }} aria-label="Filter table" />
    </div>
  );
}

function Pagination() {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1rem" }}>
      <button aria-label="Previous page" style={{ padding: "0.4rem 0.8rem", border: "1px solid #ddd", borderRadius: 4, cursor: "pointer" }}>Prev</button>
      <span style={{ padding: "0.4rem 0.8rem", background: "#3b82f6", color: "#fff", borderRadius: 4 }}>1</span>
      <button aria-label="Next page" style={{ padding: "0.4rem 0.8rem", border: "1px solid #ddd", borderRadius: 4, cursor: "pointer" }}>Next</button>
    </div>
  );
}