'use client';

import { useState } from 'react';

type Tab = 'dashboard' | 'users' | 'jobs' | 'moderation' | 'system';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'freelancer' | 'admin';
  status: 'active' | 'suspended' | 'flagged';
  joined: string;
  jobsPosted: number;
  earnings: string;
}

interface Job {
  id: string;
  title: string;
  postedBy: string;
  budget: string;
  status: 'open' | 'in-progress' | 'completed' | 'flagged' | 'disputed';
  proposals: number;
  posted: string;
}

const adminStyles = {
  container: { padding: '1rem 0' },
  header: { fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#f2f5ff' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' as const },
  tab: (active: boolean) => ({
    padding: '0.6rem 1.2rem',
    borderRadius: '8px',
    border: active ? '1px solid #4a7cff' : '1px solid #2a3765',
    background: active ? '#1a2a5c' : 'transparent',
    color: active ? '#4a7cff' : '#8a9bc0',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: active ? 600 : 400,
  }),
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  metricCard: {
    background: '#151c35',
    border: '1px solid #2a3765',
    borderRadius: '12px',
    padding: '1.2rem',
  },
  metricValue: { fontSize: '1.8rem', fontWeight: 700, color: '#4a7cff', marginBottom: '0.25rem' },
  metricLabel: { fontSize: '0.8rem', color: '#8a9bc0', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.875rem' },
  th: { textAlign: 'left' as const, padding: '0.75rem 0.5rem', borderBottom: '1px solid #2a3765', color: '#8a9bc0', fontWeight: 500 },
  td: { padding: '0.75rem 0.5rem', borderBottom: '1px solid #1a2240', color: '#c8d0e8' },
  badge: (color: string) => ({
    display: 'inline-block',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 600,
    background: `${color}20`,
    color: color,
  }),
  logEntry: { padding: '0.5rem 0', borderBottom: '1px solid #1a2240', fontSize: '0.8125rem', color: '#a0b0d0' },
  logTime: { color: '#4a7cff', marginRight: '0.75rem' },
};

const mockUsers: User[] = [
  { id: 'usr_1', name: 'Maya Chen', email: 'maya@example.com', role: 'freelancer', status: 'active', joined: '2025-11-15', jobsPosted: 0, earnings: '$12,400' },
  { id: 'usr_2', name: 'Jordan UX', email: 'jordan@example.com', role: 'freelancer', status: 'active', joined: '2026-01-22', jobsPosted: 0, earnings: '$8,900' },
  { id: 'usr_3', name: 'Alex Rivera', email: 'alex.r@example.com', role: 'client', status: 'active', joined: '2025-09-10', jobsPosted: 14, earnings: '$0' },
  { id: 'usr_4', name: 'Sam Wilson', email: 'sam.w@example.com', role: 'client', status: 'flagged', joined: '2026-02-05', jobsPosted: 3, earnings: '$0' },
  { id: 'usr_5', name: 'Priya Sharma', email: 'priya@example.com', role: 'freelancer', status: 'active', joined: '2026-03-18', jobsPosted: 0, earnings: '$3,200' },
  { id: 'usr_6', name: 'Carlos Mendez', email: 'carlos@example.com', role: 'client', status: 'suspended', joined: '2024-07-30', jobsPosted: 8, earnings: '$0' },
  { id: 'usr_7', name: 'Bot Account 42', email: 'bot42@example.com', role: 'freelancer', status: 'flagged', joined: '2026-05-26', jobsPosted: 0, earnings: '$0' },
  { id: 'usr_8', name: 'Emma Watson', email: 'emma.w@example.com', role: 'admin', status: 'active', joined: '2024-01-15', jobsPosted: 0, earnings: '$0' },
];

const mockJobs: Job[] = [
  { id: 'job_101', title: 'Build AI customer support widget', postedBy: 'Alex Rivera', budget: '$1,500', status: 'open', proposals: 8, posted: '2026-05-20' },
  { id: 'job_102', title: 'Migrate legacy API to Node.js', postedBy: 'Sam Wilson', budget: '$2,800', status: 'in-progress', proposals: 5, posted: '2026-05-18' },
  { id: 'job_103', title: 'Design SaaS onboarding flows', postedBy: 'Alex Rivera', budget: '$900', status: 'completed', proposals: 12, posted: '2026-05-10' },
  { id: 'job_104', title: 'Full-stack e-commerce platform', postedBy: 'Carlos Mendez', budget: '$5,000', status: 'disputed', proposals: 15, posted: '2026-05-15' },
  { id: 'job_105', title: 'Write technical documentation', postedBy: 'Sam Wilson', budget: '$600', status: 'flagged', proposals: 3, posted: '2026-05-22' },
  { id: 'job_106', title: 'Build mobile app with React Native', postedBy: 'Alex Rivera', budget: '$3,200', status: 'open', proposals: 6, posted: '2026-05-25' },
];

const recentLogs = [
  { time: '19:42:03', msg: 'New user registered: Bot Account 42 — flagged for suspicious email domain' },
  { time: '19:38:17', msg: 'Job #105 flagged: "Write technical documentation" — possible scam pattern detected' },
  { time: '19:30:44', msg: 'Payment processed: $1,500 released to @maya-dev for job #103' },
  { time: '19:22:09', msg: 'Dispute filed on job #104 by @carlos_mendez — mediation required' },
  { time: '19:15:33', msg: 'Rate limit triggered: 200+ requests from IP 45.33.xx.xxx in 1 minute' },
  { time: '19:08:55', msg: 'User @sam.wilson flagged: 3 disputes opened in 24 hours' },
  { time: '18:55:12', msg: 'Admin @emma.watson logged in from new device' },
  { time: '18:45:00', msg: 'System health check passed: all services operational' },
];

const statusColors: Record<string, string> = {
  active: '#22c55e', suspended: '#ef4444', flagged: '#f59e0b',
  open: '#22c55e', 'in-progress': '#4a7cff', completed: '#8a9bc0',
  disputed: '#ef4444', flagged_job: '#f59e0b',
};

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const metrics = {
    totalUsers: 1285,
    activeFreelancers: 342,
    openJobs: 47,
    monthlyVolume: '$128,900',
    flaggedAccounts: 3,
    pendingDisputes: 2,
    newUsersToday: 14,
    systemUptime: '99.97%',
  };

  const renderDashboard = () => (
    <>
      <div style={adminStyles.metricsGrid}>
        {[
          { value: metrics.totalUsers.toLocaleString(), label: 'Total Users' },
          { value: metrics.activeFreelancers.toString(), label: 'Active Freelancers' },
          { value: metrics.openJobs.toString(), label: 'Open Jobs' },
          { value: metrics.monthlyVolume, label: 'Monthly Volume' },
          { value: metrics.flaggedAccounts.toString(), label: 'Flagged Accounts' },
          { value: metrics.pendingDisputes.toString(), label: 'Pending Disputes' },
          { value: metrics.newUsersToday.toString(), label: 'New Today' },
          { value: metrics.systemUptime, label: 'System Uptime' },
        ].map((m, i) => (
          <div key={i} style={adminStyles.metricCard}>
            <div style={adminStyles.metricValue}>{m.value}</div>
            <div style={adminStyles.metricLabel}>{m.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3 style={{ marginBottom: '0.75rem', color: '#f2f5ff', fontSize: '1rem' }}>Recent Activity Log</h3>
        {recentLogs.map((log, i) => (
          <div key={i} style={adminStyles.logEntry}>
            <span style={adminStyles.logTime}>{log.time}</span>
            {log.msg}
          </div>
        ))}
      </div>
    </>
  );

  const renderUsers = () => (
    <div className="card" style={{ overflowX: 'auto' }}>
      <table style={adminStyles.table}>
        <thead>
          <tr>
            <th style={adminStyles.th}>Name</th>
            <th style={adminStyles.th}>Email</th>
            <th style={adminStyles.th}>Role</th>
            <th style={adminStyles.th}>Status</th>
            <th style={adminStyles.th}>Joined</th>
            <th style={adminStyles.th}>Earnings</th>
            <th style={adminStyles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {mockUsers.map(u => (
            <tr key={u.id} style={{ cursor: 'pointer' }}
                onClick={() => { setSelectedUser(u); setSelectedJob(null); }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1a2240')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <td style={adminStyles.td}>{u.name}</td>
              <td style={adminStyles.td}>{u.email}</td>
              <td style={adminStyles.td}>
                <span style={adminStyles.badge(u.role === 'admin' ? '#4a7cff' : u.role === 'freelancer' ? '#22c55e' : '#f59e0b')}>
                  {u.role}
                </span>
              </td>
              <td style={adminStyles.td}>
                <span style={adminStyles.badge(statusColors[u.status])}>{u.status}</span>
              </td>
              <td style={adminStyles.td}>{u.joined}</td>
              <td style={adminStyles.td}>{u.earnings}</td>
              <td style={adminStyles.td}>
                <button onClick={(e) => { e.stopPropagation(); setSelectedUser(u); }}
                  style={{ background: '#4a7cff', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem' }}>
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderJobs = () => (
    <div className="card" style={{ overflowX: 'auto' }}>
      <table style={adminStyles.table}>
        <thead>
          <tr>
            <th style={adminStyles.th}>Title</th>
            <th style={adminStyles.th}>Posted By</th>
            <th style={adminStyles.th}>Budget</th>
            <th style={adminStyles.th}>Status</th>
            <th style={adminStyles.th}>Proposals</th>
            <th style={adminStyles.th}>Posted</th>
            <th style={adminStyles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {mockJobs.map(j => (
            <tr key={j.id} style={{ cursor: 'pointer' }}
                onClick={() => { setSelectedJob(j); setSelectedUser(null); }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1a2240')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <td style={adminStyles.td}>{j.title}</td>
              <td style={adminStyles.td}>{j.postedBy}</td>
              <td style={adminStyles.td}>{j.budget}</td>
              <td style={adminStyles.td}>
                <span style={adminStyles.badge(statusColors[j.status] || statusColors.flagged_job)}>{j.status}</span>
              </td>
              <td style={adminStyles.td}>{j.proposals}</td>
              <td style={adminStyles.td}>{j.posted}</td>
              <td style={adminStyles.td}>
                <button onClick={(e) => { e.stopPropagation(); setSelectedJob(j); }}
                  style={{ background: '#4a7cff', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem' }}>
                  Review
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderModeration = () => (
    <div>
      <div className="card">
        <h3 style={{ marginBottom: '0.75rem', color: '#f59e0b', fontSize: '1rem' }}>⚠️ Flagged Accounts</h3>
        {mockUsers.filter(u => u.status === 'flagged' || u.status === 'suspended').map(u => (
          <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #1a2240' }}>
            <div>
              <span style={{ fontWeight: 600 }}>{u.name}</span>
              <span style={{ color: '#8a9bc0', marginLeft: '0.5rem' }}>{u.email}</span>
              <span style={adminStyles.badge(statusColors[u.status])} style={{marginLeft: '0.5rem', ...adminStyles.badge(statusColors[u.status])}}>{u.status}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button style={{ background: '#22c55e', color: '#000', border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem' }}>Approve</button>
              <button style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem' }}>Suspend</button>
              <button style={{ background: 'transparent', color: '#8a9bc0', border: '1px solid #2a3765', borderRadius: '4px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem' }}>Dismiss</button>
            </div>
          </div>
        ))}
        {mockUsers.filter(u => u.status === 'flagged' || u.status === 'suspended').length === 0 && (
          <p style={{ color: '#8a9bc0' }}>No flagged accounts</p>
        )}
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3 style={{ marginBottom: '0.75rem', color: '#ef4444', fontSize: '1rem' }}>🚩 Disputed Jobs</h3>
        {mockJobs.filter(j => j.status === 'disputed' || j.status === 'flagged').map(j => (
          <div key={j.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #1a2240' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{j.title}</div>
              <div style={{ color: '#8a9bc0', fontSize: '0.8125rem' }}>By {j.postedBy} — {j.budget}</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={adminStyles.badge(statusColors[j.status] || '#f59e0b')}>{j.status}</span>
              <button style={{ background: '#4a7cff', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem' }}>Mediate</button>
            </div>
          </div>
        ))}
        {mockJobs.filter(j => j.status === 'disputed' || j.status === 'flagged').length === 0 && (
          <p style={{ color: '#8a9bc0' }}>No disputes</p>
        )}
      </div>
    </div>
  );

  const renderSystem = () => (
    <div>
      <div style={adminStyles.metricsGrid}>
        {[
          { value: 'Online', label: 'API Status' },
          { value: 'Connected', label: 'Database' },
          { value: '145ms', label: 'Avg Response Time' },
          { value: '1.2K/min', label: 'Req/min' },
        ].map((m, i) => (
          <div key={i} style={adminStyles.metricCard}>
            <div style={{ ...adminStyles.metricValue, fontSize: '1.2rem', color: '#22c55e' }}>{m.value}</div>
            <div style={adminStyles.metricLabel}>{m.label}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <h3 style={{ marginBottom: '0.75rem', color: '#f2f5ff', fontSize: '1rem' }}>Server Configuration</h3>
        <table style={adminStyles.table}>
          <tbody>
            {[
              ['Node Version', 'v22.22.2'],
              ['Environment', 'Production'],
              ['Database', 'PostgreSQL 16'],
              ['Cache', 'Redis 7 (cluster)'],
              ['CDN', 'Cloudflare'],
              ['Queue', 'BullMQ'],
              ['Last Deploy', '2026-05-27 18:30 UTC'],
            ].map(([key, val]) => (
              <tr key={key}>
                <td style={{ ...adminStyles.td, color: '#8a9bc0', width: '200px' }}>{key}</td>
                <td style={adminStyles.td}>{val}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDetailPanel = () => {
    if (selectedUser) {
      return (
        <div className="card" style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ color: '#f2f5ff', fontSize: '1rem', margin: 0 }}>User Detail: {selectedUser.name}</h3>
            <button onClick={() => setSelectedUser(null)} style={{ background: 'transparent', color: '#8a9bc0', border: '1px solid #2a3765', borderRadius: '4px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem' }}>Close</button>
          </div>
          <table style={adminStyles.table}>
            <tbody>
              {[
                ['ID', selectedUser.id],
                ['Email', selectedUser.email],
                ['Role', selectedUser.role],
                ['Status', selectedUser.status],
                ['Joined', selectedUser.joined],
                ['Jobs Posted', String(selectedUser.jobsPosted)],
                ['Earnings', selectedUser.earnings],
              ].map(([key, val]) => (
                <tr key={key}>
                  <td style={{ ...adminStyles.td, color: '#8a9bc0', width: '150px' }}>{key}</td>
                  <td style={adminStyles.td}>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            {selectedUser.status !== 'suspended' && <button style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.5rem 1rem', cursor: 'pointer' }}>Suspend User</button>}
            {selectedUser.status === 'suspended' && <button style={{ background: '#22c55e', color: '#000', border: 'none', borderRadius: '4px', padding: '0.5rem 1rem', cursor: 'pointer' }}>Reinstate</button>}
            <button style={{ background: 'transparent', color: '#8a9bc0', border: '1px solid #2a3765', borderRadius: '4px', padding: '0.5rem 1rem', cursor: 'pointer' }}>View Activity Log</button>
            <button style={{ background: 'transparent', color: '#8a9bc0', border: '1px solid #2a3765', borderRadius: '4px', padding: '0.5rem 1rem', cursor: 'pointer' }}>Send Warning</button>
          </div>
        </div>
      );
    }
    if (selectedJob) {
      return (
        <div className="card" style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ color: '#f2f5ff', fontSize: '1rem', margin: 0 }}>Job Detail: {selectedJob.title}</h3>
            <button onClick={() => setSelectedJob(null)} style={{ background: 'transparent', color: '#8a9bc0', border: '1px solid #2a3765', borderRadius: '4px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem' }}>Close</button>
          </div>
          <table style={adminStyles.table}>
            <tbody>
              {[
                ['ID', selectedJob.id],
                ['Posted By', selectedJob.postedBy],
                ['Budget', selectedJob.budget],
                ['Status', selectedJob.status],
                ['Proposals', String(selectedJob.proposals)],
                ['Posted', selectedJob.posted],
              ].map(([key, val]) => (
                <tr key={key}>
                  <td style={{ ...adminStyles.td, color: '#8a9bc0', width: '150px' }}>{key}</td>
                  <td style={adminStyles.td}>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            {selectedJob.status !== 'completed' && <button style={{ background: '#22c55e', color: '#000', border: 'none', borderRadius: '4px', padding: '0.5rem 1rem', cursor: 'pointer' }}>Mark Complete</button>}
            {(selectedJob.status === 'disputed' || selectedJob.status === 'flagged') && <button style={{ background: '#4a7cff', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.5rem 1rem', cursor: 'pointer' }}>Assign Mediator</button>}
            <button style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.5rem 1rem', cursor: 'pointer' }}>Remove Listing</button>
          </div>
        </div>
      );
    }
    return null;
  };

  const tabLabels: { key: Tab; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'users', label: 'Users', icon: '👥' },
    { key: 'jobs', label: 'Jobs', icon: '💼' },
    { key: 'moderation', label: 'Moderation', icon: '🛡️' },
    { key: 'system', label: 'System', icon: '⚙️' },
  ];

  return (
    <section>
      <h2 style={adminStyles.header}>🛠️ Admin Panel</h2>
      <p style={{ color: '#8a9bc0', marginBottom: '1rem', fontSize: '0.875rem' }}>
        Platform management, moderation, and system health — full admin controls.
      </p>

      <div style={adminStyles.tabs}>
        {tabLabels.map(t => (
          <button key={t.key} style={adminStyles.tab(activeTab === t.key)} onClick={() => setActiveTab(t.key)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'users' && renderUsers()}
      {activeTab === 'jobs' && renderJobs()}
      {activeTab === 'moderation' && renderModeration()}
      {activeTab === 'system' && renderSystem()}

      {renderDetailPanel()}
    </section>
  );
}
