'use client';

import { useState, useEffect, useCallback } from 'react';

function useApi(path, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(path);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.message || 'Request failed');
      }
    } catch (e) {
      setError(e.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...deps]);

  return { data, loading, error, refetch: fetchData };
}

function classNames(...cls) {
  return cls.filter(Boolean).join(' ');
}

function Spinner({ label }) {
  return <div role="status" aria-label={label || 'Loading'} style={{ textAlign: 'center', padding: '2rem', color: '#8892b0' }}>Loading...</div>;
}

function EmptyState({ message }) {
  return <div role="status" style={{ textAlign: 'center', padding: '2rem', color: '#8892b0' }}>{message || 'No data available.'}</div>;
}

function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" style={{ textAlign: 'center', padding: '2rem', color: '#ff6b6b' }}>
      <p>{message || 'An error occurred.'}</p>
      {onRetry && <button onClick={onRetry} style={btnStyle}>Retry</button>}
    </div>
  );
}

const btnStyle = {
  padding: '0.5rem 1rem',
  borderRadius: '6px',
  border: '1px solid #2a3765',
  background: '#1a2648',
  color: '#f2f5ff',
  cursor: 'pointer',
  fontSize: '0.875rem',
};

const dangerBtnStyle = { ...btnStyle, border: '1px solid #e74c3c', background: '#3a1a1a', color: '#ff6b6b' };
const successBtnStyle = { ...btnStyle, border: '1px solid #2ecc71', background: '#1a3a2a', color: '#2ecc71' };

const inputStyle = {
  padding: '0.5rem',
  borderRadius: '6px',
  border: '1px solid #2a3765',
  background: '#151c35',
  color: '#f2f5ff',
  fontSize: '0.875rem',
};

const selectStyle = { ...inputStyle };

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  fontSize: '0.875rem',
};

const thStyle = {
  textAlign: 'left' as const,
  padding: '0.75rem 0.5rem',
  borderBottom: '1px solid #2a3765',
  color: '#8892b0',
  fontWeight: 600,
};

const tdStyle = {
  padding: '0.75rem 0.5rem',
  borderBottom: '1px solid #1a2648',
};

const tabStyle = (active) => ({
  padding: '0.75rem 1.25rem',
  border: 'none',
  background: active ? '#1a2648' : 'transparent',
  color: active ? '#f2f5ff' : '#8892b0',
  cursor: 'pointer',
  fontWeight: active ? 600 : 400,
  borderBottom: active ? '2px solid #4a6cf7' : '2px solid transparent',
  fontSize: '0.9rem',
});

const paginationBtnStyle = {
  ...btnStyle,
  margin: '0 0.25rem',
};

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} style={paginationBtnStyle} aria-label="Previous page">{'<'}</button>
      <span style={{ color: '#8892b0', fontSize: '0.875rem' }}>Page {page} of {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} style={paginationBtnStyle} aria-label="Next page">{'>'}</button>
    </nav>
  );
}

function StatusBadge({ status }) {
  const colors = {
    active: '#2ecc71',
    suspended: '#f39c12',
    banned: '#e74c3c',
    pending: '#3498db',
    approved: '#2ecc71',
    rejected: '#e74c3c',
    OPEN: '#3498db',
    UNDER_REVIEW: '#f39c12',
    RESOLVED: '#2ecc71',
  };
  const color = colors[status] || '#8892b0';
  return (
    <span style={{ color, background: color + '20', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
      {status}
    </span>
  );
}

function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={title} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div className="card" style={{ maxWidth: '400px', width: '90%' }}>
        <h3 style={{ margin: '0 0 0.5rem' }}>{title}</h3>
        <p style={{ color: '#8892b0', margin: '0 0 1rem' }}>{message}</p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={btnStyle}>Cancel</button>
          <button onClick={onConfirm} style={dangerBtnStyle}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={title} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div className="card" style={{ maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ ...btnStyle, padding: '0.25rem 0.5rem' }} aria-label="Close">X</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DashboardTab({ onRefresh }) {
  const { data, loading, error, refetch } = useApi('/api/admin/metrics', []);

  if (loading) return <Spinner label="Loading dashboard metrics" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return <EmptyState />;

  const metrics = [
    { label: 'Total Users', value: data.totalUsers },
    { label: 'Active Jobs', value: data.activeJobs },
    { label: 'Open Disputes', value: data.openDisputes },
    { label: 'Flagged Listings', value: data.flaggedListings },
    { label: 'Revenue (USD)', value: '$' + data.revenue.toLocaleString() },
  ];

  const dist = data.trustScoreDistribution || {};

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>Platform Overview</h3>
        <button onClick={() => { refetch(); if (onRefresh) onRefresh(); }} style={btnStyle} aria-label="Refresh dashboard">
          Refresh
        </button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
        {metrics.map((m) => (
          <div key={m.label} className="card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#8892b0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem' }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h4 style={{ margin: '0 0 1rem' }}>Trust Score Distribution</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[{ key: 'excellent', label: 'Excellent (80-100)', pct: (dist.excellent || 0) / 1250 * 100 },
            { key: 'good', label: 'Good (60-79)', pct: (dist.good || 0) / 1250 * 100 },
            { key: 'fair', label: 'Fair (40-59)', pct: (dist.fair || 0) / 1250 * 100 },
            { key: 'poor', label: 'Poor (20-39)', pct: (dist.poor || 0) / 1250 * 100 },
            { key: 'veryPoor', label: 'Very Poor (0-19)', pct: (dist.veryPoor || 0) / 1250 * 100 },
          ].map((b) => (
            <div key={b.key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ minWidth: '140px', fontSize: '0.85rem' }}>{b.label}</span>
              <div style={{ flex: 1, height: '20px', background: '#0b1020', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ width: Math.max(b.pct, 2) + '%', height: '100%', background: '#4a6cf7', borderRadius: '10px', minWidth: '20px' }} />
              </div>
              <span style={{ minWidth: '40px', textAlign: 'right', fontSize: '0.85rem', color: '#8892b0' }}>{Math.round(b.pct)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const queryParams = new URLSearchParams({ page: String(page), pageSize: '10' });
  if (search) queryParams.set('search', search);
  if (roleFilter) queryParams.set('role', roleFilter);
  if (statusFilter) queryParams.set('status', statusFilter);

  const { data, loading, error, refetch } = useApi('/api/admin/users?' + queryParams.toString(), [page, search, roleFilter, statusFilter]);

  const handleAction = async (userId, action) => {
    const method = action === 'ban' ? 'DELETE' : 'PATCH';
    const endpoint = action === 'ban' ? `/api/admin/users/${userId}/ban` : `/api/admin/users/${userId}/${action}`;
    try {
      const res = await fetch(endpoint, { method });
      const json = await res.json();
      if (json.success) {
        refetch();
      }
    } catch (e) {
      console.error(e);
    }
    setConfirmAction(null);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div>
      {confirmAction && (
        <ConfirmDialog
          title={`Confirm ${confirmAction.action}`}
          message={`Are you sure you want to ${confirmAction.action} this user?`}
          onConfirm={() => handleAction(confirmAction.userId, confirmAction.action)}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: '200px' }}
          aria-label="Search users"
        />
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} style={selectStyle} aria-label="Filter by role">
          <option value="">All Roles</option>
          <option value="CLIENT">Client</option>
          <option value="FREELANCER">Freelancer</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={selectStyle} aria-label="Filter by status">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
        <button type="submit" style={btnStyle}>Search</button>
      </form>

      {loading && <Spinner label="Loading users" />}
      {error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && data && data.users.length === 0 && <EmptyState message="No users found." />}

      {!loading && !error && data && data.users.length > 0 && (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle} role="table" aria-label="Users table">
              <thead>
                <tr>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Registered</th>
                  <th style={thStyle}>Jobs</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                    style={{ cursor: 'pointer' }}
                    tabIndex={0}
                    aria-expanded={expandedUser === user.id}
                    onKeyDown={(e) => { if (e.key === 'Enter') setExpandedUser(expandedUser === user.id ? null : user.id); }}
                  >
                    <td style={tdStyle}>{user.fullName}</td>
                    <td style={tdStyle}>{user.email}</td>
                    <td style={tdStyle}>{user.role}</td>
                    <td style={tdStyle}><StatusBadge status={user.status} /></td>
                    <td style={tdStyle}>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td style={tdStyle}>{user.jobsCount}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '0.25rem' }} onClick={(e) => e.stopPropagation()}>
                        {user.status === 'active' && (
                          <button onClick={() => setConfirmAction({ userId: user.id, action: 'suspend' })} style={btnStyle} aria-label="Suspend user">Suspend</button>
                        )}
                        {user.status === 'suspended' && (
                          <button onClick={() => handleAction(user.id, 'reinstate')} style={successBtnStyle} aria-label="Reinstate user">Reinstate</button>
                        )}
                        {user.status !== 'banned' && (
                          <button onClick={() => setConfirmAction({ userId: user.id, action: 'ban' })} style={dangerBtnStyle} aria-label="Ban user">Ban</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />

          {expandedUser && (
            <UserDetailModal userId={expandedUser} onClose={() => setExpandedUser(null)} />
          )}
        </>
      )}
    </div>
  );
}

function UserDetailModal({ userId, onClose }) {
  const { data, loading } = useApi(`/api/admin/users/${userId}`, [userId]);

  return (
    <Modal title="User Details" onClose={onClose}>
      {loading && <Spinner label="Loading user details" />}
      {!loading && data && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div><strong>Name:</strong> {data.fullName}</div>
            <div><strong>Email:</strong> {data.email}</div>
            <div><strong>Role:</strong> {data.role}</div>
            <div><strong>Status:</strong> <StatusBadge status={data.status} /></div>
            <div><strong>Verified:</strong> {data.isVerified ? 'Yes' : 'No'}</div>
            <div><strong>Trust Score:</strong> {data.trustScore}</div>
            <div><strong>Jobs:</strong> {data.jobsCount}</div>
            <div><strong>Disputes:</strong> {data.disputesCount}</div>
            <div><strong>Joined:</strong> {new Date(data.createdAt).toLocaleDateString()}</div>
          </div>
          {data.bio && <div style={{ marginTop: '0.75rem' }}><strong>Bio:</strong> {data.bio}</div>}
          {data.skills && data.skills.length > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              <strong>Skills:</strong> {data.skills.join(', ')}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function ModerationTab() {
  const [page, setPage] = useState(1);
  const [rejectJobId, setRejectJobId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, loading, error, refetch } = useApi(`/api/admin/jobs/flagged?page=${page}&pageSize=10`, [page]);

  const handleApprove = async (jobId) => {
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/approve`, { method: 'PATCH' });
      const json = await res.json();
      if (json.success) refetch();
    } catch (e) { console.error(e); }
  };

  const handleReject = async () => {
    if (!rejectJobId) return;
    try {
      const res = await fetch(`/api/admin/jobs/${rejectJobId}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason || 'No reason provided' }),
      });
      const json = await res.json();
      if (json.success) refetch();
    } catch (e) { console.error(e); }
    setRejectJobId(null);
    setRejectReason('');
  };

  const handleEscalate = async (jobId) => {
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/escalate`, { method: 'PATCH' });
      const json = await res.json();
      if (json.success) refetch();
    } catch (e) { console.error(e); }
  };

  if (loading) return <Spinner label="Loading flagged jobs" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data || data.jobs.length === 0) return <EmptyState message="No flagged jobs to review." />;

  return (
    <div>
      {rejectJobId && (
        <Modal title="Reject Job" onClose={() => { setRejectJobId(null); setRejectReason(''); }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label htmlFor="reject-reason">Rejection Reason</label>
            <textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
              placeholder="Enter reason for rejection..."
            />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => { setRejectJobId(null); setRejectReason(''); }} style={btnStyle}>Cancel</button>
              <button onClick={handleReject} style={dangerBtnStyle}>Reject Job</button>
            </div>
          </div>
        </Modal>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle} role="table" aria-label="Flagged jobs table">
          <thead>
            <tr>
              <th style={thStyle}>Title</th>
              <th style={thStyle}>Client</th>
              <th style={thStyle}>Reason</th>
              <th style={thStyle}>Flagged</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.jobs.map((job) => (
              <tr key={job.id}>
                <td style={tdStyle}>{job.title}</td>
                <td style={tdStyle}>{job.clientName}</td>
                <td style={tdStyle}>{job.reason}</td>
                <td style={tdStyle}>{new Date(job.flaggedAt).toLocaleDateString()}</td>
                <td style={tdStyle}><StatusBadge status={job.status} /></td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => handleApprove(job.id)} style={successBtnStyle} aria-label="Approve job">Approve</button>
                    <button onClick={() => setRejectJobId(job.id)} style={dangerBtnStyle} aria-label="Reject job">Reject</button>
                    <button onClick={() => handleEscalate(job.id)} style={btnStyle} aria-label="Escalate job">Escalate</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
    </div>
  );
}

function DisputesTab() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [rulingText, setRulingText] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [ruleInFavor, setRuleInFavor] = useState('');

  const queryParams = new URLSearchParams({ page: String(page), pageSize: '10' });
  if (statusFilter) queryParams.set('status', statusFilter);

  const { data, loading, error, refetch } = useApi('/api/admin/disputes?' + queryParams.toString(), [page, statusFilter]);
  const { data: disputeDetail, loading: detailLoading, refetch: refetchDetail } = useApi(
    selectedDispute ? `/api/admin/disputes/${selectedDispute}` : '',
    [selectedDispute]
  );

  const handleRuleDispute = async () => {
    if (!selectedDispute || !ruleInFavor) return;
    try {
      const res = await fetch(`/api/admin/disputes/${selectedDispute}/rule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruling: rulingText, ruledInFavor: ruleInFavor, adminNotes }),
      });
      const json = await res.json();
      if (json.success) {
        setSelectedDispute(null);
        setRulingText('');
        setAdminNotes('');
        setRuleInFavor('');
        refetch();
      }
    } catch (e) { console.error(e); }
  };

  if (loading) return <Spinner label="Loading disputes" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={selectStyle} aria-label="Filter by dispute status">
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      {!data || data.disputes.length === 0 ? <EmptyState message="No disputes found." /> : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle} role="table" aria-label="Disputes table">
              <thead>
                <tr>
                  <th style={thStyle}>Job</th>
                  <th style={thStyle}>Client</th>
                  <th style={thStyle}>Freelancer</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Reason</th>
                  <th style={thStyle}>Created</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.disputes.map((d) => (
                  <tr key={d.id}>
                    <td style={tdStyle}>{d.jobTitle}</td>
                    <td style={tdStyle}>{d.clientName}</td>
                    <td style={tdStyle}>{d.freelancerName}</td>
                    <td style={tdStyle}><StatusBadge status={d.status} /></td>
                    <td style={tdStyle}>{d.reason}</td>
                    <td style={tdStyle}>{new Date(d.createdAt).toLocaleDateString()}</td>
                    <td style={tdStyle}>
                      <button onClick={() => setSelectedDispute(d.id)} style={btnStyle} aria-label="View dispute details">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}

      {selectedDispute && (
        <Modal title="Dispute Details" onClose={() => { setSelectedDispute(null); setRulingText(''); setAdminNotes(''); setRuleInFavor(''); }}>
          {detailLoading && <Spinner label="Loading dispute details" />}
          {!detailLoading && disputeDetail && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div><strong>Job:</strong> {disputeDetail.jobTitle}</div>
                <div><strong>Category:</strong> {disputeDetail.jobCategory}</div>
                <div><strong>Budget:</strong> {disputeDetail.jobBudget}</div>
                <div><strong>Client:</strong> {disputeDetail.clientName}</div>
                <div><strong>Freelancer:</strong> {disputeDetail.freelancerName}</div>
                <div><strong>Status:</strong> <StatusBadge status={disputeDetail.status} /></div>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <strong>Reason:</strong> {disputeDetail.reason}
              </div>
              {disputeDetail.evidence && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong>Evidence:</strong> <a href={disputeDetail.evidence} target="_blank" rel="noopener noreferrer" style={{ color: '#4a6cf7' }}>View Evidence</a>
                </div>
              )}

              {disputeDetail.status !== 'RESOLVED' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid #2a3765', paddingTop: '1rem' }}>
                  <h4 style={{ margin: 0 }}>Rule on Dispute</h4>
                  <div>
                    <label htmlFor="rule-in-favor">Rule in favor of</label>
                    <select id="rule-in-favor" value={ruleInFavor} onChange={(e) => setRuleInFavor(e.target.value)} style={{ ...selectStyle, display: 'block', marginTop: '0.25rem', width: '100%' }}>
                      <option value="">Select...</option>
                      <option value="client">Client</option>
                      <option value="freelancer">Freelancer</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="ruling-text">Ruling Details</label>
                    <textarea
                      id="ruling-text"
                      value={rulingText}
                      onChange={(e) => setRulingText(e.target.value)}
                      style={{ ...inputStyle, width: '100%', minHeight: '80px', resize: 'vertical', marginTop: '0.25rem' }}
                      placeholder="Enter ruling details..."
                    />
                  </div>
                  <div>
                    <label htmlFor="admin-notes">Admin Notes (internal)</label>
                    <textarea
                      id="admin-notes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      style={{ ...inputStyle, width: '100%', minHeight: '60px', resize: 'vertical', marginTop: '0.25rem' }}
                      placeholder="Internal notes..."
                    />
                  </div>
                  <button onClick={handleRuleDispute} disabled={!ruleInFavor} style={ruleInFavor ? successBtnStyle : { ...btnStyle, opacity: 0.5 }}>
                    Submit Ruling
                  </button>
                </div>
              )}

              {disputeDetail.status === 'RESOLVED' && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid #2a3765', paddingTop: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem' }}>Resolution</h4>
                  <div><strong>Ruled in favor of:</strong> {disputeDetail.ruledInFavor}</div>
                  {disputeDetail.ruling && <div><strong>Ruling:</strong> {disputeDetail.ruling}</div>}
                  {disputeDetail.adminNotes && <div><strong>Admin Notes:</strong> {disputeDetail.adminNotes}</div>}
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function ControlsTab() {
  const [controls, setControls] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const fetchControls = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/controls');
      const json = await res.json();
      if (json.success) setControls(json.data);
      else setError(json.message || 'Failed to load controls');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchControls(); }, [fetchControls]);

  const toggleControl = async (key, currentValue) => {
    try {
      const res = await fetch('/api/admin/controls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: String(!currentValue) }),
      });
      const json = await res.json();
      if (json.success) fetchControls();
    } catch (e) { console.error(e); }
    setConfirmAction(null);
  };

  if (loading) return <Spinner label="Loading platform controls" />;
  if (error) return <ErrorState message={error} onRetry={fetchControls} />;
  if (!controls) return <EmptyState />;

  const switches = [
    { key: 'registrationOpen', label: 'New User Registration', value: controls.registrationOpen },
    { key: 'jobPostingOpen', label: 'New Job Posting', value: controls.jobPostingOpen },
  ];

  return (
    <div>
      {confirmAction && (
        <ConfirmDialog
          title={confirmAction.value ? 'Disable' : 'Enable'}
          message={`Are you sure you want to ${confirmAction.value ? 'disable' : 'enable'} ${confirmAction.label}?`}
          onConfirm={() => toggleControl(confirmAction.key, confirmAction.value)}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {switches.map((sw) => (
        <div key={sw.key} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600 }}>{sw.label}</div>
            <div style={{ fontSize: '0.8rem', color: '#8892b0' }}>Currently {sw.value ? 'enabled' : 'disabled'}</div>
          </div>
          <button
            onClick={() => setConfirmAction({ key: sw.key, label: sw.label, value: sw.value })}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '20px',
              border: 'none',
              background: sw.value ? '#2ecc71' : '#e74c3c',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.8rem',
            }}
            aria-label={`Toggle ${sw.label}`}
          >
            {sw.value ? 'ON' : 'OFF'}
          </button>
        </div>
      ))}

      {controls.lastUpdated && (
        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: '#8892b0' }}>
          Last updated: {new Date(controls.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
}

function AuditLogTab() {
  const [page, setPage] = useState(1);
  const [adminFilter, setAdminFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const queryParams = new URLSearchParams({ page: String(page), pageSize: '20' });
  if (adminFilter) queryParams.set('adminId', adminFilter);
  if (actionFilter) queryParams.set('action', actionFilter);
  if (startDate) queryParams.set('startDate', startDate);
  if (endDate) queryParams.set('endDate', endDate);

  const { data, loading, error, refetch } = useApi('/api/admin/audit-log?' + queryParams.toString(), [page, adminFilter, actionFilter, startDate, endDate]);

  const actions = ['', 'LOGIN', 'USER_SUSPENDED', 'USER_REINSTATED', 'USER_BANNED', 'JOB_APPROVED', 'JOB_REJECTED', 'JOB_ESCALATED', 'DISPUTE_RULED', 'CONTROL_UPDATED', 'CONFIG_CHANGED'];

  const handleFilter = (e) => {
    e.preventDefault();
    setPage(1);
  };

  if (loading) return <Spinner label="Loading audit log" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div>
      <form onSubmit={handleFilter} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label htmlFor="audit-admin" style={{ display: 'block', fontSize: '0.75rem', color: '#8892b0', marginBottom: '0.25rem' }}>Admin</label>
          <input id="audit-admin" type="text" placeholder="Admin ID" value={adminFilter} onChange={(e) => setAdminFilter(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label htmlFor="audit-action" style={{ display: 'block', fontSize: '0.75rem', color: '#8892b0', marginBottom: '0.25rem' }}>Action</label>
          <select id="audit-action" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} style={selectStyle}>
            {actions.map((a) => (
              <option key={a} value={a}>{a || 'All Actions'}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="audit-start" style={{ display: 'block', fontSize: '0.75rem', color: '#8892b0', marginBottom: '0.25rem' }}>Start Date</label>
          <input id="audit-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label htmlFor="audit-end" style={{ display: 'block', fontSize: '0.75rem', color: '#8892b0', marginBottom: '0.25rem' }}>End Date</label>
          <input id="audit-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
        </div>
        <button type="submit" style={btnStyle}>Filter</button>
      </form>

      {!data || data.logs.length === 0 ? <EmptyState message="No audit logs found." /> : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle} role="table" aria-label="Audit log table">
              <thead>
                <tr>
                  <th style={thStyle}>Time</th>
                  <th style={thStyle}>Admin</th>
                  <th style={thStyle}>Action</th>
                  <th style={thStyle}>Target Type</th>
                  <th style={thStyle}>Target ID</th>
                  <th style={thStyle}>Details</th>
                </tr>
              </thead>
              <tbody>
                {data.logs.map((log) => (
                  <tr key={log.id}>
                    <td style={tdStyle}>{new Date(log.createdAt).toLocaleString()}</td>
                    <td style={tdStyle} style={tdStyle}>{log.adminId}</td>
                    <td style={tdStyle}>{log.action}</td>
                    <td style={tdStyle}>{log.targetType}</td>
                    <td style={tdStyle}>{log.targetId || '-'}</td>
                    <td style={tdStyle}>{log.details || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { label: 'Dashboard', component: DashboardTab },
    { label: 'Users', component: UsersTab },
    { label: 'Moderation', component: ModerationTab },
    { label: 'Disputes', component: DisputesTab },
    { label: 'Controls', component: ControlsTab },
    { label: 'Audit Log', component: AuditLogTab },
  ];

  const ActiveComponent = tabs[activeTab].component;

  return (
    <section>
      <h2 style={{ marginBottom: '1.5rem' }}>Admin Panel</h2>

      <div role="tablist" aria-label="Admin panel tabs" style={{ display: 'flex', borderBottom: '1px solid #2a3765', marginBottom: '1.5rem', overflowX: 'auto' }}>
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            role="tab"
            aria-selected={activeTab === i}
            aria-controls={`admin-tabpanel-${i}`}
            onClick={() => setActiveTab(i)}
            style={tabStyle(activeTab === i)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`admin-tabpanel-${activeTab}`} aria-labelledby={`admin-tab-${activeTab}`}>
        <ActiveComponent />
      </div>
    </section>
  );
}
