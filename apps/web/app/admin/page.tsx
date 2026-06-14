"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "../../lib/api";
import styles from "./page.module.css";

interface Metrics {
  totalUsers: number;
  totalJobs: number;
  pendingDisputes: number;
  monthlyVolume: number;
}

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
}

interface Dispute {
  id: string;
  reason: string;
  status: "PENDING" | "RESOLVED" | "REJECTED";
  resolution: string | null;
  createdAt: string;
  job: {
    id: string;
    title: string;
  };
  creator: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
  resolver?: {
    id: string;
    fullName: string;
  } | null;
}

interface AuditLog {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  admin: {
    id: string;
    fullName: string;
    email: string;
  };
}

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState<"metrics" | "users" | "disputes" | "audit_logs">("metrics");
  const [token, setToken] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State for resolving dispute
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState("");
  const [resolutionStatus, setResolutionStatus] = useState<"RESOLVED" | "REJECTED">("RESOLVED");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedToken = localStorage.getItem("token");
      setToken(savedToken);
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadAllData();
    }
  }, [token]);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load metrics
      const metricsRes = await fetchApi("/admin/metrics");
      setMetrics(metricsRes.data);

      // Load disputes
      const disputesRes = await fetchApi("/admin/disputes");
      setDisputes(disputesRes.data);

      // Load users
      const usersRes = await fetchApi("/users");
      setUsers(usersRes.data);

      // Load audit logs
      const auditLogsRes = await fetchApi("/admin/audit-logs");
      setAuditLogs(auditLogsRes.data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load dashboard data. Ensure your database is initialized.");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateAdminLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:4000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: `admin-${Date.now()}@freelanceflow.com`,
          password: "password123",
          role: "admin",
        }),
      });

      const payload = await response.json();
      if (payload.success && payload.data?.token) {
        localStorage.setItem("token", payload.data.token);
        setToken(payload.data.token);
      } else {
        throw new Error(payload.message || "Could not register test admin user");
      }
    } catch (err: any) {
      setError(err.message || "Failed to simulate admin token generation");
      setLoading(false);
    }
  };

  const handleClearToken = () => {
    localStorage.removeItem("token");
    setToken(null);
    setMetrics(null);
    setUsers([]);
    setDisputes([]);
    setAuditLogs([]);
  };

  const handleVerifyUser = async (userId: string, isVerified: boolean) => {
    setError(null);
    try {
      await fetchApi("/admin/users/verify", {
        method: "POST",
        body: JSON.stringify({ userId, isVerified }),
      });
      // reload
      await loadAllData();
    } catch (err: any) {
      setError(err.message || "Failed to update user verification state");
    }
  };

  const openResolutionModal = (disputeId: string) => {
    setSelectedDisputeId(disputeId);
    setResolutionText("");
    setResolutionStatus("RESOLVED");
    setModalOpen(true);
  };

  const handleResolveDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDisputeId) return;

    setError(null);
    try {
      await fetchApi("/admin/disputes/resolve", {
        method: "POST",
        body: JSON.stringify({
          disputeId: selectedDisputeId,
          status: resolutionStatus,
          resolution: resolutionText,
        }),
      });
      setModalOpen(false);
      setSelectedDisputeId(null);
      // reload
      await loadAllData();
    } catch (err: any) {
      setError(err.message || "Failed to resolve dispute");
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>
          <span style={{ color: "var(--color-neon-blue)" }}>⚡</span> Admin Platform Controls
        </h2>
        <p className={styles.subtitle}>
          Moderation queue, user credibility verification, financial audit logs, and conflict resolution dashboard.
        </p>
      </header>

      {/* Token Simulator Panel */}
      <div className={styles.simulatorAlert}>
        <div className={styles.simulatorInfo}>
          {token ? (
            <p>
              Authenticated with signed JWT. Role: <strong>ADMIN</strong>. Token verified successfully.
            </p>
          ) : (
            <p>
              No active Admin Session found. Click <strong>Generate Admin Session</strong> to spin up an admin user, save the token to <code>localStorage</code>, and unlock database controls.
            </p>
          )}
        </div>
        <div>
          {token ? (
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleClearToken}>
              Revoke Session
            </button>
          ) : (
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSimulateAdminLogin} disabled={loading}>
              {loading ? "Generating..." : "Generate Admin Session"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className={styles.errorContainer}>
          <h4 className={styles.errorTitle}>Action Failed</h4>
          <p>{error}</p>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={loadAllData} style={{ marginTop: "0.5rem" }}>
            Retry Loading
          </button>
        </div>
      )}

      {token && (
        <>
          {/* Stats Overview Grid */}
          <div className={styles.statsGrid}>
            <div className={`${styles.statCard} ${styles.statCardBlue}`}>
              <div className={styles.statLabel}>Total Users</div>
              <div className={styles.statValue}>{metrics?.totalUsers ?? 0}</div>
            </div>
            <div className={`${styles.statCard} ${styles.statCardPurple}`}>
              <div className={styles.statLabel}>Total Jobs</div>
              <div className={styles.statValue}>{metrics?.totalJobs ?? 0}</div>
            </div>
            <div className={`${styles.statCard} ${styles.statCardPink}`}>
              <div className={styles.statLabel}>Pending Disputes</div>
              <div className={styles.statValue}>{metrics?.pendingDisputes ?? 0}</div>
            </div>
            <div className={`${styles.statCard} ${styles.statCardGreen}`}>
              <div className={styles.statLabel}>Total Volume (USD)</div>
              <div className={styles.statValue}>
                ${metrics?.monthlyVolume ? metrics.monthlyVolume.toLocaleString() : "0"}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className={styles.tabGroup}>
            <button
              className={`${styles.tabButton} ${activeTab === "metrics" ? styles.activeTabButton : ""}`}
              onClick={() => setActiveTab("metrics")}
            >
              Overview
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === "users" ? styles.activeTabButton : ""}`}
              onClick={() => setActiveTab("users")}
            >
              User Verification
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === "disputes" ? styles.activeTabButton : ""}`}
              onClick={() => setActiveTab("disputes")}
            >
              Conflict Resolution ({disputes.filter((d) => d.status === "PENDING").length})
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === "audit_logs" ? styles.activeTabButton : ""}`}
              onClick={() => setActiveTab("audit_logs")}
            >
              Platform Audit Logs
            </button>
          </div>

          {loading && (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Refreshing platform metrics...</p>
            </div>
          )}

          {!loading && (
            <div className={styles.tabPanel}>
              {/* Tab 1: Overview Info */}
              {activeTab === "metrics" && (
                <div className={styles.tabContent}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Platform Health Summary</h3>
                  </div>
                  <div className={styles.tableContainer} style={{ padding: "1.5rem" }}>
                    <p style={{ color: "var(--color-text-secondary)", lineHeight: "1.6" }}>
                      This Admin Console controls critical tables on the FreelanceFlow network. By modifying records on this screen, you generate persistent <strong>Audit Logs</strong> linking your administrator profile to database updates.
                    </p>
                    <ul className={styles.detailsList} style={{ marginTop: "1rem" }}>
                      <li>
                        <strong>Conflict Queue Status:</strong> Currently tracking{" "}
                        <span style={{ color: "var(--color-neon-pink)" }}>
                          {disputes.filter((d) => d.status === "PENDING").length} open disputes
                        </span>{" "}
                        requiring moderator intervention.
                      </li>
                      <li>
                        <strong>User Base Security:</strong>{" "}
                        {users.filter((u) => u.isVerified).length} verified of {users.length} total active user accounts.
                      </li>
                      <li>
                        <strong>Recent Audit Logs:</strong> {auditLogs.length} admin events captured in database history.
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab 2: User Verification */}
              {activeTab === "users" && (
                <div className={styles.tabContent}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Credential Verification</h3>
                  </div>
                  {users.length === 0 ? (
                    <div className={styles.emptyState}>No users registered on the platform.</div>
                  ) : (
                    <div className={styles.tableContainer}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th className={styles.th}>Full Name</th>
                            <th className={styles.th}>Email Address</th>
                            <th className={styles.th}>Account Role</th>
                            <th className={styles.th}>Verification Status</th>
                            <th className={styles.th} style={{ textAlign: "right" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr key={user.id} className={styles.tr}>
                              <td className={`${styles.td} ${styles.tdHighlight}`}>{user.fullName}</td>
                              <td className={styles.td}>{user.email}</td>
                              <td className={styles.td}>
                                <span className={`${styles.badge} ${styles.badgeRole}`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className={styles.td}>
                                {user.isVerified ? (
                                  <span className={`${styles.badge} ${styles.badgeVerified}`}>
                                    VERIFIED
                                  </span>
                                ) : (
                                  <span className={`${styles.badge} ${styles.badgeUnverified}`}>
                                    UNVERIFIED
                                  </span>
                                )}
                              </td>
                              <td className={styles.td} style={{ textAlign: "right" }}>
                                {user.isVerified ? (
                                  <button
                                    className={`${styles.btn} ${styles.btnDanger}`}
                                    onClick={() => handleVerifyUser(user.id, false)}
                                  >
                                    Suspend Check
                                  </button>
                                ) : (
                                  <button
                                    className={`${styles.btn} ${styles.btnSuccess}`}
                                    onClick={() => handleVerifyUser(user.id, true)}
                                  >
                                    Verify Credentials
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Disputes Queue */}
              {activeTab === "disputes" && (
                <div className={styles.tabContent}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Escalated Disputes Queue</h3>
                  </div>
                  {disputes.length === 0 ? (
                    <div className={styles.emptyState}>No platform disputes filed. All jobs completed smoothly!</div>
                  ) : (
                    <div className={styles.tableContainer}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th className={styles.th}>Job Reference</th>
                            <th className={styles.th}>Complainant</th>
                            <th className={styles.th}>Dispute Details</th>
                            <th className={styles.th}>Status</th>
                            <th className={styles.th} style={{ textAlign: "right" }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {disputes.map((dispute) => (
                            <tr key={dispute.id} className={styles.tr}>
                              <td className={`${styles.td} ${styles.tdHighlight}`}>
                                {dispute.job?.title || "Unknown Job"}
                              </td>
                              <td className={styles.td}>
                                <div>{dispute.creator?.fullName}</div>
                                <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                                  {dispute.creator?.role}
                                </div>
                              </td>
                              <td className={styles.td}>
                                <div style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {dispute.reason}
                                </div>
                                {dispute.resolution && (
                                  <div style={{ fontSize: "0.8rem", color: "var(--color-neon-blue)", marginTop: "0.25rem" }}>
                                    Resolution: {dispute.resolution}
                                  </div>
                                )}
                              </td>
                              <td className={styles.td}>
                                {dispute.status === "PENDING" && (
                                  <span className={`${styles.badge} ${styles.badgePending}`}>PENDING</span>
                                )}
                                {dispute.status === "RESOLVED" && (
                                  <span className={`${styles.badge} ${styles.badgeResolved}`}>RESOLVED</span>
                                )}
                                {dispute.status === "REJECTED" && (
                                  <span className={`${styles.badge} ${styles.badgeRejected}`}>REJECTED</span>
                                )}
                              </td>
                              <td className={styles.td} style={{ textAlign: "right" }}>
                                {dispute.status === "PENDING" ? (
                                  <button
                                    className={`${styles.btn} ${styles.btnPrimary}`}
                                    onClick={() => openResolutionModal(dispute.id)}
                                  >
                                    Resolve Case
                                  </button>
                                ) : (
                                  <span style={{ fontSize: "0.85rem", fontStyle: "italic", opacity: 0.6 }}>
                                    Resolved by {dispute.resolver?.fullName || "Admin"}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Audit Logs */}
              {activeTab === "audit_logs" && (
                <div className={styles.tabContent}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Platform Admin Audit Trails</h3>
                  </div>
                  {auditLogs.length === 0 ? (
                    <div className={styles.emptyState}>No administration audit logs recorded.</div>
                  ) : (
                    <div className={styles.tableContainer}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th className={styles.th}>Timestamp</th>
                            <th className={styles.th}>Administrator</th>
                            <th className={styles.th}>Action</th>
                            <th className={styles.th}>Incident Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditLogs.map((log) => (
                            <tr key={log.id} className={styles.tr}>
                              <td className={styles.td} style={{ fontSize: "0.85rem" }}>
                                {new Date(log.createdAt).toLocaleString()}
                              </td>
                              <td className={`${styles.td} ${styles.tdHighlight}`}>
                                {log.admin?.fullName}
                              </td>
                              <td className={styles.td}>
                                <span
                                  className={styles.badge}
                                  style={{
                                    background: log.action.includes("RESOLVE") ? "rgba(6, 182, 212, 0.12)" : "rgba(139, 92, 246, 0.12)",
                                    color: log.action.includes("RESOLVE") ? "#22d3ee" : "#a78bfa",
                                    border: log.action.includes("RESOLVE") ? "1px solid rgba(6, 182, 212, 0.2)" : "1px solid rgba(139, 92, 246, 0.2)"
                                  }}
                                >
                                  {log.action}
                                </span>
                              </td>
                              <td className={styles.td} style={{ fontSize: "0.85rem" }}>{log.details}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Resolution Modal Overlay */}
      {modalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Resolve Platform Conflict</h3>
            </div>
            <form onSubmit={handleResolveDispute}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Resolution Outcome</label>
                  <select
                    className={styles.select}
                    value={resolutionStatus}
                    onChange={(e) => setResolutionStatus(e.target.value as any)}
                  >
                    <option value="RESOLVED">Approve Dispute (RESOLVED)</option>
                    <option value="REJECTED">Dismiss Dispute (REJECTED)</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Explanation / Details</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Provide details about the final arbitration outcome..."
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    required
                  ></textarea>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                  Commit Arbitration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
