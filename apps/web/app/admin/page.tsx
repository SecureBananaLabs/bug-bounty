'use client';

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type Section = 'metrics' | 'users' | 'moderation' | 'disputes' | 'audit' | 'controls';

interface Metric {
  id: string;
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface MetricsData {
  totalUsers: number;
  activeJobs: number;
  pendingDisputes: number;
  monthlyRevenue: number;
  metrics: Metric[];
}

interface User {
  id: string;
  username: string;
  email: string;
  role: 'freelancer' | 'client' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
  trustScore: number;
}

interface ModerationItem {
  id: string;
  type: 'job' | 'proposal' | 'message' | 'review';
  reporterId: string;
  reportedUserId: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  content?: string;
}

interface Dispute {
  id: string;
  jobId: string;
  complainantId: string;
  respondentId: string;
  reason: string;
  status: 'open' | 'under_review' | 'resolved' | 'escalated';
  createdAt: string;
  amount?: number;
}

interface AuditLogEntry {
  id: string;
  action: string;
  userId: string;
  username: string;
  targetType?: string;
  targetId?: string;
  details?: string;
  timestamp: string;
  ipAddress?: string;
}

interface PlatformControls {
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  paymentEnabled: boolean;
  reviewSystemEnabled: boolean;
  messagingEnabled: boolean;
  maxProposalPerJob: number;
  platformFeePercent: number;
}

// ============================================================================
// API HELPERS
// ============================================================================

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

// ============================================================================
// COMPONENTS
// ============================================================================

function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <div style={{
        display: 'inline-block',
        width: '24px',
        height: '24px',
        border: '3px solid #e5e7eb',
        borderTopColor: '#3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>{message}</p>
    </div>
  );
}

function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div style={{
      padding: '1.5rem',
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '0.5rem',
      color: '#dc2626',
    }}>
      <p style={{ margin: 0, fontWeight: 500 }}>Error: {message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: '0.75rem',
            padding: '0.375rem 0.75rem',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      padding: '3rem',
      textAlign: 'center',
      color: '#6b7280',
    }}>
      <p style={{ margin: 0 }}>{message}</p>
    </div>
  );
}

// ============================================================================
// SECTION COMPONENTS
// ============================================================================

function MetricsSection() {
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchJSON<MetricsData>('/api/admin/metrics');
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner message="Loading metrics..." />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;
  if (!data) return <EmptyState message="No metrics data available" />;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Platform Overview</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={{ padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Total Users</p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '1.5rem', fontWeight: 700 }}>{data.totalUsers.toLocaleString()}</p>
        </div>
        <div style={{ padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Active Jobs</p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '1.5rem', fontWeight: 700 }}>{data.activeJobs.toLocaleString()}</p>
        </div>
        <div style={{ padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Pending Disputes</p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '1.5rem', fontWeight: 700 }}>{data.pendingDisputes}</p>
        </div>
        <div style={{ padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Monthly Revenue</p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '1.5rem', fontWeight: 700 }}>${data.monthlyRevenue.toLocaleString()}</p>
        </div>
      </div>
      <h4 style={{ marginTop: '1.5rem' }}>Key Metrics</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
            <th style={{ textAlign: 'left', padding: '0.5rem', color: '#6b7280' }}>Metric</th>
            <th style={{ textAlign: 'right', padding: '0.5rem', color: '#6b7280' }}>Value</th>
            <th style={{ textAlign: 'right', padding: '0.5rem', color: '#6b7280' }}>Change</th>
          </tr>
        </thead>
        <tbody>
          {data.metrics.map((m) => (
            <tr key={m.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '0.5rem' }}>{m.label}</td>
              <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 500 }}>{m.value}</td>
              <td style={{
                padding: '0.5rem',
                textAlign: 'right',
                color: m.trend === 'up' ? '#16a34a' : m.trend === 'down' ? '#dc2626' : '#6b7280'
              }}>
                {m.change || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UsersSection() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'suspended' | 'pending'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchJSON<User[]>('/api/admin/users');
      setUsers(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (userId: string, action: 'suspend' | 'activate' | 'delete') => {
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      await fetchJSON(`/api/admin/users/${userId}/${action}`, { method: 'POST' });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Action failed');
    }
  };

  if (loading) return <LoadingSpinner message="Loading users..." />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  const filtered = filter === 'all' ? users : users.filter(u => u.status === filter);

  return (
    <div>
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        {(['all', 'active', 'suspended', 'pending'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '0.375rem 0.75rem',
              backgroundColor: filter === f ? '#3b82f6' : '#f3f4f6',
              color: filter === f ? 'white' : '#374151',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No users found" />
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ textAlign: 'left', padding: '0.5rem', color: '#6b7280' }}>User</th>
              <th style={{ textAlign: 'left', padding: '0.5rem', color: '#6b7280' }}>Role</th>
              <th style={{ textAlign: 'left', padding: '0.5rem', color: '#6b7280' }}>Status</th>
              <th style={{ textAlign: 'right', padding: '0.5rem', color: '#6b7280' }}>Trust Score</th>
              <th style={{ textAlign: 'left', padding: '0.5rem', color: '#6b7280' }}>Joined</th>
              <th style={{ textAlign: 'right', padding: '0.5rem', color: '#6b7280' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '0.5rem' }}>
                  <div style={{ fontWeight: 500 }}>{user.username}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{user.email}</div>
                </td>
                <td style={{ padding: '0.5rem', textTransform: 'capitalize' }}>{user.role}</td>
                <td style={{ padding: '0.5rem' }}>
                  <span style={{
                    padding: '0.125rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    backgroundColor: user.status === 'active' ? '#dcfce7' : user.status === 'suspended' ? '#fee2e2' : '#fef3c7',
                    color: user.status === 'active' ? '#16a34a' : user.status === 'suspended' ? '#dc2626' : '#d97706',
                  }}>
                    {user.status}
                  </span>
                </td>
                <td style={{ padding: '0.5rem', textAlign: 'right' }}>{user.trustScore}</td>
                <td style={{ padding: '0.5rem' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                  <button
                    onClick={() => handleAction(user.id, user.status === 'suspended' ? 'activate' : 'suspend')}
                    style={{
                      padding: '0.25rem 0.5rem',
                      marginRight: '0.25rem',
                      backgroundColor: '#f3f4f6',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                    }}
                  >
                    {user.status === 'suspended' ? 'Activate' : 'Suspend'}
                  </button>
                  <button
                    onClick={() => handleAction(user.id, 'delete')}
                    style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ModerationSection() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchJSON<ModerationItem[]>('/api/admin/moderation');
      setItems(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load moderation queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (itemId: string, action: 'resolve' | 'dismiss') => {
    try {
      await fetchJSON(`/api/admin/moderation/${itemId}/${action}`, { method: 'POST' });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Action failed');
    }
  };

  if (loading) return <LoadingSpinner message="Loading moderation queue..." />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  const pending = items.filter(i => i.status === 'pending');

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>
        Pending Reviews: {pending.length}
      </h3>

      {pending.length === 0 ? (
        <EmptyState message="No items requiring moderation" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pending.map(item => (
            <div key={item.id} style={{
              padding: '1rem',
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{
                  padding: '0.125rem 0.5rem',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                }}>
                  {item.type}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </div>
              {item.content && (
                <p style={{ margin: '0.5rem 0', padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '0.25rem', fontSize: '0.875rem' }}>
                  {item.content}
                </p>
              )}
              <p style={{ margin: '0.5rem 0', fontSize: '0.875rem' }}>
                <strong>Reason:</strong> {item.reason}
              </p>
              <p style={{ margin: '0.5rem 0', fontSize: '0.75rem', color: '#6b7280' }}>
                Reported by: {item.reporterId} → Reported user: {item.reportedUserId}
              </p>
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleAction(item.id, 'resolve')}
                  style={{
                    padding: '0.375rem 0.75rem',
                    backgroundColor: '#16a34a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                  }}
                >
                  Resolve
                </button>
                <button
                  onClick={() => handleAction(item.id, 'dismiss')}
                  style={{
                    padding: '0.375rem 0.75rem',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DisputesSection() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchJSON<Dispute[]>('/api/admin/disputes');
      setDisputes(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load disputes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (disputeId: string, action: 'escalate' | 'resolve') => {
    try {
      await fetchJSON(`/api/admin/disputes/${disputeId}/${action}`, { method: 'POST' });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Action failed');
    }
  };

  if (loading) return <LoadingSpinner message="Loading disputes..." />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  const statusColors: Record<Dispute['status'], { bg: string; text: string }> = {
    open: { bg: '#dbeafe', text: '#1d4ed8' },
    under_review: { bg: '#fef3c7', text: '#d97706' },
    resolved: { bg: '#dcfce7', text: '#16a34a' },
    escalated: { bg: '#fee2e2', text: '#dc2626' },
  };

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>
        Disputes: {disputes.filter(d => d.status !== 'resolved').length} open
      </h3>

      {disputes.length === 0 ? (
        <EmptyState message="No disputes filed" />
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ textAlign: 'left', padding: '0.5rem', color: '#6b7280' }}>ID</th>
              <th style={{ textAlign: 'left', padding: '0.5rem', color: '#6b7280' }}>Job</th>
              <th style={{ textAlign: 'left', padding: '0.5rem', color: '#6b7280' }}>Status</th>
              <th style={{ textAlign: 'right', padding: '0.5rem', color: '#6b7280' }}>Amount</th>
              <th style={{ textAlign: 'left', padding: '0.5rem', color: '#6b7280' }}>Reason</th>
              <th style={{ textAlign: 'left', padding: '0.5rem', color: '#6b7280' }}>Filed</th>
              <th style={{ textAlign: 'right', padding: '0.5rem', color: '#6b7280' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {disputes.map(dispute => (
              <tr key={dispute.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {dispute.id.slice(0, 8)}
                </td>
                <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {dispute.jobId.slice(0, 8)}
                </td>
                <td style={{ padding: '0.5rem' }}>
                  <span style={{
                    padding: '0.125rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    backgroundColor: statusColors[dispute.status].bg,
                    color: statusColors[dispute.status].text,
                  }}>
                    {dispute.status.replace('_', ' ')}
                  </span>
                </td>
                <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                  {dispute.amount ? `$${dispute.amount.toLocaleString()}` : '—'}
                </td>
                <td style={{ padding: '0.5rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {dispute.reason}
                </td>
                <td style={{ padding: '0.5rem' }}>
                  {new Date(dispute.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                  {dispute.status !== 'resolved' && (
                    <>
                      <button
                        onClick={() => handleAction(dispute.id, 'escalate')}
                        style={{
                          padding: '0.25rem 0.5rem',
                          marginRight: '0.25rem',
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                        }}
                      >
                        Escalate
                      </button>
                      <button
                        onClick={() => handleAction(dispute.id, 'resolve')}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#dcfce7',
                          color: '#16a34a',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                        }}
                      >
                        Resolve
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function AuditLogSection() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchJSON<AuditLogEntry[]>('/api/admin/audit');
      setLogs(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner message="Loading audit log..." />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Audit Log</h3>

      {logs.length === 0 ? (
        <EmptyState message="No audit log entries" />
      ) : (
        <div style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
          {logs.map(log => (
            <div key={log.id} style={{
              padding: '0.75rem',
              borderBottom: '1px solid #f3f4f6',
              display: 'grid',
              gridTemplateColumns: '180px 120px 1fr',
              gap: '1rem',
              alignItems: 'center',
            }}>
              <span style={{ color: '#6b7280' }}>
                {new Date(log.timestamp).toLocaleString()}
              </span>
              <span style={{
                padding: '0.125rem 0.375rem',
                backgroundColor: '#f3f4f6',
                borderRadius: '0.25rem',
                textAlign: 'center',
              }}>
                {log.action}
              </span>
              <span>
                <strong>{log.username}</strong>
                {log.targetType && ` → ${log.targetType}${log.targetId ? `(${log.targetId.slice(0, 8)})` : ''}`}
                {log.details && <span style={{ color: '#6b7280' }}> — {log.details}</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlatformControlsSection() {
  const [controls, setControls] = useState<PlatformControls | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchJSON<PlatformControls>('/api/admin/controls');
      setControls(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load platform controls');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (key: keyof PlatformControls, value: boolean) => {
    if (!controls) return;
    const updated = { ...controls, [key]: value };
    setControls(updated);
    setSaving(true);
    try {
      await fetchJSON('/api/admin/controls', {
        method: 'PUT',
        body: JSON.stringify(updated),
      });
    } catch (e) {
      setControls(controls);
      alert(e instanceof Error ? e.message : 'Failed to update controls');
    } finally {
      setSaving(false);
    }
  };

  const handleNumberChange = async (key: keyof PlatformControls, value: number) => {
    if (!controls) return;
    const updated = { ...controls, [key]: value };
    setControls(updated);
    setSaving(true);
    try {
      await fetchJSON('/api/admin/controls', {
        method: 'PUT',
        body: JSON.stringify(updated),
      });
    } catch (e) {
      setControls(controls);
      alert(e instanceof Error ? e.message : 'Failed to update controls');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading platform controls..." />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;
  if (!controls) return <EmptyState message="No controls data available" />;

  const toggles: { key: keyof PlatformControls; label: string }[] = [
    { key: 'maintenanceMode', label: 'Maintenance Mode' },
    { key: 'registrationEnabled', label: 'User Registration' },
    { key: 'paymentEnabled', label: 'Payment System' },
    { key: 'reviewSystemEnabled', label: 'Review System' },
    { key: 'messagingEnabled', label: 'Messaging' },
  ];

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Platform Controls</h3>
      {saving && (
        <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: '#6b7280' }}>Saving changes...</p>
      )}

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase' }}>Feature Toggles</h4>
        {toggles.map(({ key, label }) => (
          <div key={key} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem 0',
            borderBottom: '1px solid #f3f4f6',
          }}>
            <span>{label}</span>
            <button
              onClick={() => handleToggle(key, !controls[key] as boolean)}
              style={{
                width: '48px',
                height: '24px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: controls[key] ? '#3b82f6' : '#d1d5db',
                position: 'relative',
                transition: 'background-color 0.2s',
              }}
            >
              <span style={{
                position: 'absolute',
                top: '2px',
                left: controls[key] ? '26px' : '2px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: 'white',
                transition: 'left 0.2s',
              }} />
            </button>
          </div>
        ))}
      </div>

      <div>
        <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase' }}>Configuration</h4>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
              Max Proposals per Job
            </label>
            <input
              type="number"
              value={controls.maxProposalPerJob}
              onChange={e => handleNumberChange('maxProposalPerJob', parseInt(e.target.value) || 1)}
              min={1}
              max={20}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
              Platform Fee (%)
            </label>
            <input
              type="number"
              value={controls.platformFeePercent}
              onChange={e => handleNumberChange('platformFeePercent', parseFloat(e.target.value) || 0)}
              min={0}
              max={100}
              step={0.1}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'metrics', label: 'Metrics' },
  { id: 'users', label: 'Users' },
  { id: 'moderation', label: 'Moderation' },
  { id: 'disputes', label: 'Disputes' },
  { id: 'audit', label: 'Audit Log' },
  { id: 'controls', label: 'Controls' },
];

export default function AdminPanelPage() {
  const [activeSection, setActiveSection] = useState<Section>('metrics');

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Admin Panel</h2>

      <nav style={{
        display: 'flex',
        gap: '0.25rem',
        marginBottom: '1.5rem',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '0.5rem',
        overflowX: 'auto',
      }}>
        {SECTIONS.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: activeSection === section.id ? '#3b82f6' : 'transparent',
              color: activeSection === section.id ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontWeight: activeSection === section.id ? 500 : 400,
            }}
          >
            {section.label}
          </button>
        ))}
      </nav>

      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        padding: '1.5rem',
      }}>
        {activeSection === 'metrics' && <MetricsSection />}
        {activeSection === 'users' && <UsersSection />}
        {activeSection === 'moderation' && <ModerationSection />}
        {activeSection === 'disputes' && <DisputesSection />}
        {activeSection === 'audit' && <AuditLogSection />}
        {activeSection === 'controls' && <PlatformControlsSection />}
      </div>
    </div>
  );
}
