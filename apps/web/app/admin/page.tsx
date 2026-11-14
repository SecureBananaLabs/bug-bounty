"use client";

import { useEffect, useState } from "react";
import { adminApi } from "../../lib/adminApi";

const EMPTY_STATE: Record<string, string> = {
  users: "No users found.",
  jobs: "No flagged listings.",
  disputes: "No disputes found.",
  audit: "No audit log entries.",
  trust: "No trust data."
};

function Modal({ title, open, onClose, children }: { title: string; open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal" style={{ background: "#0f1532", border: "1px solid #2a3765", borderRadius: 12, padding: 16, maxWidth: 480, width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 id="modal-title">{title}</h3>
          <button onClick={onClose} aria-label="Close dialog" style={{ background: "transparent", color: "#cbd5ff", border: "none", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Loading() {
  return <div className="card" role="status" aria-live="polite">Loading...</div>;
}

function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card" role="alert" style={{ borderColor: "#ff5c5c" }}>
      <p>{message}</p>
      {onRetry && <button onClick={onRetry} style={{ marginTop: 8 }}>Retry</button>}
    </div>
  );
}

export default function AdminPanelPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [admin, setAdmin] = useState<{ sub: string; role: string; email?: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  const [metrics, setMetrics] = useState<{ totalUsers: number; activeJobs: number; openDisputes: number; flaggedListings: number; revenue: number } | null>(null);
  const [users, setUsers] = useState<{ items: any[]; total: number; page: number; pageSize: number } | null>(null);
  const [flaggedJobs, setFlaggedJobs] = useState<{ items: any[]; total: number } | null>(null);
  const [disputes, setDisputes] = useState<{ items: any[]; total: number } | null>(null);
  const [trust, setTrust] = useState<{ label: string; count: number }[] | null>(null);
  const [controls, setControls] = useState<{ registrationsEnabled: boolean; jobPostingsEnabled: boolean } | null>(null);
  const [auditLog, setAuditLog] = useState<any[] | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  function loadSection(tab: string) {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    Promise.allSettled([loadTab(tab)]).then(([result]) => {
      if (result.status === "rejected") setError(result.reason?.message || "Failed to load data");
      setLoading(false);
    });
  }

  async function loadTab(tab: string) {
    switch (tab) {
      case "dashboard":
        setMetrics(await adminApi.getMetrics());
        setTrust(await adminApi.getTrustDistribution());
        break;
      case "users":
        setUsers(await adminApi.listUsers({ page: 1, pageSize: 10 }));
        break;
      case "jobs":
        setFlaggedJobs(await adminApi.listFlaggedJobs({ page: 1, pageSize: 10 }));
        break;
      case "disputes":
        setDisputes(await adminApi.listDisputes({ page: 1, pageSize: 10 }));
        break;
      case "controls":
        setControls(await adminApi.getControls());
        break;
      case "audit":
        setAuditLog(await adminApi.listAuditLog({}));
        break;
      default:
        break;
    }
  }

  useEffect(() => {
    const stored = window.localStorage.getItem("adminToken");
    if (stored) {
      try {
        const encoded = stored.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "=")));
        if (payload.role !== "ADMIN") throw new Error("Forbidden");
        setAccessToken(stored);
        setAdmin(payload);
      } catch {
        window.localStorage.removeItem("adminToken");
        document.cookie = "adminToken=; Path=/; Max-Age=0; SameSite=Strict";
        window.location.replace("/admin/login?error=403");
      }
    }
  }, []);

  useEffect(() => {
    if (admin?.role !== "ADMIN") return;
    setLoading(true);
    Promise.all([loadTab(activeTab)]).finally(() => setLoading(false));
  }, [admin, activeTab]);

  if (!admin) return <Loading />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2>Admin Panel</h2>
        <div>
          <span style={{ color: "#a9b1d6", marginRight: 12 }}>{admin.email || "admin@example.com"}</span>
          <button onClick={() => { window.localStorage.removeItem("adminToken"); document.cookie = "adminToken=; Path=/; Max-Age=0; SameSite=Strict"; window.location.replace("/admin/login"); }} style={{ padding: "0.45rem 0.7rem", borderRadius: 8, background: "#2a3765", color: "#f2f5ff", border: "none", cursor: "pointer" }}>Sign out</button>
        </div>
      </div>

      <nav aria-label="Admin sections" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {["dashboard", "users", "jobs", "disputes", "controls", "audit"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} aria-current={activeTab === tab ? "page" : undefined} style={{ padding: "0.45rem 0.7rem", borderRadius: 8, background: activeTab === tab ? "#2a3765" : "transparent", color: "#f2f5ff", border: "1px solid #2a3765", cursor: "pointer" }}>
            {tab.toUpperCase()}
          </button>
        ))}
      </nav>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button onClick={() => loadSection(activeTab)} style={{ padding: "0.45rem 0.7rem", borderRadius: 8, background: "#2a3765", color: "#f2f5ff", border: "none", cursor: "pointer" }}>Refresh</button>
      </div>

      {error && <ErrorMessage message={error} onRetry={() => loadSection(activeTab)} />}

      {loading && <Loading />}

      {!loading && activeTab === "dashboard" && (
        <section aria-labelledby="dashboard-title">
          <h3 id="dashboard-title">Trust & Metrics</h3>
          {metrics && (
            <div className="grid">
              <SummaryCard label="Total Users" value={metrics.totalUsers} />
              <SummaryCard label="Active Jobs" value={metrics.activeJobs} />
              <SummaryCard label="Open Disputes" value={metrics.openDisputes} />
              <SummaryCard label="Flagged Listings" value={metrics.flaggedListings} />
              <SummaryCard label="Revenue (current period)" value={`$${metrics.revenue.toLocaleString()}`} />
            </div>
          )}
          {trust && (
            <div className="card" style={{ marginTop: 16 }}>
              <h4>Trust Score Distribution</h4>
              <TrustChart data={trust} />
            </div>
          )}
        </section>
      )}

      {!loading && activeTab === "users" && (
        <section aria-labelledby="users-title">
          <h3 id="users-title">User Management</h3>
          <UserToolbar onSearch={async (q) => setUsers(await adminApi.listUsers({ page: 1, pageSize: 10, search: q }))} />
          <UserTable users={users} onSelect={(u) => setSelectedUser(u)} />
          <UserProfileModal user={selectedUser} onClose={() => setSelectedUser(null)} onRefresh={async () => setUsers(await adminApi.listUsers({ page: 1, pageSize: 10 }))} />
        </section>
      )}

      {!loading && activeTab === "jobs" && (
        <section aria-labelledby="jobs-title">
          <h3 id="jobs-title">Moderation Queue</h3>
          <ModerationTable jobs={flaggedJobs} onModerate={async (id, decision) => { await adminApi.moderateJob(id, decision); setFlaggedJobs(await adminApi.listFlaggedJobs({ page: 1, pageSize: 10 })); }} />
        </section>
      )}

      {!loading && activeTab === "disputes" && (
        <section aria-labelledby="disputes-title">
          <h3 id="disputes-title">Dispute Resolution</h3>
          <DisputesTable disputes={disputes} onSelect={async (d) => { setSelectedDispute(await adminApi.getDispute(d.id)); }} />
          <DisputeModal dispute={selectedDispute} onClose={() => setSelectedDispute(null)} onRuling={async (id, ruling) => { await adminApi.ruleDispute(id, ruling); setDisputes(await adminApi.listDisputes({ page: 1, pageSize: 10 })); }} />
        </section>
      )}

      {!loading && activeTab === "controls" && controls && (
        <section aria-labelledby="controls-title">
          <h3 id="controls-title">Platform Controls</h3>
          <ControlToggle label="New user registrations" enabled={controls.registrationsEnabled} onChange={async (enabled) => { setConfirmAction({ title: "Toggle registrations", message: enabled ? "Enable new user registrations?" : "Disable new user registrations?", onConfirm: async () => { setControls(await adminApi.updateControl("registrations", enabled)); setConfirmAction(null); } }); }} />
          <ControlToggle label="New job postings" enabled={controls.jobPostingsEnabled} onChange={async (enabled) => { setConfirmAction({ title: "Toggle job postings", message: enabled ? "Enable new job postings?" : "Disable new job postings?", onConfirm: async () => { setControls(await adminApi.updateControl("job_postings", enabled)); setConfirmAction(null); } }); }} />
        </section>
      )}

      {!loading && activeTab === "audit" && (
        <section aria-labelledby="audit-title">
          <h3 id="audit-title">Audit Log</h3>
          <AuditTable entries={auditLog} />
        </section>
      )}

      <Modal title={confirmAction?.title || ""} open={!!confirmAction} onClose={() => setConfirmAction(null)}>
        <p>{confirmAction?.message}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
          <button onClick={() => setConfirmAction(null)} style={{ padding: "0.45rem 0.7rem", borderRadius: 8, background: "transparent", color: "#f2f5ff", border: "1px solid #2a3765", cursor: "pointer" }}>Cancel</button>
          <button onClick={confirmAction?.onConfirm} style={{ padding: "0.45rem 0.7rem", borderRadius: 8, background: "#2a3765", color: "#f2f5ff", border: "none", cursor: "pointer" }}>Confirm</button>
        </div>
      </Modal>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ color: "#a9b1d6", fontSize: 14 }}>{label}</span>
      <span style={{ fontSize: 24, fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function TrustChart({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div aria-label="Trust score distribution" style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 180, marginTop: 12 }}>
      {data.map((bin) => (
        <div key={bin.label} style={{ flex: 1, textAlign: "center" }}>
          <div style={{ height: Math.max((bin.count / max) * 140, 4), background: "#2a3765", borderRadius: 6, marginBottom: 6 }} />
          <div style={{ fontSize: 12, color: "#a9b1d6" }}>{bin.label}</div>
          <div style={{ fontSize: 12 }}>{bin.count}</div>
        </div>
      ))}
    </div>
  );
}

function UserToolbar({ onSearch }: { onSearch: (q: string) => void }) {
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  return (
    <div className="card" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
      <input aria-label="Search users" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users..." style={{ padding: "0.5rem 0.7rem", borderRadius: 8, border: "1px solid #2a3765", background: "#0f1532", color: "#f2f5ff", minWidth: 200 }} />
      <select aria-label="Filter by role" value={role} onChange={(e) => setRole(e.target.value)} style={{ padding: "0.5rem 0.7rem", borderRadius: 8, border: "1px solid #2a3765", background: "#0f1532", color: "#f2f5ff" }}>
        <option value="">All roles</option>
        <option value="CLIENT">CLIENT</option>
        <option value="FREELANCER">FREELANCER</option>
        <option value="ADMIN">ADMIN</option>
      </select>
      <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: "0.5rem 0.7rem", borderRadius: 8, border: "1px solid #2a3765", background: "#0f1532", color: "#f2f5ff" }}>
        <option value="">All statuses</option>
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
        <option value="banned">Banned</option>
      </select>
      <button onClick={() => onSearch(q)} style={{ padding: "0.5rem 0.7rem", borderRadius: 8, background: "#2a3765", color: "#f2f5ff", border: "none", cursor: "pointer" }}>Apply</button>
    </div>
  );
}

function UserTable({ users, onSelect }: { users: any; onSelect: (u: any) => void }) {
  const items = users?.items || [];
  if (!items.length) return <div className="card">{EMPTY_STATE.users}</div>;
  return (
    <div className="card" style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Name</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Email</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Role</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Status</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Trust</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Joined</th>
          </tr>
        </thead>
        <tbody>
          {items.map((u: any) => (
            <tr key={u.id} style={{ borderTop: "1px solid #2a3765", cursor: "pointer" }} onClick={() => onSelect(u)}>
              <td style={{ padding: "0.5rem" }}>{u.fullName}</td>
              <td style={{ padding: "0.5rem" }}>{u.email}</td>
              <td style={{ padding: "0.5rem" }}>{u.role}</td>
              <td style={{ padding: "0.5rem" }}>{u.status}</td>
              <td style={{ padding: "0.5rem" }}>{u.trustScore}</td>
              <td style={{ padding: "0.5rem" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UserProfileModal({ user, onClose, onRefresh }: { user: any; onClose: () => void; onRefresh: () => void }) {
  const [action, setAction] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  if (!user) return null;
  return (
    <Modal title={`${user.fullName} profile`} open={!!user} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>Status:</strong> {user.status}</p>
        <p><strong>Trust:</strong> {user.trustScore}</p>
        <div>
          <strong>Active jobs:</strong>
          {user.jobs?.length ? (
            <ul>
              {user.jobs.map((job: any) => (
                <li key={job.id}>{job.title}</li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "#a9b1d6" }}>None</p>
          )}
        </div>
        <div>
          <strong>Disputes:</strong>
          {user.disputes?.length ? (
            <ul>
              {user.disputes.map((d: any) => (
                <li key={d.id}>{d.id} - {d.status}</li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "#a9b1d6" }}>None</p>
          )}
        </div>
        {error && <p role="alert" style={{ color: "#ff8a8a" }}>{error}</p>}
        <label style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
          <span>Admin action</span>
          <select aria-label="Admin action" value={action} onChange={(e) => setAction(e.target.value)} style={{ padding: "0.5rem 0.7rem", borderRadius: 8, border: "1px solid #2a3765", background: "#0f1532", color: "#f2f5ff" }}>
            <option value="">Select action</option>
            <option value="suspend">Suspend</option>
            <option value="reinstate">Reinstate</option>
            <option value="ban">Ban</option>
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span>Reason</span>
          <input aria-label="Action reason" value={reason} onChange={(e) => setReason(e.target.value)} style={{ padding: "0.5rem 0.7rem", borderRadius: 8, border: "1px solid #2a3765", background: "#0f1532", color: "#f2f5ff" }} />
        </label>
        <button
          disabled={!action}
          onClick={async () => {
            setError(null);
            try {
              await adminApi.updateUserStatus(user.id, { action, reason });
              onRefresh();
              onClose();
            } catch (err: any) {
              setError(err.message);
            }
          }}
          style={{ padding: "0.5rem 0.7rem", borderRadius: 8, background: "#2a3765", color: "#f2f5ff", border: "none", cursor: "pointer" }}
        >
          Apply
        </button>
      </div>
    </Modal>
  );
}

function ModerationTable({ jobs, onModerate }: { jobs: any; onModerate: (id: string, decision: string) => void }) {
  const items = jobs?.items || [];
  if (!items.length) return <div className="card">{EMPTY_STATE.jobs}</div>;
  return (
    <div className="card" style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>ID</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Title</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Reason</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Decision</th>
          </tr>
        </thead>
        <tbody>
          {items.map((job: any) => (
            <tr key={job.id} style={{ borderTop: "1px solid #2a3765" }}>
              <td style={{ padding: "0.5rem" }}>{job.id}</td>
              <td style={{ padding: "0.5rem" }}>{job.title}</td>
              <td style={{ padding: "0.5rem" }}>{job.flagReason}</td>
              <td style={{ padding: "0.5rem" }}>
                <select aria-label={`Decision for ${job.id}`} defaultValue="" onChange={(e) => { if (e.target.value) onModerate(job.id, e.target.value); }} style={{ padding: "0.35rem 0.6rem", borderRadius: 8, border: "1px solid #2a3765", background: "#0f1532", color: "#f2f5ff" }}>
                  <option value="" disabled>Action</option>
                  <option value="approved">Approve</option>
                  <option value="rejected">Reject</option>
                  <option value="escalated">Escalate</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DisputesTable({ disputes, onSelect }: { disputes: any; onSelect: (d: any) => void }) {
  const items = disputes?.items || [];
  if (!items.length) return <div className="card">{EMPTY_STATE.disputes}</div>;
  return (
    <div className="card" style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>ID</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Job</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Status</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((d: any) => (
            <tr key={d.id} style={{ borderTop: "1px solid #2a3765", cursor: "pointer" }} onClick={() => onSelect(d)}>
              <td style={{ padding: "0.5rem" }}>{d.id}</td>
              <td style={{ padding: "0.5rem" }}>{d.jobId}</td>
              <td style={{ padding: "0.5rem" }}>{d.status}</td>
              <td style={{ padding: "0.5rem" }}>${d.transactionAmount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DisputeModal({ dispute, onClose, onRuling }: { dispute: any; onClose: () => void; onRuling: (id: string, ruling: string) => void }) {
  const [ruling, setRuling] = useState("");
  const [error, setError] = useState<string | null>(null);
  if (!dispute) return null;
  return (
    <Modal title={`Dispute ${dispute.id}`} open={!!dispute} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <p><strong>Status:</strong> {dispute.status}</p>
        <p><strong>Amount:</strong> ${dispute.transactionAmount}</p>
        <p><strong>Evidence:</strong> {dispute.evidence?.length ? dispute.evidence.join(", ") : "None"}</p>
        <div>
          <strong>Thread</strong>
          {dispute.thread?.length ? (
            <ul>
              {dispute.thread.map((item: any, idx: number) => (
                <li key={idx}><em>{item.author}:</em> {item.message}</li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "#a9b1d6" }}>No messages.</p>
          )}
        </div>
        {error && <p role="alert" style={{ color: "#ff8a8a" }}>{error}</p>}
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span>Ruling</span>
          <select aria-label="Dispute ruling" value={ruling} onChange={(e) => setRuling(e.target.value)} style={{ padding: "0.5rem 0.7rem", borderRadius: 8, border: "1px solid #2a3765", background: "#0f1532", color: "#f2f5ff" }}>
            <option value="">Select ruling</option>
            <option value="freelancer">Favour freelancer</option>
            <option value="client">Favour client</option>
            <option value="refund">Trigger refund</option>
            <option value="escalate">Escalate</option>
          </select>
        </label>
        <button disabled={!ruling} onClick={async () => { setError(null); try { onRuling(dispute.id, ruling); onClose(); } catch (err: any) { setError(err.message); } }} style={{ padding: "0.5rem 0.7rem", borderRadius: 8, background: "#2a3765", color: "#f2f5ff", border: "none", cursor: "pointer" }}>
          Submit ruling
        </button>
      </div>
    </Modal>
  );
}

function ControlToggle({ label, enabled, onChange }: { label: string; enabled: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span>{label}</span>
      <button onClick={() => onChange(!enabled)} aria-pressed={enabled} style={{ padding: "0.45rem 0.7rem", borderRadius: 8, background: enabled ? "#2a3765" : "transparent", color: "#f2f5ff", border: "1px solid #2a3765", cursor: "pointer" }}>
        {enabled ? "Enabled" : "Disabled"}
      </button>
    </div>
  );
}

function AuditTable({ entries }: { entries: any[] | null }) {
  if (!entries) return <div className="card">{EMPTY_STATE.audit}</div>;
  if (!entries.length) return <div className="card">{EMPTY_STATE.audit}</div>;
  return (
    <div className="card" style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Time</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Admin</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Action</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Target</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} style={{ borderTop: "1px solid #2a3765" }}>
              <td style={{ padding: "0.5rem" }}>{new Date(entry.timestamp).toLocaleString()}</td>
              <td style={{ padding: "0.5rem" }}>{entry.adminId}</td>
              <td style={{ padding: "0.5rem" }}>{entry.action}</td>
              <td style={{ padding: "0.5rem" }}>{entry.targetId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
