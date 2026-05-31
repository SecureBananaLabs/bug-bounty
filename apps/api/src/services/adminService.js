// ---------------------------------------------------------------
// In-memory data stores (shared across all admin operations)
// In production these would be Prisma/DB queries.
// ---------------------------------------------------------------

const users = [
  { id: "usr_1",  email: "alice@example.com",   role: "admin",      status: "active",   trustScore: 95, joinedAt: "2026-01-15" },
  { id: "usr_2",  email: "bob@bank.com",         role: "client",     status: "active",   trustScore: 88, joinedAt: "2026-02-10" },
  { id: "usr_3",  email: "carol@freelance.dev",  role: "freelancer", status: "active",   trustScore: 72, joinedAt: "2026-03-05" },
  { id: "usr_4",  email: "dave@sketchy.org",     role: "freelancer", status: "flagged",  trustScore: 18, joinedAt: "2026-04-20" },
  { id: "usr_5",  email: "eve@corp.net",         role: "client",     status: "suspended",trustScore: 40, joinedAt: "2026-02-28" },
];

const jobs = [
  { id: "job_1", title: "Fix XSS on checkout page",   status: "pending",   clientId: "usr_2", createdAt: "2026-05-01", budget: 500 },
  { id: "job_2", title: "Audit smart contract",        status: "approved",  clientId: "usr_2", createdAt: "2026-05-03", budget: 2500 },
  { id: "job_3", title: "Pen-test internal VPN",       status: "rejected",  clientId: "usr_5", createdAt: "2026-05-05", budget: 1000 },
  { id: "job_4", title: "SQL injection remediation",   status: "flagged",   clientId: "usr_2", createdAt: "2026-05-08", budget: 800 },
  { id: "job_5", title: "Review OAuth flow",           status: "approved",  clientId: "usr_2", createdAt: "2026-05-10", budget: 1200 },
];

const disputes = [
  { id: "dis_1", jobId: "job_2", filedBy: "usr_2", reason: "Deliverable incomplete",           status: "open",       ruling: null, refundAmount: null, messages: [], createdAt: "2026-05-12" },
  { id: "dis_2", jobId: "job_5", filedBy: "usr_3", reason: "Client unresponsive after delivery", status: "escalated",  ruling: null, refundAmount: null, messages: [], createdAt: "2026-05-14" },
];

const auditLog = [
  { id: "log_1", adminId: "usr_1", action: "user_suspend",   target: "usr_5",  details: "Repeated policy violations", timestamp: "2026-05-10T14:22:00Z" },
  { id: "log_2", adminId: "usr_1", action: "job_reject",     target: "job_3",  details: "Against platform ToS",        timestamp: "2026-05-11T09:15:00Z" },
  { id: "log_3", adminId: "usr_1", action: "user_unsuspend", target: "usr_5",  details: "Appeal reviewed — 7-day probation", timestamp: "2026-05-13T16:40:00Z" },
];

const platformSettings = {
  registrationsOpen: true,
  jobPostingsOpen: true,
  minTrustScoreToApply: 30,
  autoFlagThreshold: 20,
};

// ---------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------

export async function getAdminMetrics() {
  const activeUsers = users.filter((u) => u.status === "active").length;
  const flaggedUsers = users.filter((u) => u.status === "flagged").length;
  const suspendedUsers = users.filter((u) => u.status === "suspended").length;
  const pendingJobs = jobs.filter((j) => j.status === "pending").length;
  const openDisputes = disputes.filter((d) => d.status !== "resolved").length;

  return {
    totalUsers: users.length,
    activeUsers,
    flaggedUsers,
    suspendedUsers,
    totalJobs: jobs.length,
    pendingJobs,
    approvedJobs: jobs.filter((j) => j.status === "approved").length,
    openDisputes,
    recentAuditEntries: auditLog.length,
  };
}

// ---------------------------------------------------------------
// Platform settings
// ---------------------------------------------------------------

export async function getPlatformSettings() {
  return platformSettings;
}

export async function updatePlatformSettings(patch) {
  Object.assign(platformSettings, patch);
  return platformSettings;
}

// ---------------------------------------------------------------
// User management
// ---------------------------------------------------------------

export async function listUsers(filters = {}) {
  let result = [...users];
  if (filters.status) result = result.filter((u) => u.status === filters.status);
  if (filters.role)   result = result.filter((u) => u.role === filters.role);

  // Strip emails unless `fullDetails` is requested (privacy)
  if (!filters.fullDetails) {
    result = result.map(({ email, ...rest }) => rest);
  }

  return result;
}

export async function getUserById(userId) {
  return users.find((u) => u.id === userId) ?? null;
}

export async function updateUserStatus(userId, status) {
  const user = users.find((u) => u.id === userId);
  if (!user) return null;
  user.status = status;
  return user;
}

export async function updateUserRole(userId, role) {
  const user = users.find((u) => u.id === userId);
  if (!user) return null;
  user.role = role;
  return user;
}

// ---------------------------------------------------------------
// Job management
// ---------------------------------------------------------------

export async function listJobs(filters = {}) {
  let result = [...jobs];
  if (filters.status) result = result.filter((j) => j.status === filters.status);
  return result;
}

export async function updateJobStatus(jobId, status) {
  const job = jobs.find((j) => j.id === jobId);
  if (!job) return null;
  job.status = status;
  return job;
}

// ---------------------------------------------------------------
// Disputes
// ---------------------------------------------------------------

export async function listDisputes(filters = {}) {
  let result = [...disputes];
  if (filters.status) result = result.filter((d) => d.status === filters.status);
  return result;
}

export async function resolveDispute(disputeId, resolution) {
  const dispute = disputes.find((d) => d.id === disputeId);
  if (!dispute) return null;

  dispute.status = "resolved";
  dispute.ruling = resolution.ruling ?? null;
  dispute.refundAmount = resolution.refundAmount ?? null;
  if (resolution.message) dispute.messages.push({ from: "admin", text: resolution.message, at: new Date().toISOString() });

  return dispute;
}

// ---------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------

export async function getAuditLog(filters = {}) {
  let result = [...auditLog];
  if (filters.action)  result = result.filter((e) => e.action === filters.action);
  if (filters.adminId) result = result.filter((e) => e.adminId === filters.adminId);
  // Latest first
  result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return result;
}

export async function appendAuditEntry(entry) {
  const record = {
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  auditLog.push(record);
  return record;
}

// ---------------------------------------------------------------
// Flag management
// ---------------------------------------------------------------

export async function getFlaggedItems() {
  return {
    users: users.filter((u) => u.status === "flagged"),
    jobs: jobs.filter((j) => j.status === "flagged"),
  };
}

export async function clearFlag(targetType, targetId) {
  if (targetType === "user") {
    const user = users.find((u) => u.id === targetId);
    if (!user || user.status !== "flagged") return null;
    user.status = "active";
    return user;
  }
  if (targetType === "job") {
    const job = jobs.find((j) => j.id === targetId);
    if (!job || job.status !== "flagged") return null;
    job.status = "pending";
    return job;
  }
  return null;
}
