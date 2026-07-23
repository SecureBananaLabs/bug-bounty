'use client';

import { useState, useEffect } from 'react';
import { 
  Users, Briefcase, Shield, BarChart3, Settings, 
  Search, X, Check, AlertTriangle, Eye, Ban, 
  RefreshCw, Clock, DollarSign, Activity 
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────
type Tab = 'metrics' | 'users' | 'moderation' | 'disputes' | 'controls' | 'audit';
interface User { id: string; name: string; email: string; role: string; status: string; joinDate: string; }
interface FlaggedJob { id: string; title: string; reason: string; reporter: string; date: string; }
interface Dispute { id: string; parties: string; issue: string; status: string; amount: number; date: string; }
interface AuditEntry { id: string; admin: string; action: string; target: string; timestamp: string; }

// ─── Mock Data ──────────────────────────────────────────
const MOCK_METRICS = {
  totalUsers: 1247, activeJobs: 89, openDisputes: 12,
  flaggedListings: 7, revenue: 45280, trustAvg: 78,
};

const MOCK_USERS: User[] = Array.from({ length: 25 }, (_, i) => ({
  id: `u${i}`, name: `User ${i + 1}`, email: `user${i + 1}@example.com`,
  role: i % 3 === 0 ? 'admin' : i % 3 === 1 ? 'freelancer' : 'client',
  status: i % 5 === 0 ? 'suspended' : 'active',
  joinDate: new Date(Date.now() - i * 86400000 * 7).toISOString(),
}));

const MOCK_FLAGGED: FlaggedJob[] = [
  { id: 'j1', title: 'Website Development', reason: 'Suspicious pricing', reporter: 'User 5', date: '2026-05-25' },
  { id: 'j2', title: 'Logo Design', reason: 'Copyright violation', reporter: 'User 12', date: '2026-05-26' },
  { id: 'j3', title: 'Data Entry', reason: 'Spam detected', reporter: 'Auto-mod', date: '2026-05-27' },
];

const MOCK_DISPUTES: Dispute[] = [
  { id: 'd1', parties: 'User 3 vs User 8', issue: 'Payment not released', status: 'open', amount: 1500, date: '2026-05-20' },
  { id: 'd2', parties: 'User 7 vs User 15', issue: 'Work not delivered', status: 'under_review', amount: 3000, date: '2026-05-22' },
  { id: 'd3', parties: 'User 2 vs User 11', issue: 'Quality dispute', status: 'open', amount: 800, date: '2026-05-24' },
];

// ─── Components ─────────────────────────────────────────
function TabButton({ tab, active, icon: Icon, label }: { tab: Tab; active: boolean; icon: any; label: string }) {
  return (
    <button
      onClick={() => document.getElementById(tab)?.scrollIntoView({ behavior: 'smooth' })}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-gray-400">{label}</p>
          <p className="text-xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        </div>
      </div>
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative mb-4">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white placeholder:text-gray-500 focus:border-indigo-500 outline-none"
      />
    </div>
  );
}

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState<Tab>('metrics');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate auth check
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">Admin privileges required.</p>
        </div>
      </div>
    );
  }

  const filteredUsers = MOCK_USERS.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'metrics', label: 'Metrics', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'moderation', label: 'Moderation', icon: Shield },
    { id: 'disputes', label: 'Disputes', icon: AlertTriangle },
    { id: 'controls', label: 'Controls', icon: Settings },
    { id: 'audit', label: 'Audit Log', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 text-sm hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </header>

      {/* Tab Nav */}
      <div className="border-b border-gray-800 px-6 py-3 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex gap-2">
          {tabs.map(t => (
            <TabButton key={t.id} tab={t.id} active={activeTab === t.id} icon={t.icon} label={t.label} />
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-8">

        {/* ── Metrics Dashboard ── */}
        <section id="metrics">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard label="Total Users" value={MOCK_METRICS.totalUsers} icon={Users} color="bg-blue-500/20 text-blue-400" />
            <StatCard label="Active Jobs" value={MOCK_METRICS.activeJobs} icon={Briefcase} color="bg-green-500/20 text-green-400" />
            <StatCard label="Open Disputes" value={MOCK_METRICS.openDisputes} icon={AlertTriangle} color="bg-orange-500/20 text-orange-400" />
            <StatCard label="Flagged" value={MOCK_METRICS.flaggedListings} icon={Shield} color="bg-red-500/20 text-red-400" />
            <StatCard label={`$${MOCK_METRICS.revenue.toLocaleString()}`} value="Revenue" icon={DollarSign} color="bg-emerald-500/20 text-emerald-400" />
            <StatCard label={`${MOCK_METRICS.trustAvg}%`} value="Trust Avg" icon={Activity} color="bg-purple-500/20 text-purple-400" />
          </div>
        </section>

        {/* ── User Management ── */}
        <section id="users">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" /> User Management
          </h2>
          <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search by name or email..." />
          <div className="rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-gray-400">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} className="border-t border-gray-800 hover:bg-gray-900/50">
                    <td className="p-3 text-white">{u.name}</td>
                    <td className="p-3 text-gray-400">{u.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                        u.role === 'freelancer' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>{u.role}</span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 ${
                        u.status === 'active' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-green-400' : 'bg-red-400'}`} />
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white" title="Suspend">
                          <Ban className="w-4 h-4" />
                        </button>
                        <button className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Job Moderation ── */}
        <section id="moderation">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-400" /> Moderation Queue
          </h2>
          <div className="space-y-3">
            {MOCK_FLAGGED.map(j => (
              <div key={j.id} className="rounded-xl border border-gray-800 bg-gray-900 p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{j.title}</p>
                  <p className="text-sm text-gray-400 mt-1">Reason: {j.reason} · Reported by {j.reporter} · {j.date}</p>
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-sm hover:bg-green-500/30">
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30">
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 text-sm hover:bg-yellow-500/30">
                    <Eye className="w-3.5 h-3.5" /> Review
                  </button>
                </div>
              </div>
            ))}
            {MOCK_FLAGGED.length === 0 && <p className="text-gray-500 text-center py-8">No flagged items.</p>}
          </div>
        </section>

        {/* ── Disputes ── */}
        <section id="disputes">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" /> Dispute Resolution
          </h2>
          <div className="space-y-3">
            {MOCK_DISPUTES.map(d => (
              <div key={d.id} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-medium">{d.parties}</p>
                    <p className="text-sm text-gray-400 mt-1">{d.issue} · ${d.amount} · {d.date}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    d.status === 'open' ? 'bg-yellow-500/20 text-yellow-400' :
                    d.status === 'under_review' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>{d.status.replace('_', ' ')}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-sm hover:bg-green-500/30">Rule for client</button>
                  <button className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/30">Rule for freelancer</button>
                  <button className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 text-sm hover:bg-gray-700">Escalate</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Platform Controls ── */}
        <section id="controls">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-400" /> Platform Controls
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'New User Registrations', desc: 'Allow new users to sign up', enabled: true },
              { label: 'New Job Postings', desc: 'Allow new job listings', enabled: true },
              { label: 'Public Messaging', desc: 'Enable chat between users', enabled: true },
            ].map(c => (
              <div key={c.label} className="rounded-xl border border-gray-800 bg-gray-900 p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{c.label}</p>
                  <p className="text-sm text-gray-400">{c.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={c.enabled} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-700 rounded-full peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                </label>
              </div>
            ))}
          </div>
        </section>

        {/* ── Audit Log ── */}
        <section id="audit">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-400" /> Audit Log
          </h2>
          <div className="rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-gray-400">
                <tr>
                  <th className="text-left p-3">Admin</th>
                  <th className="text-left p-3">Action</th>
                  <th className="text-left p-3">Target</th>
                  <th className="text-left p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { admin: 'admin@example.com', action: 'ban', target: 'User 5', timestamp: '2026-05-27 14:32' },
                  { admin: 'admin@example.com', action: 'approve listing', target: 'Job #42', timestamp: '2026-05-27 13:15' },
                  { admin: 'admin@example.com', action: 'resolve dispute', target: 'Dispute #7', timestamp: '2026-05-27 11:00' },
                  { admin: 'system', action: 'toggle registrations', target: 'Enabled', timestamp: '2026-05-27 09:30' },
                ].map((e, i) => (
                  <tr key={i} className="border-t border-gray-800 hover:bg-gray-900/50">
                    <td className="p-3 text-white">{e.admin}</td>
                    <td className="p-3 text-gray-400">{e.action}</td>
                    <td className="p-3 text-gray-400">{e.target}</td>
                    <td className="p-3 text-gray-500 font-mono text-xs">{e.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  );
}
