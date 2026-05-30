'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ─────────────────────────────────────────────────

type Tab = 'dashboard' | 'users' | 'jobs' | 'disputes' | 'audit' | 'settings';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  adminStatus: string;
  joined?: string;
  jobsPosted?: number;
  earnings?: string;
}

interface Job {
  id: string;
  title: string;
  postedBy?: string;
  budget?: string;
  status: string;
  proposals?: number;
  posted?: string;
}

interface Dispute {
  id: string;
  jobId: string;
  jobTitle: string;
  status: string;
  reason: string;
  openedAt: string;
  thread: { author: string; message: string; timestamp: string }[];
  resolution?: { ruling: string; refund?: boolean; resolvedBy: string; resolvedAt: string; notes?: string };
}

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  adminId: string;
  details: Record<string, unknown>;
}

interface Metrics {
  totalUsers: number;
  activeFreelancers: number;
  openJobs: number;
  activeJobs: number;
  monthlyVolume: string;
  flaggedAccounts: number;
  pendingDisputes: number;
  newToday: number;
  totalReviews: number;
  unreadNotifications: number;
}

interface PaginatedResponse<T> {
  total: number;
  page: number;
  totalPages: number;
  [key: string]: unknown;
}

interface ConfirmState {
  title: string;
  message: string;
  onConfirm: () => void;
  variant?: 'danger' | 'warning';
}

// ─── API Helper ────────────────────────────────────────────

const API_BASE = typeof window !== 'undefined' ? window.location.origin : '';
const ADMIN_API = `${API_BASE}/api/admin`;

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${ADMIN_API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Request failed');
  return data.data as T;
}

// ─── Helpers ───────────────────────────────────────────────

function formatTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function badgeClass(status: string): string {
  const map: Record<string, string> = {
    active: 'admin-badge-green',
    suspended: 'admin-badge-red',
    banned: 'admin-badge-red',
    flagged: 'admin-badge-yellow',
    open: 'admin-badge-green',
    'in-progress': 'admin-badge-blue',
    completed: 'admin-badge-gray',
    disputed: 'admin-badge-red',
    rejected: 'admin-badge-red',
    escalated: 'admin-badge-yellow',
    freelancer: 'admin-badge-green',
    client: 'admin-badge-yellow',
    admin: 'admin-badge-blue',
    under_review: 'admin-badge-yellow',
    resolved: 'admin-badge-gray',
  };
  return map[status] || 'admin-badge-gray';
}

function ActionButton({ label, onClick, variant = 'primary', ariaLabel }: {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'danger' | 'success' | 'ghost';
  ariaLabel?: string;
}) {
  const cls = `admin-btn admin-btn-${variant} admin-btn-lg`;
  return (
    <button className={cls} onClick={onClick} aria-label={ariaLabel || label}>
      {label}
    </button>
  );
}

// ─── Pagination ────────────────────────────────────────────

function Pagination({ page, totalPages, onPage, label }: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
  label: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="admin-pagination" role="navigation" aria-label={`${label} pagination`}>
      <button disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
        ← Prev
      </button>
      <span>Page {page} of {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Next page">
        Next →
      </button>
    </div>
  );
}

// ─── Confirm Dialog ────────────────────────────────────────

function ConfirmDialog({ state, onClose }: { state: ConfirmState | null; onClose: () => void }) {
  if (!state) return null;
  return (
    <div className="admin-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={onClose}>
      <div className="admin-confirm-dialog" onClick={e => e.stopPropagation()}>
        <h3 id="confirm-title">{state.title}</h3>
        <p>{state.message}</p>
        <div className="admin-confirm-actions">
          <button className="admin-btn admin-btn-ghost admin-btn-lg" onClick={onClose}>Cancel</button>
          <button
            className={`admin-btn ${state.variant === 'danger' ? 'admin-btn-danger' : 'admin-btn-primary'} admin-btn-lg`}
            onClick={() => { state.onConfirm(); onClose(); }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  // Data states
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState('');

  // Users
  const [users, setUsers] = useState<User[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersPages, setUsersPages] = useState(1);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [usersSearch, setUsersSearch] = useState('');
  const [usersRoleFilter, setUsersRoleFilter] = useState('');
  const [usersStatusFilter, setUsersStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Jobs
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsTotal, setJobsTotal] = useState(0);
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsPages, setJobsPages] = useState(1);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState('');
  const [jobsSearch, setJobsSearch] = useState('');
  const [jobsStatusFilter, setJobsStatusFilter] = useState('');
  const [jobsFlaggedOnly, setJobsFlaggedOnly] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Disputes
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [disputesTotal, setDisputesTotal] = useState(0);
  const [disputesPage, setDisputesPage] = useState(1);
  const [disputesPages, setDisputesPages] = useState(1);
  const [disputesLoading, setDisputesLoading] = useState(false);
  const [disputesError, setDisputesError] = useState('');
  const [disputesFilter, setDisputesFilter] = useState('');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [disputeNote, setDisputeNote] = useState('');

  // Audit
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPages, setAuditPages] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');

  // Settings
  const [settings, setSettings] = useState<{ registrationsOpen: boolean; jobPostingOpen: boolean } | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  // ─── Data Fetching ───────────────────────────────────────

  const fetchMetrics = useCallback(async () => {
    setMetricsLoading(true);
    setMetricsError('');
    try {
      const data = await apiFetch<Metrics>('/metrics');
      setMetrics(data);
    } catch (err) {
      setMetricsError((err as Error).message);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async (page: number, search: string, role: string, status: string) => {
    setUsersLoading(true);
    setUsersError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (role) params.set('role', role);
      if (status) params.set('status', status);
      const data = await apiFetch<PaginatedResponse<User>>(`/users?${params}`);
      setUsers((data as unknown as { users: User[] }).users || []);
      setUsersTotal(data.total);
      setUsersPage(data.page);
      setUsersPages(data.totalPages);
    } catch (err) {
      setUsersError((err as Error).message);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const fetchJobs = useCallback(async (page: number, search: string, status: string, flaggedOnly: boolean) => {
    setJobsLoading(true);
    setJobsError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (flaggedOnly) params.set('flagged', 'true');
      const data = await apiFetch<PaginatedResponse<Job>>(`/jobs?${params}`);
      setJobs((data as unknown as { jobs: Job[] }).jobs || []);
      setJobsTotal(data.total);
      setJobsPage(data.page);
      setJobsPages(data.totalPages);
    } catch (err) {
      setJobsError((err as Error).message);
    } finally {
      setJobsLoading(false);
    }
  }, []);

  const fetchDisputes = useCallback(async (page: number, status: string) => {
    setDisputesLoading(true);
    setDisputesError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (status) params.set('status', status);
      const data = await apiFetch<PaginatedResponse<Dispute>>(`/disputes?${params}`);
      setDisputes((data as unknown as { disputes: Dispute[] }).disputes || []);
      setDisputesTotal(data.total);
      setDisputesPage(data.page);
      setDisputesPages(data.totalPages);
    } catch (err) {
      setDisputesError((err as Error).message);
    } finally {
      setDisputesLoading(false);
    }
  }, []);

  const fetchAudit = useCallback(async (page: number) => {
    setAuditLoading(true);
    setAuditError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      const data = await apiFetch<PaginatedResponse<AuditEntry>>(`/audit-log?${params}`);
      setAuditEntries((data as unknown as { entries: AuditEntry[] }).entries || []);
      setAuditTotal(data.total);
      setAuditPage(data.page);
      setAuditPages(data.totalPages);
    } catch (err) {
      setAuditError((err as Error).message);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    setSettingsError('');
    try {
      const data = await apiFetch<{ registrationsOpen: boolean; jobPostingOpen: boolean }>('/settings');
      setSettings(data);
    } catch (err) {
      setSettingsError((err as Error).message);
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  // ─── Auto-fetch on tab change ────────────────────────────

  useEffect(() => {
    if (activeTab === 'dashboard') fetchMetrics();
    else if (activeTab === 'users') fetchUsers(usersPage, usersSearch, usersRoleFilter, usersStatusFilter);
    else if (activeTab === 'jobs') fetchJobs(jobsPage, jobsSearch, jobsStatusFilter, jobsFlaggedOnly);
    else if (activeTab === 'disputes') fetchDisputes(disputesPage, disputesFilter);
    else if (activeTab === 'audit') fetchAudit(auditPage);
    else if (activeTab === 'settings') fetchSettings();
  }, [activeTab]);

  // ─── Actions ─────────────────────────────────────────────

  const applyUserAction = async (userId: string, action: 'suspend' | 'reinstate' | 'ban') => {
    try {
      await apiFetch(`/users/${userId}/${action}`, { method: 'POST' });
      fetchUsers(usersPage, usersSearch, usersRoleFilter, usersStatusFilter);
      setSelectedUser(null);
    } catch (err) {
      alert(`Failed to ${action} user: ${(err as Error).message}`);
    }
  };

  const applyJobAction = async (jobId: string, action: 'approve' | 'reject' | 'escalate') => {
    try {
      const body = action === 'reject' ? { reason: 'Violates platform policy' } : undefined;
      await apiFetch(`/jobs/${jobId}/${action}`, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
      fetchJobs(jobsPage, jobsSearch, jobsStatusFilter, jobsFlaggedOnly);
      setSelectedJob(null);
    } catch (err) {
      alert(`Failed to ${action} job: ${(err as Error).message}`);
    }
  };

  const applyDisputeAction = async (disputeId: string, action: 'resolve' | 'escalate', ruling?: string) => {
    try {
      const body = action === 'resolve' ? { favor: ruling || 'split', refund: false, notes: '' } : undefined;
      await apiFetch(`/disputes/${disputeId}/${action}`, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
      fetchDisputes(disputesPage, disputesFilter);
      setSelectedDispute(null);
    } catch (err) {
      alert(`Failed to ${action} dispute: ${(err as Error).message}`);
    }
  };

  const addDisputeNote = async (disputeId: string) => {
    if (!disputeNote.trim()) return;
    try {
      await apiFetch(`/disputes/${disputeId}/note`, {
        method: 'POST',
        body: JSON.stringify({ note: disputeNote }),
      });
      setDisputeNote('');
      fetchDisputes(disputesPage, disputesFilter);
    } catch (err) {
      alert(`Failed to add note: ${(err as Error).message}`);
    }
  };

  const toggleSetting = async (setting: 'registrations' | 'job-posting') => {
    try {
      await apiFetch(`/settings/toggle-${setting}`, { method: 'POST' });
      fetchSettings();
    } catch (err) {
      alert(`Failed to toggle: ${(err as Error).message}`);
    }
  };

  // ─── Tab labels ──────────────────────────────────────────

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'users', label: 'Users', icon: '👥' },
    { key: 'jobs', label: 'Jobs', icon: '💼' },
    { key: 'disputes', label: 'Disputes', icon: '⚖️' },
    { key: 'audit', label: 'Audit Log', icon: '📋' },
    { key: 'settings', label: 'Controls', icon: '⚙️' },
  ];

  // ─── Render: Dashboard ───────────────────────────────────

  const renderDashboard = () => {
    if (metricsLoading) return <div className="admin-loading" role="status" aria-label="Loading metrics">Loading dashboard data…</div>;
    if (metricsError) return <div className="admin-error" role="alert">Failed to load metrics: {metricsError}</div>;
    if (!metrics) return <div className="admin-empty">No data available</div>;

    const metricItems = [
      { value: metrics.totalUsers.toLocaleString(), label: 'Total Users' },
      { value: metrics.activeFreelancers.toString(), label: 'Active Freelancers' },
      { value: metrics.openJobs.toString(), label: 'Open Jobs' },
      { value: metrics.activeJobs.toString(), label: 'Active Jobs' },
      { value: metrics.monthlyVolume, label: 'Monthly Volume' },
      { value: metrics.flaggedAccounts.toString(), label: 'Flagged Accounts' },
      { value: metrics.pendingDisputes.toString(), label: 'Pending Disputes' },
      { value: metrics.newToday.toString(), label: 'New Today' },
    ];

    return (
      <>
        <div className="admin-metrics-grid" role="region" aria-label="Dashboard metrics">
          {metricItems.map((m, i) => (
            <div key={i} className="admin-metric-card">
              <div className="admin-metric-value">{m.value}</div>
              <div className="admin-metric-label">{m.label}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          <button className="admin-btn admin-btn-primary admin-btn-lg" onClick={fetchMetrics} aria-label="Refresh dashboard data">
            🔄 Refresh
          </button>
        </div>
      </>
    );
  };

  // ─── Render: Users ────────────────────────────────────────

  const renderUsers = () => {
    const doSearch = () => {
      setUsersPage(1);
      fetchUsers(1, usersSearch, usersRoleFilter, usersStatusFilter);
    };

    return (
      <div>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="admin-input"
            placeholder="Search by name, email, ID…"
            value={usersSearch}
            onChange={e => setUsersSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
            aria-label="Search users"
          />
          <select className="admin-select" value={usersRoleFilter} onChange={e => { setUsersRoleFilter(e.target.value); setUsersPage(1); fetchUsers(1, usersSearch, e.target.value, usersStatusFilter); }} aria-label="Filter by role">
            <option value="">All Roles</option>
            <option value="freelancer">Freelancer</option>
            <option value="client">Client</option>
            <option value="admin">Admin</option>
          </select>
          <select className="admin-select" value={usersStatusFilter} onChange={e => { setUsersStatusFilter(e.target.value); setUsersPage(1); fetchUsers(1, usersSearch, usersRoleFilter, e.target.value); }} aria-label="Filter by status">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
          <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={doSearch}>Search</button>
        </div>

        {usersLoading && <div className="admin-loading" role="status">Loading users…</div>}
        {usersError && <div className="admin-error" role="alert">{usersError}</div>}

        {!usersLoading && !usersError && users.length === 0 && (
          <div className="admin-empty">No users found{usersSearch ? ' matching your search' : ''}.</div>
        )}

        {users.length > 0 && (
          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="admin-table" role="table" aria-label="User management">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} onClick={() => setSelectedUser(u)} aria-label={`View details for ${u.name}`}>
                    <td>{u.name || u.id}</td>
                    <td>{u.email || '—'}</td>
                    <td><span className={`admin-badge ${badgeClass(u.role)}`}>{u.role}</span></td>
                    <td><span className={`admin-badge ${badgeClass(u.adminStatus)}`}>{u.adminStatus}</span></td>
                    <td>{u.joined ? formatDate(u.joined) : '—'}</td>
                    <td>
                      <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={(e) => { e.stopPropagation(); setSelectedUser(u); }} aria-label={`View ${u.name}`}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={usersPage} totalPages={usersPages} onPage={p => fetchUsers(p, usersSearch, usersRoleFilter, usersStatusFilter)} label="Users" />
          </div>
        )}

        {/* User Detail Panel */}
        {selectedUser && (
          <div className="card" style={{ marginTop: '1rem' }} role="region" aria-label={`User detail: ${selectedUser.name}`}>
            <div className="admin-detail-header">
              <h3 className="admin-detail-title">User: {selectedUser.name}</h3>
              <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setSelectedUser(null)} aria-label="Close user detail">Close</button>
            </div>
            <table className="admin-table">
              <tbody>
                {[
                  ['ID', selectedUser.id],
                  ['Email', selectedUser.email || '—'],
                  ['Role', selectedUser.role],
                  ['Status', selectedUser.adminStatus],
                  ['Joined', selectedUser.joined ? formatDate(selectedUser.joined) : '—'],
                  ['Jobs Posted', String(selectedUser.jobsPosted ?? '—')],
                  ['Earnings', selectedUser.earnings || '—'],
                ].map(([k, v]) => (
                  <tr key={k}><td style={{ color: '#8a9bc0', width: '150px', padding: '0.5rem' }}>{k}</td><td style={{ padding: '0.5rem' }}>{v}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="admin-action-bar">
              {selectedUser.adminStatus !== 'suspended' && selectedUser.adminStatus !== 'banned' && (
                <ActionButton label="Suspend" variant="danger" onClick={() => setConfirm({ title: 'Suspend User', message: `Are you sure you want to suspend ${selectedUser.name}?`, onConfirm: () => applyUserAction(selectedUser.id, 'suspend'), variant: 'danger' })} />
              )}
              {selectedUser.adminStatus === 'suspended' && (
                <ActionButton label="Reinstate" variant="success" onClick={() => applyUserAction(selectedUser.id, 'reinstate')} />
              )}
              {selectedUser.adminStatus !== 'banned' && (
                <ActionButton label="Ban Permanently" variant="danger" onClick={() => setConfirm({ title: 'Ban User', message: `Permanently ban ${selectedUser.name}? This cannot be undone.`, onConfirm: () => applyUserAction(selectedUser.id, 'ban'), variant: 'danger' })} />
              )}
              <button className="admin-btn admin-btn-ghost admin-btn-lg" onClick={() => setSelectedUser(null)}>Close</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─── Render: Jobs ────────────────────────────────────────

  const renderJobs = () => {
    const doSearch = () => {
      setJobsPage(1);
      fetchJobs(1, jobsSearch, jobsStatusFilter, jobsFlaggedOnly);
    };

    return (
      <div>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="admin-input"
            placeholder="Search jobs…"
            value={jobsSearch}
            onChange={e => setJobsSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
            aria-label="Search jobs"
          />
          <select className="admin-select" value={jobsStatusFilter} onChange={e => { setJobsStatusFilter(e.target.value); setJobsPage(1); fetchJobs(1, jobsSearch, e.target.value, jobsFlaggedOnly); }} aria-label="Filter by status">
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="flagged">Flagged</option>
            <option value="disputed">Disputed</option>
            <option value="rejected">Rejected</option>
          </select>
          <label style={{ color: '#8a9bc0', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <input type="checkbox" checked={jobsFlaggedOnly} onChange={e => { setJobsFlaggedOnly(e.target.checked); setJobsPage(1); fetchJobs(1, jobsSearch, jobsStatusFilter, e.target.checked); }} />
            Flagged only
          </label>
          <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={doSearch}>Search</button>
        </div>

        {jobsLoading && <div className="admin-loading" role="status">Loading jobs…</div>}
        {jobsError && <div className="admin-error" role="alert">{jobsError}</div>}

        {!jobsLoading && !jobsError && jobs.length === 0 && (
          <div className="admin-empty">No jobs found.</div>
        )}

        {jobs.length > 0 && (
          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="admin-table" role="table" aria-label="Job management">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Posted By</th>
                  <th>Budget</th>
                  <th>Status</th>
                  <th>Proposals</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(j => (
                  <tr key={j.id} onClick={() => setSelectedJob(j)} aria-label={`Review ${j.title}`}>
                    <td>{j.title}</td>
                    <td>{j.postedBy || '—'}</td>
                    <td>{j.budget || '—'}</td>
                    <td><span className={`admin-badge ${badgeClass(j.status)}`}>{j.status}</span></td>
                    <td>{j.proposals ?? '—'}</td>
                    <td>
                      <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={(e) => { e.stopPropagation(); setSelectedJob(j); }} aria-label={`Review ${j.title}`}>
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={jobsPage} totalPages={jobsPages} onPage={p => fetchJobs(p, jobsSearch, jobsStatusFilter, jobsFlaggedOnly)} label="Jobs" />
          </div>
        )}

        {selectedJob && (
          <div className="card" style={{ marginTop: '1rem' }} role="region" aria-label={`Job detail: ${selectedJob.title}`}>
            <div className="admin-detail-header">
              <h3 className="admin-detail-title">Job: {selectedJob.title}</h3>
              <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setSelectedJob(null)} aria-label="Close job detail">Close</button>
            </div>
            <table className="admin-table">
              <tbody>
                {[
                  ['ID', selectedJob.id],
                  ['Posted By', selectedJob.postedBy || '—'],
                  ['Budget', selectedJob.budget || '—'],
                  ['Status', selectedJob.status],
                  ['Proposals', String(selectedJob.proposals ?? '—')],
                ].map(([k, v]) => (
                  <tr key={k}><td style={{ color: '#8a9bc0', width: '150px', padding: '0.5rem' }}>{k}</td><td style={{ padding: '0.5rem' }}>{v}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="admin-action-bar">
              {(selectedJob.status === 'flagged' || selectedJob.status === 'rejected') && (
                <ActionButton label="Approve" variant="success" onClick={() => applyJobAction(selectedJob.id, 'approve')} />
              )}
              {selectedJob.status !== 'rejected' && selectedJob.status !== 'completed' && (
                <ActionButton label="Reject" variant="danger" onClick={() => setConfirm({ title: 'Reject Job', message: `Reject "${selectedJob.title}"? The poster will be notified.`, onConfirm: () => applyJobAction(selectedJob.id, 'reject'), variant: 'danger' })} />
              )}
              {selectedJob.status === 'flagged' && (
                <ActionButton label="Escalate" variant="primary" onClick={() => applyJobAction(selectedJob.id, 'escalate')} />
              )}
              <button className="admin-btn admin-btn-ghost admin-btn-lg" onClick={() => setSelectedJob(null)}>Close</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─── Render: Disputes ────────────────────────────────────

  const renderDisputes = () => (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <select className="admin-select" value={disputesFilter} onChange={e => { setDisputesFilter(e.target.value); setDisputesPage(1); fetchDisputes(1, e.target.value); }} aria-label="Filter disputes">
          <option value="">All Disputes</option>
          <option value="open">Open</option>
          <option value="under_review">Under Review</option>
          <option value="resolved">Resolved</option>
          <option value="escalated">Escalated</option>
        </select>
      </div>

      {disputesLoading && <div className="admin-loading" role="status">Loading disputes…</div>}
      {disputesError && <div className="admin-error" role="alert">{disputesError}</div>}

      {!disputesLoading && !disputesError && disputes.length === 0 && (
        <div className="admin-empty">No disputes found.</div>
      )}

      {disputes.length > 0 && (
        <div className="card">
          {disputes.map(d => (
            <div key={d.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid #1a2240', cursor: 'pointer' }}
                 onClick={() => setSelectedDispute(selectedDispute?.id === d.id ? null : d)}
                 aria-label={`Dispute: ${d.jobTitle}`} role="button" tabIndex={0}
                 onKeyDown={e => e.key === 'Enter' && setSelectedDispute(selectedDispute?.id === d.id ? null : d)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#f2f5ff' }}>{d.jobTitle}</div>
                  <div style={{ color: '#8a9bc0', fontSize: '0.8125rem' }}>
                    {d.reason} — Opened {formatDate(d.openedAt)}
                  </div>
                </div>
                <span className={`admin-badge ${badgeClass(d.status)}`}>{d.status}</span>
              </div>

              {selectedDispute?.id === d.id && (
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#0d1320', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    <ActionButton label="Rule for Freelancer" variant="primary" onClick={() => setConfirm({ title: 'Resolve Dispute', message: `Rule in favor of the freelancer for "${d.jobTitle}"?`, onConfirm: () => applyDisputeAction(d.id, 'resolve', 'freelancer'), variant: 'warning' })} />
                    <ActionButton label="Rule for Client" variant="primary" onClick={() => setConfirm({ title: 'Resolve Dispute', message: `Rule in favor of the client for "${d.jobTitle}"?`, onConfirm: () => applyDisputeAction(d.id, 'resolve', 'client'), variant: 'warning' })} />
                    <ActionButton label="Split" variant="success" onClick={() => applyDisputeAction(d.id, 'resolve', 'split')} />
                    {d.status !== 'escalated' && (
                      <ActionButton label="Escalate" variant="danger" onClick={() => applyDisputeAction(d.id, 'escalate')} />
                    )}
                  </div>

                  {/* Dispute thread / notes */}
                  <div style={{ marginTop: '0.5rem' }}>
                    <h4 style={{ color: '#8a9bc0', fontSize: '0.8125rem', margin: '0 0 0.5rem' }}>Notes & Evidence</h4>
                    {d.thread?.map((entry, i) => (
                      <div key={i} style={{ fontSize: '0.8125rem', color: '#a0b0d0', padding: '0.3rem 0', borderBottom: '1px solid #1a2240' }}>
                        <span style={{ color: '#4a7cff', marginRight: '0.5rem' }}>{formatTime(entry.timestamp)}</span>
                        {entry.author}: {entry.message}
                      </div>
                    ))}
                    {(!d.thread || d.thread.length === 0) && (
                      <p style={{ color: '#5a6a90', fontSize: '0.8125rem' }}>No notes yet.</p>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <input className="admin-input" style={{ flex: 1, width: 'auto' }}
                             placeholder="Add a note…"
                             value={disputeNote}
                             onChange={e => setDisputeNote(e.target.value)}
                             aria-label="Add dispute note" />
                      <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => addDisputeNote(d.id)} disabled={!disputeNote.trim()}>Add Note</button>
                    </div>
                  </div>

                  {d.resolution && (
                    <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: '#151c35', borderRadius: '6px' }}>
                      <span style={{ color: '#22c55e', fontWeight: 600 }}>✅ Resolved</span>
                      <span style={{ color: '#8a9bc0', marginLeft: '0.5rem', fontSize: '0.8125rem' }}>
                        Ruling: {d.resolution.ruling} — by {d.resolution.resolvedAt ? formatDate(d.resolution.resolvedAt) : '—'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          <Pagination page={disputesPage} totalPages={disputesPages} onPage={p => fetchDisputes(p, disputesFilter)} label="Disputes" />
        </div>
      )}
    </div>
  );

  // ─── Render: Audit Log ───────────────────────────────────

  const renderAudit = () => {
    if (auditLoading) return <div className="admin-loading" role="status">Loading audit log…</div>;
    if (auditError) return <div className="admin-error" role="alert">{auditError}</div>;
    if (auditEntries.length === 0) return <div className="admin-empty">No audit entries yet.</div>;

    return (
      <div className="card">
        <div style={{ color: '#8a9bc0', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>
          {auditTotal} total entries — Page {auditPage} of {auditPages}
        </div>
        {auditEntries.map(e => (
          <div key={e.id} className="admin-log-entry" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <span className="admin-log-time" style={{ whiteSpace: 'nowrap', minWidth: '4.5rem' }}>{formatTime(e.timestamp)}</span>
            <span style={{ color: '#4a7cff', minWidth: '6rem', fontSize: '0.75rem', fontWeight: 600 }}>{e.action.replace(/_/g, ' ')}</span>
            <span style={{ color: '#8a9bc0', fontSize: '0.75rem', minWidth: '4rem' }}>by {e.adminId.slice(0, 8)}</span>
            <span style={{ color: '#a0b0d0', fontSize: '0.75rem' }}>{JSON.stringify(e.details)}</span>
          </div>
        ))}
        <Pagination page={auditPage} totalPages={auditPages} onPage={p => fetchAudit(p)} label="Audit log" />
      </div>
    );
  };

  // ─── Render: Settings / Platform Controls ────────────────

  const renderSettings = () => {
    if (settingsLoading) return <div className="admin-loading" role="status">Loading settings…</div>;
    if (settingsError) return <div className="admin-error" role="alert">{settingsError}</div>;
    if (!settings) return <div className="admin-empty">No settings available.</div>;

    return (
      <div className="card">
        <h3 style={{ color: '#f2f5ff', marginBottom: '1rem' }}>Platform Controls</h3>

        <div className="admin-toggle-row">
          <div>
            <div className="admin-toggle-label">New User Registrations</div>
            <div style={{ fontSize: '0.75rem', color: '#8a9bc0' }}>
              {settings.registrationsOpen ? 'Users can create new accounts' : 'Registration is disabled'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className={`admin-badge ${settings.registrationsOpen ? 'admin-badge-green' : 'admin-badge-red'}`}>
              {settings.registrationsOpen ? 'OPEN' : 'CLOSED'}
            </span>
            <button className={`admin-btn ${settings.registrationsOpen ? 'admin-btn-danger' : 'admin-btn-success'} admin-btn-sm`}
                    onClick={() => setConfirm({
                      title: `${settings.registrationsOpen ? 'Disable' : 'Enable'} Registrations`,
                      message: `Are you sure you want to ${settings.registrationsOpen ? 'disable' : 'enable'} new user registrations?`,
                      onConfirm: () => toggleSetting('registrations'),
                      variant: settings.registrationsOpen ? 'danger' : 'warning',
                    })}
                    aria-label="Toggle user registrations">
              {settings.registrationsOpen ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>

        <div className="admin-toggle-row">
          <div>
            <div className="admin-toggle-label">New Job Postings</div>
            <div style={{ fontSize: '0.75rem', color: '#8a9bc0' }}>
              {settings.jobPostingOpen ? 'Clients can post new jobs' : 'Job posting is disabled'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className={`admin-badge ${settings.jobPostingOpen ? 'admin-badge-green' : 'admin-badge-red'}`}>
              {settings.jobPostingOpen ? 'OPEN' : 'CLOSED'}
            </span>
            <button className={`admin-btn ${settings.jobPostingOpen ? 'admin-btn-danger' : 'admin-btn-success'} admin-btn-sm`}
                    onClick={() => setConfirm({
                      title: `${settings.jobPostingOpen ? 'Disable' : 'Enable'} Job Postings`,
                      message: `Are you sure you want to ${settings.jobPostingOpen ? 'disable' : 'enable'} new job postings?`,
                      onConfirm: () => toggleSetting('job-posting'),
                      variant: settings.jobPostingOpen ? 'danger' : 'warning',
                    })}
                    aria-label="Toggle job postings">
              {settings.jobPostingOpen ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Main Render ─────────────────────────────────────────

  return (
    <div className="admin-container">
      <h2 className="admin-header">🛠️ Admin Panel</h2>
      <p style={{ color: '#8a9bc0', marginBottom: '1rem', fontSize: '0.875rem' }}>
        Platform management, moderation, and system health — full admin controls.
      </p>

      <div className="admin-tabs" role="tablist" aria-label="Admin sections">
        {tabs.map(t => (
          <button
            key={t.key}
            role="tab"
            aria-selected={activeTab === t.key}
            className={`admin-tab${activeTab === t.key ? ' active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" aria-label={`${activeTab} section`}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'jobs' && renderJobs()}
        {activeTab === 'disputes' && renderDisputes()}
        {activeTab === 'audit' && renderAudit()}
        {activeTab === 'settings' && renderSettings()}
      </div>

      <ConfirmDialog state={confirm} onClose={() => setConfirm(null)} />
    </div>
  );
}
