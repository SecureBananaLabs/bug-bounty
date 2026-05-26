'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface AdminMetric {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

interface AdminJob {
  id: string;
  title: string;
  clientName: string;
  status: string;
  flagged: boolean;
  createdAt: string;
}

interface AdminDispute {
  id: string;
  jobId: string;
  raisedBy: string;
  reason: string;
  status: string;
  createdAt: string;
}

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [metrics, setMetrics] = useState<AdminMetric[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const api = useCallback(async (path: string, opts?: RequestInit) => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/admin' + path, {
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', ...opts?.headers },
      ...opts,
    });
    if (res.status === 403) { setError('Admin access required'); router.push('/403'); return null; }
    if (res.status === 401) { router.push('/login'); return null; }
    return res.json();
  }, [router]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api('/metrics').then(d => d?.data && setMetrics([
        { label: 'Users', value: d.data.totalUsers || 0, change: '+12%', trend: 'up' },
        { label: 'Open Jobs', value: d.data.openJobs || 0, change: '-3%', trend: 'down' },
        { label: 'Active Freelancers', value: d.data.activeFreelancers || 0, change: '+8%', trend: 'up' },
        { label: 'Disputes', value: d.data.openDisputes || 0, change: '+1', trend: 'neutral' },
        { label: 'Monthly Volume', value: '$' + ((d.data.monthlyVolume || 0) / 100).toLocaleString(), change: '+15%', trend: 'up' },
        { label: 'Flagged Accounts', value: d.data.flaggedAccounts || 0, change: '0', trend: 'neutral' },
      ])).catch(() => {}),
      api('/users').then(d => d?.data && setUsers(d.data)).catch(() => {}),
      api('/jobs').then(d => d?.data && setJobs(d.data)).catch(() => {}),
      api('/disputes').then(d => d?.data && setDisputes(d.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [api]);

  async function handleUserAction(userId: string, action: string) {
    const res = await api('/users/' + userId, { method: 'PATCH', body: JSON.stringify({ action }) });
    if (res?.success) api('/users').then(d => d?.data && setUsers(d.data));
  }

  async function handleJobAction(jobId: string, action: string) {
    const res = await api('/jobs/' + jobId, { method: 'PATCH', body: JSON.stringify({ action }) });
    if (res?.success) api('/jobs').then(d => d?.data && setJobs(d.data));
  }

  async function handleDisputeAction(disputeId: string, resolution: string) {
    const res = await api('/disputes/' + disputeId + '/resolve', { method: 'POST', body: JSON.stringify({ resolution }) });
    if (res?.success) api('/disputes').then(d => d?.data && setDisputes(d.data));
  }

  if (loading) return <div className="admin-loading">Loading admin panel...</div>;
  if (error) return <div className="admin-error">{error}</div>;

  const tabs = ['dashboard', 'users', 'jobs', 'disputes', 'health'];

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <h1>Admin Panel</h1>
        <nav className="admin-tabs">
          {tabs.map(tab => (
            <button key={tab} className={'admin-tab' + (activeTab === tab ? ' active' : '')} onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </header>

      {activeTab === 'dashboard' && (
        <section className="admin-metrics-grid">
          {metrics.map((m, i) => (
            <div key={i} className={'metric-card trend-' + m.trend}>
              <div className="metric-header">
                <span className="metric-label">{m.label}</span>
                <span className={'metric-trend trend-' + m.trend}>
                  {m.trend === 'up' ? '▲' : m.trend === 'down' ? '▼' : '●'} {m.change}
                </span>
              </div>
              <div className="metric-value">{m.value}</div>
            </div>
          ))}
        </section>
      )}

      {activeTab === 'users' && (
        <section className="admin-table-section">
          <h2>User Management</h2>
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className={'role-badge role-' + u.role}>{u.role}</span></td>
                  <td>{u.status}</td>
                  <td className="actions-cell">
                    {u.role !== 'admin' && <button onClick={() => handleUserAction(u.id, 'promote')}>Promote</button>}
                    {u.status !== 'banned' && <button className="danger" onClick={() => handleUserAction(u.id, 'ban')}>Ban</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === 'jobs' && (
        <section className="admin-table-section">
          <h2>Job Moderation</h2>
          <table className="admin-table">
            <thead><tr><th>Title</th><th>Client</th><th>Status</th><th>Flagged</th><th>Actions</th></tr></thead>
            <tbody>
              {jobs.map(j => (
                <tr key={j.id} className={j.flagged ? 'flagged-row' : ''}>
                  <td>{j.title}</td><td>{j.clientName}</td>
                  <td>{j.status}</td><td>{j.flagged ? '⚠️ Yes' : 'No'}</td>
                  <td className="actions-cell">
                    <button onClick={() => handleJobAction(j.id, j.flagged ? 'unflag' : 'flag')}>
                      {j.flagged ? 'Unflag' : 'Flag'}
                    </button>
                    <button className="danger" onClick={() => handleJobAction(j.id, 'remove')}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === 'disputes' && (
        <section className="admin-table-section">
          <h2>Disputes Management</h2>
          <table className="admin-table">
            <thead><tr><th>ID</th><th>Job</th><th>Raised By</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {disputes.map(d => (
                <tr key={d.id}>
                  <td>{d.id.slice(0, 8)}</td><td>{d.jobId}</td>
                  <td>{d.raisedBy}</td><td>{d.reason}</td>
                  <td>{d.status}</td>
                  <td className="actions-cell">
                    {d.status === 'open' && (
                      <>
                        <button onClick={() => handleDisputeAction(d.id, 'resolved_in_favor')}>Resolve for Client</button>
                        <button onClick={() => handleDisputeAction(d.id, 'resolved_in_favor_freelancer')}>Resolve for Freelancer</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === 'health' && (
        <section className="admin-health-section">
          <h2>System Health</h2>
          <div className="health-cards">
            {[
              { label: 'API Status', value: 'Online', status: 'ok' },
              { label: 'Database', value: 'Connected', status: 'ok' },
              { label: 'Cache', value: 'Operational', status: 'ok' },
              { label: 'Queue', value: 'Processing', status: 'ok' },
              { label: 'Uptime', value: '99.97%', status: 'ok' },
              { label: 'Response Time', value: '124ms', status: 'ok' },
            ].map((h, i) => (
              <div key={i} className={'health-card status-' + h.status}>
                <div className="health-indicator" />
                <div className="health-info">
                  <span className="health-label">{h.label}</span>
                  <span className="health-value">{h.value}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}