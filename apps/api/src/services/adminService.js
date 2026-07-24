// Admin Service — Platform moderation and metrics

// ── Metrics ────────────────────────────────────────────────
export async function getAdminMetrics() {
  return {
    overview: {
      openJobs: 42,
      activeFreelancers: 185,
      totalClients: 73,
      flaggedAccounts: 3,
      monthlyVolume: 128900,
      disputeRate: 1.2,
    },
    trends: {
      newUsersThisWeek: 24,
      newJobsThisWeek: 18,
      completedJobsThisWeek: 31,
      revenueThisMonth: 89450,
    },
    system: {
      uptime: "99.97%",
      avgResponseTimeMs: 142,
      errorRate: "0.03%",
      apiCallsToday: 284710,
    },
  };
}

// ── User Management ────────────────────────────────────────
const users = [
  { id: "u1", name: "Alice Chen", email: "alice@example.com", role: "freelancer", status: "active", joinedAt: "2026-01-15", flags: 0 },
  { id: "u2", name: "Bob Martinez", email: "bob@example.com", role: "client", status: "active", joinedAt: "2026-02-20", flags: 0 },
  { id: "u3", name: "Carol Wu", email: "carol@example.com", role: "freelancer", status: "flagged", joinedAt: "2026-03-10", flags: 3 },
  { id: "u4", name: "Dan Park", email: "dan@example.com", role: "client", status: "banned", joinedAt: "2025-11-05", flags: 8 },
  { id: "u5", name: "Eve Johnson", email: "eve@example.com", role: "freelancer", status: "active", joinedAt: "2026-04-01", flags: 1 },
  { id: "u6", name: "Frank Lee", email: "frank@example.com", role: "admin", status: "active", joinedAt: "2025-06-01", flags: 0 },
];

export async function listUsers({ status, role, page = 1, limit = 20 } = {}) {
  let filtered = [...users];
  if (status) filtered = filtered.filter((u) => u.status === status);
  if (role) filtered = filtered.filter((u) => u.role === role);
  const total = filtered.length;
  const start = (page - 1) * limit;
  return {
    users: filtered.slice(start, start + limit),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function updateUserStatus(userId, { status, reason }) {
  const user = users.find((u) => u.id === userId);
  if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });
  user.status = status;
  return {
    ...user,
    moderationNote: reason || `Status changed to ${status}`,
    moderatedAt: new Date().toISOString(),
  };
}

// ── Job Moderation ─────────────────────────────────────────
const flaggedJobs = [
  { id: "job-501", title: "Get rich quick scheme", postedBy: "u4", flags: 5, reason: "Spam/Scam", reportedAt: "2026-05-20" },
  { id: "job-502", title: "Inappropriate content request", postedBy: "u9", flags: 3, reason: "Policy violation", reportedAt: "2026-05-21" },
];

export async function listFlaggedJobs({ page = 1, limit = 20 } = {}) {
  const total = flaggedJobs.length;
  const start = (page - 1) * limit;
  return {
    jobs: flaggedJobs.slice(start, start + limit),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function moderateJob(jobId, { action, reason }) {
  const job = flaggedJobs.find((j) => j.id === jobId);
  if (!job) throw Object.assign(new Error("Job not found"), { statusCode: 404 });
  const index = flaggedJobs.indexOf(job);
  flaggedJobs.splice(index, 1);
  return {
    jobId,
    action,
    reason,
    moderatedAt: new Date().toISOString(),
  };
}

// ── Disputes ───────────────────────────────────────────────
const disputes = [
  { id: "d1", jobId: "job-101", filedBy: "u1", against: "u2", reason: "Payment not released", status: "open", filedAt: "2026-05-18" },
  { id: "d2", jobId: "job-205", filedBy: "u3", against: "u4", reason: "Work not as described", status: "open", filedAt: "2026-05-20" },
  { id: "d3", jobId: "job-310", filedBy: "u2", against: "u1", reason: "Missed deadline", status: "resolved", filedAt: "2026-05-10", resolvedAt: "2026-05-12" },
];

export async function listDisputes({ status, page = 1, limit = 20 } = {}) {
  let filtered = [...disputes];
  if (status) filtered = filtered.filter((d) => d.status === status);
  const total = filtered.length;
  const start = (page - 1) * limit;
  return {
    disputes: filtered.slice(start, start + limit),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function resolveDispute(disputeId, { resolution, refundAmount }) {
  const dispute = disputes.find((d) => d.id === disputeId);
  if (!dispute) throw Object.assign(new Error("Dispute not found"), { statusCode: 404 });
  dispute.status = "resolved";
  dispute.resolvedAt = new Date().toISOString();
  dispute.resolution = resolution;
  dispute.refundAmount = refundAmount || 0;
  return dispute;
}

// ── Audit Log ──────────────────────────────────────────────
const auditLogs = [
  { id: "log1", adminId: "u6", action: "ban_user", targetId: "u4", timestamp: "2026-05-22T10:30:00Z", details: "Repeated policy violations" },
  { id: "log2", adminId: "u6", action: "resolve_dispute", targetId: "d3", timestamp: "2026-05-22T14:15:00Z", details: "Refund issued: $200" },
  { id: "log3", adminId: "u6", action: "remove_job", targetId: "job-501", timestamp: "2026-05-21T09:00:00Z", details: "Spam content" },
];

export async function getAuditLog({ page = 1, limit = 50 } = {}) {
  const total = auditLogs.length;
  const start = (page - 1) * limit;
  return {
    logs: auditLogs.slice(start, start + limit),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ── Platform Config ────────────────────────────────────────
let platformConfig = {
  maxJobsPerClient: 10,
  requireEmailVerification: true,
  autoFlagThreshold: 3,
  maintenanceMode: false,
  allowedFileTypes: ["pdf", "docx", "jpg", "png", "zip"],
  maxFileSizeMb: 10,
};

export async function getPlatformConfig() {
  return platformConfig;
}

export async function updatePlatformConfig(updates) {
  platformConfig = { ...platformConfig, ...updates };
  return platformConfig;
}
