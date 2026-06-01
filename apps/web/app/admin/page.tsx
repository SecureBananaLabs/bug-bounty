"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./admin.module.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isSuspended: boolean;
  isBanned: boolean;
  isVerified: boolean;
  trustScore: number;
  skills: string[];
  createdAt: string;
  postedJobs: string[];
  disputeCount: number;
}

interface FlaggedJob {
  id: string;
  jobId: string;
  jobTitle: string;
  reason: string;
  description: string;
  status: string;
  createdAt: string;
}

interface Dispute {
  id: string;
  jobTitle: string;
  clientName: string;
  freelancerName: string;
  reason: string;
  evidence: string;
  status: string;
  rulingSide: string;
  createdAt: string;
  rulingNote?: string;
}

interface DashboardMetrics {
  totalUsers: number;
  activeJobs: number;
  openDisputes: number;
  flaggedListings: number;
  revenue: number;
  trustDistribution: { range: string; count: number }[];
}

// ---------------------------------------------------------------------------
// Admin API helper (uses mock data when backend not available)
// ---------------------------------------------------------------------------

const MOCK_USERS: User[] = [
  { id: "user-1",  email: "alice@example.com",   fullName: "Alice Chen",       role: "FREELANCER", isSuspended: false, isBanned: false, isVerified: true, trustScore: 85, skills: ["React","Node.js"], createdAt: "2025-01-15T08:00:00Z", postedJobs: [], disputeCount: 0 },
  { id: "user-2",  email: "bob@example.com",     fullName: "Bob Martinez",     role: "CLIENT",     isSuspended: false, isBanned: false, isVerified: true, trustScore: 72, skills: [], createdAt: "2025-02-10T10:30:00Z", postedJobs: ["job-1","job-2"], disputeCount: 1 },
  { id: "user-3",  email: "charlie@example.com", fullName: "Charlie Okafor",   role: "FREELANCER", isSuspended: true,  isBanned: false, isVerified: false, trustScore: 30, skills: ["Python","ML"], createdAt: "2025-03-05T14:00:00Z", postedJobs: [], disputeCount: 2 },
  { id: "user-4",  email: "diana@example.com",   fullName: "Diana Torres",     role: "CLIENT",     isSuspended: false, isBanned: true,  isVerified: false, trustScore: 10, skills: [], createdAt: "2025-01-20T09:00:00Z", postedJobs: [], disputeCount: 3 },
  { id: "user-5",  email: "elena@example.com",   fullName: "Elena Voss",       role: "FREELANCER", isSuspended: false, isBanned: false, isVerified: true, trustScore: 92, skills: ["TypeScript","GraphQL"], createdAt: "2025-04-10T11:00:00Z", postedJobs: [], disputeCount: 0 },
  { id: "user-6",  email: "frank@example.com",   fullName: "Frank Liu",        role: "CLIENT",     isSuspended: false, isBanned: false, isVerified: true, trustScore: 65, skills: [], createdAt: "2025-03-22T16:00:00Z", postedJobs: ["job-6"], disputeCount: 0 },
];

const MOCK_FLAGS: FlaggedJob[] = [
  { id: "flag-1", jobId: "job-3", jobTitle: "Crypto mining bot",   reason: "AUTOMATED",     description: "Detected prohibited crypto-mining keyword",           status: "PENDING",  createdAt: "2025-05-20T12:00:00Z" },
  { id: "flag-2", jobId: "job-4", jobTitle: "Write my thesis",     reason: "USER_REPORTED", description: "Reported as academic dishonesty",                     status: "PENDING",  createdAt: "2025-05-22T15:30:00Z" },
  { id: "flag-3", jobId: "job-5", jobTitle: "Adult content mod",   reason: "AUTOMATED",     description: "Suspected adult-content category mismatch",            status: "APPROVED", createdAt: "2025-05-18T10:00:00Z" },
  { id: "flag-4", jobId: "job-7", jobTitle: "Blockchain SEO",      reason: "USER_REPORTED", description: "Reported for misleading description",                 status: "PENDING",  createdAt: "2025-05-28T09:00:00Z" },
];

const MOCK_DISPUTES: Dispute[] = [
  { id: "disp-1", jobTitle: "E-commerce dashboard",         clientName: "Bob Martinez",   freelancerName: "Alice Chen",    reason: "Deliverable does not match spec", evidence: "Screenshots attached", status: "OPEN",         rulingSide: "NONE",       createdAt: "2025-05-25T08:00:00Z" },
  { id: "disp-2", jobTitle: "API integration",              clientName: "Diana Torres",   freelancerName: "Charlie Okafor", reason: "Missed deadline by 3 weeks",  evidence: "Contract + emails",    status: "UNDER_REVIEW", rulingSide: "NONE",       createdAt: "2025-05-10T10:00:00Z" },
  { id: "disp-3", jobTitle: "Logo design",                  clientName: "Bob Martinez",   freelancerName: "Charlie Okafor", reason: "Resolved via mutual agreement", evidence: "", status: "RESOLVED", rulingSide: "FREELANCER", createdAt: "2025-04-01T09:00:00Z", rulingNote: "Partial payment released" },
  { id: "disp-4", jobTitle: "Mobile app MVP",               clientName: "Frank Liu",      freelancerName: "Elena Voss",     reason: "Scope creep dispute",         evidence: "Messages + spec doc",  status: "OPEN",         rulingSide: "NONE",       createdAt: "2025-05-30T14:00:00Z" },
];

function computeMetrics(): DashboardMetrics {
  const buckets = { "0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0 };
  MOCK_USERS.forEach((u) => {
    const s = u.trustScore;
    if (s <= 20) buckets["0-20"]++; else if (s <= 40) buckets["21-40"]++; else if (s <= 60) buckets["41-60"]++; else if (s <= 80) buckets["61-80"]++; else buckets["81-100"]++;
  });
  return {
    totalUsers: MOCK_USERS.length,
    activeJobs: 42,
    openDisputes: MOCK_DISPUTES.filter(d => d.status === "OPEN").length,
    flaggedListings: MOCK_FLAGS.filter(f => f.status === "PENDING").length,
    revenue: 128900,
    trustDistribution: Object.entries(buckets).map(([range, count]) => ({ range, count })),
  };
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

type TabId = "dashboard" | "users" | "moderation" | "disputes" | "settings";

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: "dashboard", label: "📊 Dashboard" },
  { id: "users", label: "👥 Users" },
  { id: "moderation", label: "🚩 Moderation" },
  { id: "disputes", label: "⚖️ Disputes" },
  { id: "settings", label: "⚙️ Settings" },
];

// ---------------------------------------------------------------------------
// Admin Panel Component
// ---------------------------------------------------------------------------

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [metrics, setMetrics] = useState<DashboardMetrics>(computeMetrics());
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [flags, setFlags] = useState<FlaggedJob[]>(MOCK_FLAGS);
  const [disputes, setDisputes] = useState<Dispute[]>(MOCK_DISPUTES);
  const [settings, setSettings] = useState<Record<string, string>>({
    registrationsEnabled: "true",
    maintenanceMode: "false",
    maxJobBudget: "50000",
    defaultTrustScore: "50",
  });
  const [notification, setNotification] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("");

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const refreshMetrics = useCallback(() => {
    setMetrics(computeMetrics());
    showNotification("Dashboard refreshed ✅");
  }, [showNotification]);

  // ── User Actions ─────────────────────────────────────────────────────────

  const suspendUser = (userId: string) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isSuspended: true } : u)));
    showNotification("User suspended");
  };

  const reinstateUser = (userId: string) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isSuspended: false } : u)));
    showNotification("User reinstated");
  };

  const banUser = (userId: string) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isBanned: true, isSuspended: true } : u)));
    showNotification("User permanently banned");
  };

  // ── Flag Actions ─────────────────────────────────────────────────────────

  const approveFlag = (flagId: string) => {
    setFlags((prev) => prev.map((f) => (f.id === flagId ? { ...f, status: "APPROVED" } : f)));
    showNotification("Flag approved – listing removed");
  };

  const rejectFlag = (flagId: string) => {
    setFlags((prev) => prev.map((f) => (f.id === flagId ? { ...f, status: "REJECTED" } : f)));
    showNotification("Flag rejected – listing restored");
  };

  const escalateFlag = (flagId: string) => {
    setFlags((prev) => prev.map((f) => (f.id === flagId ? { ...f, status: "ESCALATED" } : f)));
    showNotification("Flag escalated to senior admin");
  };

  // ── Dispute Actions ──────────────────────────────────────────────────────

  const ruleOnDispute = (disputeId: string, rulingSide: string) => {
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === disputeId
          ? { ...d, status: "RESOLVED" as const, rulingSide, rulingNote: `Ruled in favour of ${rulingSide.toLowerCase()}` }
          : d
      )
    );
    showNotification(`Dispute resolved – favoured ${rulingSide.toLowerCase()}`);
  };

  // ── Settings Actions ─────────────────────────────────────────────────────

  const toggleSetting = (key: string) => {
    setSettings((prev) => {
      const current = prev[key];
      const next = current === "true" ? "false" : "true";
      return { ...prev, [key]: next };
    });
    showNotification(`Setting updated`);
  };

  // ── Filtered lists ───────────────────────────────────────────────────────

  const filteredUsers = users.filter((u) => {
    if (userSearch) {
      const q = userSearch.toLowerCase();
      if (!u.fullName.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    }
    if (userRoleFilter && u.role !== userRoleFilter) return false;
    if (userStatusFilter === "active") { if (u.isSuspended || u.isBanned) return false; }
    if (userStatusFilter === "suspended") { if (!u.isSuspended) return false; }
    if (userStatusFilter === "banned") { if (!u.isBanned) return false; }
    return true;
  });

  const pendingFlags = flags.filter((f) => f.status === "PENDING");
  const pendingDisputes = disputes.filter((d) => d.status === "OPEN" || d.status === "UNDER_REVIEW");

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>🔐 Admin Panel</h2>
        <p className={styles.subtitle}>
          Moderators, trust metrics, and platform controls
        </p>
      </div>

      {notification && <div className={styles.notification}>{notification}</div>}

      {/* Tabs */}
      <nav className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ────── DASHBOARD TAB ────── */}
      {activeTab === "dashboard" && (
        <section>
          <div className={styles.sectionHeader}>
            <h3>Trust &amp; Metrics Dashboard</h3>
            <button className={styles.btnSecondary} onClick={refreshMetrics}>
              🔄 Refresh
            </button>
          </div>

          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricValue}>{metrics.totalUsers}</span>
              <span className={styles.metricLabel}>Total Users</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricValue}>{metrics.activeJobs}</span>
              <span className={styles.metricLabel}>Active Jobs</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricValue}>{metrics.openDisputes}</span>
              <span className={styles.metricLabel}>Open Disputes</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricValue}>{metrics.flaggedListings}</span>
              <span className={styles.metricLabel}>Flagged Listings</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricValue}>${metrics.revenue.toLocaleString()}</span>
              <span className={styles.metricLabel}>Revenue (Current Period)</span>
            </div>
          </div>

          <div className={styles.chartSection}>
            <h4>Trust Score Distribution</h4>
            <div className={styles.barChart}>
              {metrics.trustDistribution.map(({ range, count }) => {
                const maxCount = Math.max(...metrics.trustDistribution.map((b) => b.count), 1);
                const pct = (count / maxCount) * 100;
                return (
                  <div key={range} className={styles.barCol}>
                    <div className={styles.bar} style={{ height: `${pct}%` }}>
                      <span className={styles.barLabel}>{count}</span>
                    </div>
                    <span className={styles.barAxis}>{range}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ────── USERS TAB ────── */}
      {activeTab === "users" && (
        <section>
          <h3>User Management</h3>

          <div className={styles.filters}>
            <input
              className={styles.searchInput}
              placeholder="Search by name or email…"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
            <select className={styles.select} value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)}>
              <option value="">All Roles</option>
              <option value="CLIENT">Client</option>
              <option value="FREELANCER">Freelancer</option>
              <option value="ADMIN">Admin</option>
            </select>
            <select className={styles.select} value={userStatusFilter} onChange={(e) => setUserStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Trust</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td><strong>{user.fullName}</strong></td>
                    <td>{user.email}</td>
                    <td><span className={styles.roleBadge}>{user.role}</span></td>
                    <td>
                      {user.isBanned ? (
                        <span className={styles.badgeDanger}>Banned</span>
                      ) : user.isSuspended ? (
                        <span className={styles.badgeWarn}>Suspended</span>
                      ) : (
                        <span className={styles.badgeActive}>Active</span>
                      )}
                    </td>
                    <td>{user.trustScore}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className={styles.actionCell}>
                      {!user.isSuspended && (
                        <button className={styles.btnSmallWarn} onClick={() => suspendUser(user.id)}>
                          Suspend
                        </button>
                      )}
                      {user.isSuspended && !user.isBanned && (
                        <button className={styles.btnSmall} onClick={() => reinstateUser(user.id)}>
                          Reinstate
                        </button>
                      )}
                      {!user.isBanned && (
                        <button className={styles.btnSmallDanger} onClick={() => banUser(user.id)}>
                          Ban
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className={styles.emptyCell}>
                      No users match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ────── MODERATION TAB ────── */}
      {activeTab === "moderation" && (
        <section>
          <h3>Job &amp; Listing Moderation</h3>
          <p className={styles.sectionDesc}>
            {pendingFlags.length} flagged listing{pendingFlags.length !== 1 ? "s" : ""} awaiting review
          </p>

          {pendingFlags.length === 0 && (
            <div className={styles.card}>
              <p>✅ No pending flagged listings. All clear!</p>
            </div>
          )}

          {flags.map((flag) => (
            <div key={flag.id} className={styles.card}>
              <div className={styles.flagHeader}>
                <strong>{flag.jobTitle}</strong>
                <span className={`${styles.flagStatus} ${styles[`flagStatus${flag.status}`]}`}>
                  {flag.status}
                </span>
              </div>
              <p className={styles.flagMeta}>
                <span className={styles.flagReason}>{flag.reason === "AUTOMATED" ? "🤖 Automated" : "📩 User Reported"}</span>
                {" · "}
                {flag.description}
              </p>
              <p className={styles.flagMeta}>Flagged {new Date(flag.createdAt).toLocaleDateString()}</p>
              {flag.status === "PENDING" && (
                <div className={styles.actionRow}>
                  <button className={styles.btnSuccess} onClick={() => approveFlag(flag.id)}>
                    ✅ Approve (Remove)
                  </button>
                  <button className={styles.btnSecondary} onClick={() => rejectFlag(flag.id)}>
                    ❌ Reject (Keep)
                  </button>
                  <button className={styles.btnWarn} onClick={() => escalateFlag(flag.id)}>
                    ⬆️ Escalate
                  </button>
                </div>
              )}
              {flag.status === "REJECTED" && (
                <p className={styles.flagMeta}>Rejection reason: Violates platform policy</p>
              )}
            </div>
          ))}

          {flags.filter(f => f.status !== "PENDING").length > 0 && (
            <details className={styles.details}>
              <summary className={styles.detailsSummary}>
                🔍 Show resolved flags ({flags.filter(f => f.status !== "PENDING").length})
              </summary>
              {flags.filter(f => f.status !== "PENDING").map((flag) => (
                <div key={flag.id} className={styles.card}>
                  <div className={styles.flagHeader}>
                    <strong>{flag.jobTitle}</strong>
                    <span className={`${styles.flagStatus} ${styles[`flagStatus${flag.status}`]}`}>
                      {flag.status}
                    </span>
                  </div>
                  <p className={styles.flagMeta}>{flag.description}</p>
                </div>
              ))}
            </details>
          )}
        </section>
      )}

      {/* ────── DISPUTES TAB ────── */}
      {activeTab === "disputes" && (
        <section>
          <h3>Dispute Resolution</h3>
          <p className={styles.sectionDesc}>
            {pendingDisputes.length} open dispute{pendingDisputes.length !== 1 ? "s" : ""}
          </p>

          {disputes.map((dispute) => (
            <div key={dispute.id} className={styles.card}>
              <div className={styles.disputeHeader}>
                <div>
                  <strong>{dispute.jobTitle}</strong>
                  <span className={`${styles.disputeStatus} ${styles[`disputeStatus${dispute.status.replace("_","")}`]}`}>
                    {dispute.status.replace("_", " ")}
                  </span>
                </div>
              </div>
              <div className={styles.disputeParties}>
                <span>Client: {dispute.clientName}</span>
                <span>Freelancer: {dispute.freelancerName}</span>
              </div>
              <p><strong>Reason:</strong> {dispute.reason}</p>
              {dispute.evidence && <p><strong>Evidence:</strong> {dispute.evidence}</p>}
              {dispute.rulingNote && <p><strong>Ruling:</strong> {dispute.rulingNote}</p>}
              {dispute.evidence && (
                <details className={styles.details}>
                  <summary className={styles.detailsSummary}>📎 View evidence &amp; thread</summary>
                  <div className={styles.threadBox}>
                    <p><strong>System:</strong> Dispute opened on {new Date(dispute.createdAt).toLocaleDateString()}</p>
                    <p><strong>{dispute.clientName}:</strong> {dispute.reason}</p>
                    {dispute.evidence && <p><strong>Attached evidence:</strong> {dispute.evidence}</p>}
                  </div>
                </details>
              )}
              {(dispute.status === "OPEN" || dispute.status === "UNDER_REVIEW") && (
                <div className={styles.actionRow}>
                  <button className={styles.btnSuccess} onClick={() => ruleOnDispute(dispute.id, "FREELANCER")}>
                    👤 Rule for Freelancer
                  </button>
                  <button className={styles.btnWarn} onClick={() => ruleOnDispute(dispute.id, "CLIENT")}>
                    🏢 Rule for Client (Refund)
                  </button>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* ────── SETTINGS TAB ────── */}
      {activeTab === "settings" && (
        <section>
          <h3>Platform Controls</h3>

          <div className={styles.settingsList}>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <strong>New User Registrations</strong>
                <p>Allow new users to sign up</p>
              </div>
              <button
                className={`${styles.toggleBtn} ${settings.registrationsEnabled === "true" ? styles.toggleOn : styles.toggleOff}`}
                onClick={() => toggleSetting("registrationsEnabled")}
              >
                {settings.registrationsEnabled === "true" ? "🟢 Enabled" : "🔴 Disabled"}
              </button>
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <strong>Maintenance Mode</strong>
                <p>Put the platform in read-only mode</p>
              </div>
              <button
                className={`${styles.toggleBtn} ${settings.maintenanceMode === "true" ? styles.toggleOn : styles.toggleOff}`}
                onClick={() => toggleSetting("maintenanceMode")}
              >
                {settings.maintenanceMode === "true" ? "🟢 On" : "🔴 Off"}
              </button>
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <strong>Max Job Budget</strong>
                <p>Upper limit for job budgets (USD)</p>
              </div>
              <span className={styles.settingValue}>${Number(settings.maxJobBudget).toLocaleString()}</span>
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <strong>Default Trust Score</strong>
                <p>Initial trust score for new users</p>
              </div>
              <span className={styles.settingValue}>{settings.defaultTrustScore} / 100</span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
