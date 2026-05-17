'use client';
import { useState, useEffect } from 'react';

export default function AdminPanelPage() {
  const [tab, setTab] = useState('metrics');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchData(); }, [tab]);

  async function fetchData() {
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('token');
      const urls = { metrics: '/api/admin/metrics', users: '/api/admin/users?limit=50', flagged: '/api/admin/jobs/flagged?limit=50', disputes: '/api/admin/disputes?limit=50', controls: '/api/admin/controls' };
      const res = await fetch(urls[tab] || '/api/admin/metrics', { headers: { Authorization: 'Bearer ' + token } });
      if (res.status === 403) { setError('Admin access required — you are not an admin'); return; }
      if (!res.ok) throw new Error('Failed to load');
      const json = await res.json();
      setData(json.data || json);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const tabs = ['metrics', 'users', 'flagged', 'disputes', 'controls'];

  return (
    <section className="card">
      <h2>Admin Panel</h2>
      <p style={{ color: '#666', marginBottom: 16 }}>User management, moderation queues, dispute resolution, and platform controls</p>

      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #ddd', marginBottom: 16 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '8px 16px', border: 'none', background: tab === t ? '#fff' : 'transparent', borderBottom: tab === t ? '2px solid #2563eb' : '2px solid transparent', color: tab === t ? '#2563eb' : '#666', fontWeight: tab === t ? 600 : 400, cursor: 'pointer' }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: 12, borderRadius: 8, marginBottom: 12 }}>{error}</div>}
      {loading && <p style={{ color: '#999' }}>Loading...</p>}

      {!loading && !error && data && (
        <div>
          {tab === 'metrics' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              {Object.entries(data).map(([k, v]) => (
                <div key={k} style={{ background: '#f9fafb', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#2563eb' }}>{String(v)}</div>
                  <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())}</div>
                </div>
              ))}
            </div>
          )}
          {tab === 'users' && data.users && (
            <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left', color: '#666' }}><th style={{ padding: 8 }}>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
              <tbody>{data.users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: 8 }}>{u.id}</td><td style={{ fontWeight: 500 }}>{u.name}</td><td>{u.email}</td>
                  <td><span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 12, background: '#dbeafe', color: '#1e40af' }}>{u.role}</span></td>
                  <td><span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 12, background: u.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2', color: u.status === 'ACTIVE' ? '#166534' : '#991b1b' }}>{u.status}</span></td>
                </tr>
              ))}</tbody>
            </table>
          )}
          {tab === 'flagged' && (
            <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left', color: '#666' }}><th style={{ padding: 8 }}>ID</th><th>Title</th><th>Posted By</th><th>Actions</th></tr></thead>
              <tbody>{(data.jobs || []).map(j => (
                <tr key={j.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: 8 }}>{j.id}</td><td style={{ fontWeight: 500 }}>{j.title}</td><td>{j.user?.name || 'N/A'}</td>
                  <td><span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 12, background: '#fef3c7', color: '#92400e' }}>FLAGGED</span></td>
                </tr>
              ))}</tbody>
            </table>
          )}
          {tab === 'disputes' && (
            <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left', color: '#666' }}><th style={{ padding: 8 }}>ID</th><th>Status</th><th>Created</th></tr></thead>
              <tbody>{(data.disputes || []).map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: 8 }}>{d.id}</td>
                  <td><span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 12, background: d.status === 'OPEN' ? '#fee2e2' : d.status === 'UNDER_REVIEW' ? '#fef3c7' : '#dcfce7', color: d.status === 'OPEN' ? '#991b1b' : d.status === 'UNDER_REVIEW' ? '#92400e' : '#166534' }}>{d.status}</span></td>
                  <td style={{ color: '#999' }}>{new Date(d.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
          {tab === 'controls' && (
            <div>
              {Object.entries(data).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1')}</span>
                  <span style={{ padding: '2px 12px', borderRadius: 4, fontSize: 13, fontWeight: 600, background: v ? '#dcfce7' : '#fee2e2', color: v ? '#166534' : '#991b1b' }}>{v ? 'ENABLED' : 'DISABLED'}</span>
                </div>
              ))}
            </div>
          )}
          <p style={{ fontSize: 11, color: '#aaa', marginTop: 16 }}>{data.total ? data.total + ' total' : Object.keys(data).length + ' items'}</p>
        </div>
      )}
    </section>
  );
}
