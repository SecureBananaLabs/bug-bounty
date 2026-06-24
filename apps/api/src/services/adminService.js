// ── Admin Service: User Management, Job Moderation, Disputes, Platform Controls, Audit ──

// Simulated in-memory stores for demo/development (replace with Prisma in production)
// Using a simple approach that works without a running database

let users = [];
let jobs = [];
let disputes = [];
let auditLogs = [];
let platformSettings = {
  registrationsOpen: true,
  jobPostingOpen: true,
};

// ── Metrics ──

export async function getAdminMetrics() {
  return {
    totalUsers: users.length || 245,
    activeJobs: jobs.filter((j) => j.status === "OPEN").length || 42,
    unresolvedDisputes: disputes.filter((d) => d.status === "OPEN" || d.status === "UNDER_REVIEW").length || 3,
    flaggedListings: jobs.filter((j) => j.isFlagged).length || 1,
    currentPeriodRevenue: 128900,
    trustScoreDistribution: {
      low: 15,
      medium: 120,
      high: 110,
    },
  };
}

// ── User Management ──

export async function getUsers({ search, role, status, page = 1, limit = 20 }) {
  let result = [...users];
  if (search) {
    const q = search.toLowerCase();
    result = result.filter((u) =>
      u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
  }
  if (role) result = result.filter((u) => u.role === role);
  if (status) result = result.filter((u) => u.status === status);

  const total = result.length;
  const start = (page - 1) * limit;
  const paged = result.slice(start, start + limit);

  return {
    users: paged,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getUserById(userId) {
  const user = users.find((u) => u.id === userId);
  if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });

  const userJobs = jobs.filter((j) => j.clientId === userId);
  const userDisputes = disputes.filter(
    (d) => d.clientId === userId || d.freelancerId === userId
  );

  return { ...user, jobs: userJobs, disputes: userDisputes };
}

export async function suspendUser(userId, adminId) {
  const user = users.find((u) => u.id === userId);
  if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });
  user.status = "SUSPENDED";
  await addAuditLog("USER_SUSPEND", "User", userId, `User suspended`, adminId);
  return user;
}

export async function resumeUser(userId, adminId) {
  const user = users.find((u) => u.id === userId);
  if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });
  user.status = "ACTIVE";
  await addAuditLog("USER_RESUMED", "User", userId, `User resumed`, adminId);
  return user;
}

export async function banUser(userId, adminId) {
  const user = users.find((u) => u.id === userId);
  if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });
  user.status = "BANNED";
  await addAuditLog("USER_BANNED", "User", userId, `User permanently banned`, adminId);
  return user;
}

// ── Job Moderation ──

export async function getFlaggedJobs({ page = 1, limit = 20 }) {
  const flagged = jobs.filter((j) => j.isFlagged);
  const total = flagged.length;
  const start = (page - 1) * limit;

  return {
    jobs: flagged.slice(start, start + limit),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function approveJob(jobId, adminId) {
  const job = jobs.find((j) => j.id === jobId);
  if (!job) throw Object.assign(new Error("Job not found"), { statusCode: 404 });
  job.isFlagged = false;
  job.flagReason = null;
  job.status = "OPEN";
  await addAuditLog("JOB_APPROVED", "Job", jobId, `Job approved from moderation queue`, adminId);
  return job;
}

export async function rejectJob(jobId, reason, adminId) {
  const job = jobs.find((j) => j.id === jobId);
  if (!job) throw Object.assign(new Error("Job not found"), { statusCode: 404 });
  job.isFlagged = false;
  job.status = "CANCELLED";
  await addAuditLog("JOB_REJECTED", "Job", jobId, `Job rejected: ${reason}`, adminId);
  return job;
}

export async function flagJob(jobId, reason, note, adminId) {
  const job = jobs.find((j) => j.id === jobId);
  if (!job) throw Object.assign(new Error("Job not found"), { statusCode: 404 });
  job.isFlagged = true;
  job.flagReason = reason;
  job.flagNote = note || null;
  await addAuditLog("JOB_FLAGGED", "Job", jobId, `Flagged: ${reason}`, adminId);
  return job;
}

// ── Dispute Resolution ──

export async function getDisputes({ status, page = 1, limit = 20 }) {
  let result = [...disputes];
  if (status) result = result.filter((d) => d.status === status);

  const total = result.length;
  const start = (page - 1) * limit;

  return {
    disputes: result.slice(start, start + limit),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getDisputeById(disputeId) {
  const dispute = disputes.find((d) => d.id === disputeId);
  if (!dispute) throw Object.assign(new Error("Dispute not found"), { statusCode: 404 });

  const client = users.find((u) => u.id === dispute.clientId);
  const freelancer = users.find((u) => u.id === dispute.freelancerId);
  const job = jobs.find((j) => j.id === dispute.jobId);

  return { ...dispute, client, freelancer, job };
}

export async function resolveDispute(disputeId, { resolution, favorClient, refund, escalated }, adminId) {
  const dispute = disputes.find((d) => d.id === disputeId);
  if (!dispute) throw Object.assign(new Error("Dispute not found"), { statusCode: 404 });

  if (escalated) {
    dispute.status = "ESCALATED";
    dispute.resolution = "Escalated to senior admin";
  } else if (favorClient) {
    dispute.status = "RESOLVED_CLIENT";
    dispute.resolution = resolution || "Resolved in favor of client";
  } else {
    dispute.status = "RESOLVED_FREELANCER";
    dispute.resolution = resolution || "Resolved in favor of freelancer";
  }

  dispute.resolvedBy = adminId;
  dispute.updatedAt = new Date();

  await addAuditLog(
    "DISPUTE_RESOLVED",
    "Dispute",
    disputeId,
    `Resolved: ${dispute.status}${refund ? " with refund" : ""}`,
    adminId
  );

  return dispute;
}

// ── Platform Controls ──

export async function getPlatformSettings() {
  return platformSettings;
}

export async function toggleRegistrations(open, adminId) {
  platformSettings.registrationsOpen = open;
  await addAuditLog(
    open ? "REGISTRATIONS_ENABLED" : "REGISTRATIONS_DISABLED",
    "Platform",
    null,
    `Registrations ${open ? "enabled" : "disabled"}`,
    adminId
  );
  return platformSettings;
}

export async function toggleJobPosting(open, adminId) {
  platformSettings.jobPostingOpen = open;
  await addAuditLog(
    open ? "JOB_POSTING_ENABLED" : "JOB_POSTING_DISABLED",
    "Platform",
    null,
    `Job posting ${open ? "enabled" : "disabled"}`,
    adminId
  );
  return platformSettings;
}

// ── Audit Log ──

async function addAuditLog(action, targetType, targetId, details, adminId) {
  const entry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    action,
    targetType,
    targetId,
    details,
    adminId,
    createdAt: new Date().toISOString(),
  };
  auditLogs.push(entry);
  return entry;
}

export async function getAuditLogs({ adminId, action, startDate, endDate, page = 1, limit = 50 }) {
  let result = [...auditLogs].reverse();

  if (adminId) result = result.filter((e) => e.adminId === adminId);
  if (action) result = result.filter((e) => e.action === action);
  if (startDate) result = result.filter((e) => new Date(e.createdAt) >= new Date(startDate));
  if (endDate) result = result.filter((e) => new Date(e.createdAt) <= new Date(endDate));

  const total = result.length;
  const start = (page - 1) * limit;

  return {
    logs: result.slice(start, start + limit),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
