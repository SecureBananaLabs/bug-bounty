'use client';

import { useState } from 'react';

type Tab = 'dashboard' | 'users' | 'moderation' | 'disputes' | 'settings';
const TABS: { key: Tab; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'users', label: 'Users' },
  { key: 'moderation', label: 'Moderation' },
  { key: 'disputes', label: 'Disputes' },
  { key: 'settings', label: 'Settings' },
];

/* ─── Mock Data ─── */

const METRICS = {
  totalUsers: 1285, activeJobs: 342, openDisputes: 2,
  flaggedListings: 2, monthlyVolume: 128900, trustScoreAvg: 4.3,
};

const USERS = [
  { id: 'user-1', fullName: 'John Doe', email: 'john@example.com', role: 'FREELANCER', status: 'ACTIVE', isVerified: true, createdAt: '2025-11-15' },
  { id: 'user-2', fullName: 'Jane Smith', email: 'jane@example.com', role: 'CLIENT', status: 'ACTIVE', isVerified: true, createdAt: '2025-12-01' },
  { id: 'user-3', fullName: 'Charlie Davis', email: 'charlie@example.com', role: 'CLIENT', status: 'SUSPENDED', isVerified: false, createdAt: '2026-01-10' },
  { id: 'user-4', fullName: 'Bob Wilson', email: 'bob@example.com', role: 'FREELANCER', status: 'BANNED', isVerified: false, createdAt: '2026-01-20' },
  { id: 'user-5', fullName: 'Eve Martin', email: 'eve@example.com', role: 'FREELANCER', status: 'ACTIVE', isVerified: true, createdAt: '2026-02-05' },
  { id: 'user-6', fullName: 'Alice Brown', email: 'alice@example.com', role: 'CLIENT', status: 'ACTIVE', isVerified: true, createdAt: '2026-02-15' },
];

const MODERATION = [
  { id: 'flag-1', reason: 'Inappropriate content', status: 'FLAGGED', jobTitle: 'Build a website urgently', reporter: 'user-3', createdAt: '2 days ago' },
  { id: 'flag-2', reason: 'Suspected scam - too good to be true', status: 'FLAGGED', jobTitle: '$10k for simple data entry', reporter: 'user-5', createdAt: '3 days ago' },
];

const DISPUTES = [
  { id: 'disp-1', reason: 'Freelancer did not deliver on time', status: 'OPEN', raisedBy: 'Charlie Davis', defendant: 'John Doe', jobTitle: 'WordPress Theme Customization', createdAt: '2 days ago' },
  { id: 'disp-2', reason: 'Client refused to pay after delivery', status: 'UNDER_REVIEW', raisedBy: 'John Doe', defendant: 'Bob Wilson', jobTitle: 'Logo Design for Startup', createdAt: '4 days ago' },
  { id: 'disp-3', reason: 'Work was not as specified', status: 'RESOLVED', raisedBy: 'Eve Martin', defendant: 'Jane Smith', jobTitle: 'Mobile App UI Design', createdAt: '7 days ago' },
];

const PLATFORM_SETTINGS = {
  registrationOpen: true,
  jobPostingOpen: true,
  commissionRate: '10',
  minPayout: '50',
  supportEmail: 'support@freelanceflow.com',
  maintenanceMode: false,
};

/* ─── Utility ─── */

function Badge({ children, variant }: { children: string; variant: 'success' | 'warning' | 'error' | 'info' }) {
  const colors: Record<string, { bg: string; color: string }> = {
    success: { bg: '#d4edda', color: '#155724' },
    warning: { bg: '#fff3cd', color: '#856404' },
    error: { bg: '#f8d7da', color: '#721c24' },
    info: { bg: '#d1ecf1', color: '#0c5460' },
  };
  const s = colors[variant] || colors.info;
  return <span style={{ background: s.bg, color: s.color, padding: '2px 8px', borderRadius: '4px', fontSize: '0.85em', fontWeight: 500 }}>{children}</span>;
}

function statusVariant(status: string): 'success' | 'warning' | 'error' | 'info' {
  if (['ACTIVE', 'APPROVED', 'OPEN', 'RESOLVED'].includes(status)) return 'success';
  if (['SUSPENDED', 'FLAGGED', 'UNDER_REVIEW'].includes(status)) return 'warning';
  if (['BANNED', 'REJECTED'].includes(status)) return 'error';
  return 'info';
}

/* ─── Tab Components ─── */

function DashboardTab() {
  return (
    <div>
      <h2>Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total Users', value: METRICS.totalUsers },
          { label: 'Active Jobs', value: METRICS.activeJobs },
          { label: 'Open Disputes', value: METRICS.openDisputes },
          { label: 'Flagged Listings', value: METRICS.flaggedListings },
          { label: 'Monthly Volume', value: `$${METRICS.monthlyVolume.toLocaleString()}` },
          { label: 'Trust Score', value: `${METRICS.trustScoreAvg}/5` },
        ].map(m => (
          <div key={m.label} className="card" style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '0.85em', color: '#666' }}>{m.label}</div>
            <div style={{ fontSize: '1.8em', fontWeight: 700, marginTop: '4px' }}>{m.value}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <h3>Recent Activity</h3>
        <p>Last 24h: 12 new registrations, 8 jobs posted, 3 disputes filed, 2 payments processed.</p>
      </div>
    </div>
  );
}

function UsersTab() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const filtered = USERS.filter(u => {
    const q = search.toLowerCase();
    return (u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
      (!roleFilter || u.role === roleFilter);
  });

  return (
    <div>
      <h2>User Management</h2>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
          <option value="">All roles</option>
          <option value="FREELANCER">Freelancer</option>
          <option value="CLIENT">Client</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      {filtered.map(u => (
        <div key={u.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>{u.fullName}</strong> <span style={{ color: '#666' }}>({u.email})</span>
            <div style={{ marginTop: '4px' }}>
              <Badge variant={u.role === 'FREELANCER' ? 'info' : 'warning'}>{u.role}</Badge>{' '}
              <Badge variant={statusVariant(u.status)}>{u.status}</Badge>{' '}
              {u.isVerified && <Badge variant="success">Verified</Badge>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {u.status === 'ACTIVE' && <button className="button" onClick={() => alert(`Suspend ${u.fullName}?`)} style={{ background: '#ffc107' }}>Suspend</button>}
            {u.status === 'SUSPENDED' && <button className="button" onClick={() => alert(`Reinstate ${u.fullName}?`)} style={{ background: '#28a745', color: 'white' }}>Reinstate</button>}
            {u.status !== 'BANNED' && u.role !== 'ADMIN' && <button className="button" onClick={() => alert(`Ban ${u.fullName}?`)} style={{ background: '#dc3545', color: 'white' }}>Ban</button>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ModerationTab() {
  return (
    <div>
      <h2>Job Moderation Queue</h2>
      {MODERATION.length === 0 && <div className="card"><p>No flagged listings. All clear! ✅</p></div>}
      {MODERATION.map(f => (
        <div key={f.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <strong>{f.jobTitle}</strong>
              <p style={{ margin: '4px 0', color: '#666' }}>{f.reason}</p>
              <p style={{ fontSize: '0.85em', color: '#999' }}>Reported by {f.reporter} • {f.createdAt}</p>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className="button" onClick={() => alert(`Approved: ${f.jobTitle}`)} style={{ background: '#28a745', color: 'white' }}>✓ Approve</button>
              <button className="button" onClick={() => { const r = prompt('Rejection reason:'); if (r) alert(`Rejected: ${f.jobTitle} - ${r}`); }} style={{ background: '#dc3545', color: 'white' }}>✗ Reject</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DisputesTab() {
  const [selected, setSelected] = useState<string | null>(null);
  if (selected) {
    const d = DISPUTES.find(x => x.id === selected)!;
    return (
      <div>
        <button className="button" onClick={() => setSelected(null)} style={{ marginBottom: '12px' }}>← Back to list</button>
        <div className="card">
          <h3>{d.jobTitle}</h3>
          <p><strong>Reason:</strong> {d.reason}</p>
          <p><strong>Raised by:</strong> {d.raisedBy} <strong>vs</strong> {d.defendant}</p>
          <p><strong>Status:</strong> <Badge variant={statusVariant(d.status)}>{d.status}</Badge></p>
          <div style={{ marginTop: '16px', padding: '12px', background: '#f9f9f9', borderRadius: '4px' }}>
            <h4>Dispute Messages</h4>
            <p style={{ color: '#666' }}>Dispute thread messages would appear here with timestamps.</p>
          </div>
          {d.status !== 'RESOLVED' && (
            <div style={{ marginTop: '12px' }}>
              <strong>Ruling:</strong>{' '}
              <button className="button" onClick={() => alert(`Ruled in favor of ${d.raisedBy}`)} style={{ background: '#28a745', color: 'white' }}>Favor {d.raisedBy}</button>{' '}
              <button className="button" onClick={() => alert(`Ruled in favor of ${d.defendant}`)} style={{ background: '#007bff', color: 'white' }}>Favor {d.defendant}</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>Dispute Resolution</h2>
      {DISPUTES.map(d => (
        <div key={d.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setSelected(d.id)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{d.jobTitle}</strong>
              <p style={{ margin: '4px 0', color: '#666' }}>{d.reason}</p>
              <p style={{ fontSize: '0.85em', color: '#999' }}>{d.raisedBy} vs {d.defendant} • {d.createdAt}</p>
            </div>
            <Badge variant={statusVariant(d.status)}>{d.status}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function SettingsTab() {
  const [settings, setSettings] = useState(PLATFORM_SETTINGS);

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    alert(`${key} toggled to ${!settings[key]}`);
  };

  return (
    <div>
      <h2>Platform Controls</h2>
      <div style={{ display: 'grid', gap: '12px' }}>
        {[
          { key: 'registrationOpen' as const, label: 'New User Registration', desc: 'Allow new users to sign up' },
          { key: 'jobPostingOpen' as const, label: 'Job Posting', desc: 'Allow clients to post new jobs' },
          { key: 'maintenanceMode' as const, label: 'Maintenance Mode', desc: 'Disable the platform for maintenance' },
        ].map(item => (
          <div key={item.key} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{item.label}</strong>
              <p style={{ margin: 0, color: '#666', fontSize: '0.9em' }}>{item.desc}</p>
            </div>
            <button className="button" onClick={() => toggle(item.key)}
              style={{ background: settings[item.key] ? '#28a745' : '#6c757d', color: 'white', minWidth: '80px' }}>
              {settings[item.key] ? 'ON' : 'OFF'}
            </button>
          </div>
        ))}
        <div className="card">
          <strong>Commission Rate</strong>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <input type="number" defaultValue={settings.commissionRate} min="0" max="100"
              style={{ width: '80px', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }} />
            <span style={{ lineHeight: '32px' }}>%</span>
            <button className="button" onClick={() => alert('Commission rate updated')} style={{ background: '#007bff', color: 'white' }}>Save</button>
          </div>
        </div>
        <div className="card">
          <strong>Support Email</strong>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <input type="email" defaultValue={settings.supportEmail}
              style={{ flex: 1, padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }} />
            <button className="button" onClick={() => alert('Support email updated')} style={{ background: '#007bff', color: 'white' }}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

export default function AdminPanelPage() {
  const [tab, setTab] = useState<Tab>('dashboard');

  return (
    <section>
      <h2>Admin Panel</h2>
      <nav style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '8px' }}>
        {TABS.map(t => (
          <button key={t.key} className="button" onClick={() => setTab(t.key)}
            style={{
              background: tab === t.key ? '#0070f3' : '#f0f0f0',
              color: tab === t.key ? 'white' : '#333',
              fontWeight: tab === t.key ? 600 : 400,
              padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer',
            }}>
            {t.label}
          </button>
        ))}
      </nav>
      {tab === 'dashboard' && <DashboardTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'moderation' && <ModerationTab />}
      {tab === 'disputes' && <DisputesTab />}
      {tab === 'settings' && <SettingsTab />}
    </section>
  );
}
