'use client';

import React, { useState, useEffect } from 'react';

type AdminMetrics = {
  openJobs: number;
  activeFreelancers: number;
  flaggedAccounts: number;
  monthlyVolume: number;
  trustScoreAverage: number;
};

type User = {
  id: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
};

type AuditLog = {
  timestamp: string;
  adminId: string;
  action: string;
  targetId?: string;
  metadata: any;
};

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data fetching
    const fetchData = async () => {
      setLoading(true);
      // Simulated API delay
      await new Promise(r => setTimeout(r, 800));
      
      setMetrics({
        openJobs: 42,
        activeFreelancers: 185,
        flaggedAccounts: 3,
        monthlyVolume: 128900,
        trustScoreAverage: 8.4
      });

      setUsers(Array.from({ length: 10 }, (_, i) => ({
        id: `usr_${i}`,
        email: `user${i}@example.com`,
        role: i % 2 === 0 ? "freelancer" : "client",
        status: i % 5 === 0 ? "suspended" : "active",
        joinedAt: new Date(Date.now() - i * 86400000).toLocaleDateString()
      })));

      setLogs([
        { timestamp: new Date().toISOString(), adminId: "admin_1", action: "PLATFORM_CONTROL_UPDATE", metadata: { type: "registrations", enabled: false } },
        { timestamp: new Date(Date.now() - 3600000).toISOString(), adminId: "admin_1", action: "USER_BANNED", targetId: "usr_99", metadata: { reason: "fraud" } }
      ]);

      setLoading(false);
    };

    fetchData();
  }, []);

  const TabButton = ({ id, label }: { id: string, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 font-medium transition-colors ${
        activeTab === id ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleEmergencyLockdown = () => {
    if (confirm("🚨 WARNING: This will immediately disable ALL registrations and job postings. Proceed?")) {
      setActiveTab('audit');
      setLogs(prev => [{
        timestamp: new Date().toISOString(),
        adminId: "admin_1",
        action: "EMERGENCY_LOCKDOWN_TRIGGERED",
        metadata: { scope: "GLOBAL", reason: "Manual Emergency Trigger" }
      }, ...prev]);
      alert("System Secured. All new activity blocked.");
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Command Center</h1>
          <p className="text-muted-foreground">Strategic oversight and platform-wide controls.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={() => window.location.reload()}>Refresh State</button>
          <button className="btn btn-destructive" onClick={handleEmergencyLockdown}>Emergency Lockdown</button>
        </div>
      </header>

      <nav className="flex border-b border-border">
        <TabButton id="overview" label="Strategic Overview" />
        <TabButton id="users" label="User Management" />
        <TabButton id="moderation" label="Moderation Queue" />
        <TabButton id="audit" label="Audit Trail" />
      </nav>

      <main className="min-h-[600px]">
        {activeTab === 'overview' && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Total Volume" value={`$${metrics?.monthlyVolume.toLocaleString()}`} change="+12%" />
            <MetricCard title="Active Fleet" value={metrics?.activeFreelancers.toString() || '0'} change="+5%" />
            <MetricCard title="System Health" value={`${metrics?.trustScoreAverage}/10`} change="Stable" />
            <MetricCard title="Critical Alerts" value={metrics?.flaggedAccounts.toString() || '0'} change="Urgent" isAlert />
          </div>
        )}

        {activeTab === 'users' && (
          <div className="card overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-muted text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Joined</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                    <td className="p-4 font-medium">{user.email}</td>
                    <td className="p-4 capitalize">{user.role}</td>
                    <td className="p-4">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="p-4 text-muted-foreground">{user.joinedAt}</td>
                    <td className="p-4 text-right">
                      <button className="text-primary hover:underline mr-4">Audit</button>
                      <button className="text-destructive hover:underline">Ban</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-4">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-4 p-4 border border-border rounded-lg bg-card">
                <div className="text-xs font-mono text-muted-foreground pt-1">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{log.action}</div>
                  <div className="text-sm text-muted-foreground">
                    Admin <span className="text-primary">{log.adminId}</span> modified <span className="text-primary">{log.targetId || 'SYSTEM'}</span>
                  </div>
                  {log.metadata && (
                    <pre className="mt-2 text-[10px] bg-muted p-2 rounded overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function MetricCard({ title, value, change, isAlert }: { title: string, value: string, change: string, isAlert?: boolean }) {
  return (
    <div className={`p-6 rounded-xl border border-border bg-card shadow-sm ${isAlert ? 'ring-1 ring-destructive' : ''}`}>
      <div className="text-sm font-medium text-muted-foreground">{title}</div>
      <div className="text-2xl font-bold mt-1 text-foreground">{value}</div>
      <div className={`text-xs mt-2 ${isAlert ? 'text-destructive' : 'text-green-500'}`}>
        {change}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-500/10 text-green-500 border-green-500/20',
    suspended: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    banned: 'bg-red-500/10 text-red-500 border-red-500/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${styles[status] || styles.active}`}>
      {status.toUpperCase()}
    </span>
  );
}
