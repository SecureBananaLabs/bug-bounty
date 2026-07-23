/**
 * Admin Service Layer
 *
 * Provides business logic for admin operations:
 * - Platform metrics & dashboard
 * - User management (search, filter, suspend, ban, reinstate)
 * - Job moderation queue
 * - Dispute resolution
 * - Platform controls (registration/posting toggles)
 * - Audit logging
 */

import { listUsers, findUserById, updateUserStatus } from "./userService.js";
import { listJobs, findJobById, updateJobModeration } from "./jobService.js";

// --- In-memory stores ---
const disputes = [];
const auditLog = [];
let platformControls = {
  registrationsEnabled: true,
  jobPostingsEnabled: true,
};
let disputeIdCounter = 0;

// --- Audit Log ---
function recordAudit(adminId, action, details = {}) {
  const entry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    adminId,
    action,
    details,
    timestamp: new Date().toISOString(),
  };
  auditLog.push(entry);
  return entry;
}

// --- Platform Metrics ---
export async function getAdminMetrics() {
  const users = await listUsers();
  const jobs = await listJobs();

  const activeUsers = users.filter((u) => u.status === "active").length;
  const suspendedUsers = users.filter((u) => u.status === "suspended").length;
  const bannedUsers = users.filter((u) => u.status === "banned").length;
  const openJobs = jobs.filter((j) => j.status === "open").length;
  const flaggedJobs = jobs.filter((j) => j.flagged === true).length;
  const openDisputes = disputes.filter((d) => d.status === "open").length;
  const underReviewDisputes = disputes.filter((d) => d.status === "under_review").length;

  const trustScores = users.map((u) => u.trustScore ?? 50);
  const trustDistribution = {
    low: trustScores.filter((s) => s < 30).length,
    medium: trustScores.filter((s) => s >= 30 && s < 70).length,
    high: trustScores.filter((s) => s >= 70).length,
  };

  return {
    totalUsers: users.length,
    activeUsers,
    suspendedUsers,
    bannedUsers,
    totalJobs: jobs.length,
    openJobs,
    flaggedJobs,
    openDisputes,
    underReviewDisputes,
    resolvedDisputes: disputes.filter((d) => d.status === "resolved").length,
    trustDistribution,
    platformControls,
    monthlyVolume: 128900,
  };
}

// --- User Management ---
export async function getAdminUsers(query = {}) {
  const users = await listUsers();
  let filtered = [...users];

  if (query.search) {
    const s = query.search.toLowerCase();
    filtered = filtered.filter(
      (u) =>
        (u.name || "").toLowerCase().includes(s) ||
        (u.email || "").toLowerCase().includes(s)
    );
  }

  if (query.role) {
    filtered = filtered.filter((u) => u.role === query.role);
  }

  if (query.status) {
    filtered = filtered.filter((u) => u.status === query.status);
  }

  filtered.sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  const page = parseInt(query.page || "1", 10);
  const limit = parseInt(query.limit || "20", 10);
  const start = (page - 1) * limit;

  return {
    users: filtered.slice(start, start + limit),
    total: filtered.length,
    page,
    limit,
    totalPages: Math.ceil(filtered.length / limit),
  };
}

export async function adminGetUserDetail(userId) {
  const user = await findUserById(userId);
  if (!user) return null;

  const allJobs = await listJobs();
  const userJobs = allJobs.filter(
    (j) => j.clientId === userId || j.freelancerId === userId
  );
  const userDisputes = disputes.filter(
    (d) => d.clientId === userId || d.freelancerId === userId
  );

  return { ...user, jobs: userJobs, disputes: userDisputes };
}

export async function adminSetUserStatus(adminId, userId, status) {
  const validStatuses = ["active", "suspended", "banned"];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  const user = await updateUserStatus(userId, status);
  if (!user) return null;

  const actionMap = {
    suspended: "user_suspended",
    banned: "user_banned",
    active: "user_reinstated",
  };
  recordAudit(adminId, actionMap[status] || "user_status_changed", {
    targetUserId: userId,
    newStatus: status,
  });

  return user;
}

// --- Job Moderation ---
export async function getFlaggedJobs(query = {}) {
  const jobs = await listJobs();
  let flagged = jobs.filter((j) => j.flagged === true);

  if (query.status) {
    flagged = flagged.filter((j) => j.moderationStatus === query.status);
  }

  flagged.sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  const page = parseInt(query.page || "1", 10);
  const limit = parseInt(query.limit || "20", 10);
  const start = (page - 1) * limit;

  return {
    jobs: flagged.slice(start, start + limit),
    total: flagged.length,
    page,
    limit,
    totalPages: Math.ceil(flagged.length / limit),
  };
}

export async function moderateJob(adminId, jobId, action, reason = "") {
  const validActions = ["approve", "reject", "escalate"];
  if (!validActions.includes(action)) {
    throw new Error(`Invalid action: ${action}`);
  }

  const statusMap = { approve: "approved", reject: "rejected", escalate: "escalated" };
  const job = await updateJobModeration(jobId, statusMap[action], {
    moderatedBy: adminId,
    moderatedAt: new Date().toISOString(),
    moderationReason: reason,
  });

  if (!job) return null;

  recordAudit(adminId, `job_${action}d`, { targetJobId: jobId, reason });
  return job;
}

// --- Dispute Resolution ---
export async function getDisputes(query = {}) {
  let filtered = [...disputes];

  if (query.status) {
    filtered = filtered.filter((d) => d.status === query.status);
  }

  filtered.sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  const page = parseInt(query.page || "1", 10);
  const limit = parseInt(query.limit || "20", 10);
  const start = (page - 1) * limit;

  return {
    disputes: filtered.slice(start, start + limit),
    total: filtered.length,
    page,
    limit,
    totalPages: Math.ceil(filterged.length / limit),
  };
}

export async function getDisputeDetail(disputeId) {
  return disputes.find((d) => d.id === disputeId) || null;
}

export async function createDispute(clientId, freelancerId, jobId, reason, evidence = []) {
  const dispute = {
    id: `disp_${++disputeIdCounter}`,
    clientId,
    freelancerId,
    jobId,
    reason,
    evidence,
    status: "open",
    thread: [],
    ruling: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  disputes.push(dispute);
  return dispute;
}

export async function ruleOnDispute(adminId, disputeId, ruling) {
  const validRulings = ["client", "freelancer", "escalate"];
  if (!validRulings.includes(ruling)) {
    throw new Error(`Invalid ruling: ${ruling}`);
  }

  const dispute = disputes.find((d) => d.id === disputeId);
  if (!dispute) return null;

  const statusMap = { client: "resolved", freelancer: "resolved", escalate: "under_review" };
  dispute.status = statusMap[ruling];
  dispute.ruling = { decision: ruling, adminId, timestamp: new Date().toISOString() };
  dispute.updatedAt = new Date().toISOString();

  recordAudit(adminId, "dispute_ruled", { targetDisputeId: disputeId, ruling });
  return dispute;
}

// --- Platform Controls ---
export async function getPlatformControls() {
  return { ...platformControls };
}

export async function setPlatformControl(adminId, control, value) {
  const validControls = ["registrationsEnabled", "jobPostingsEnabled"];
  if (!validControls.includes(control)) {
    throw new Error(`Invalid control: ${control}`);
  }

  const oldValue = platformControls[control];
  platformControls[control] = Boolean(value);

  recordAudit(adminId, "platform_control_changed", {
    control,
    oldValue,
    newValue: platformControls[control],
  });

  return { ...platformControls };
}

// --- Audit Log ---
export async function getAuditLog(query = {}) {
  let filtered = [...auditLog];

  if (query.adminId) {
    filtered = filtered.filter((e) => e.adminId === query.adminId);
  }
  if (query.action) {
    filtered = filtered.filter((e) => e.action === query.action);
  }
  if (query.fromDate) {
    filtered = filtered.filter((e) => new Date(e.timestamp) >= new Date(query.fromDate));
  }
  if (query.toDate) {
    filtered = filtered.filter((e) => new Date(e.timestamp) <= new Date(query.toDate));
  }

  filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const page = parseInt(query.page || "1", 10);
  const limit = parseInt(query.limit || "50", 10);
  const start = (page - 1) * limit;

  return {
    entries: filtered.slice(start, start + limit),
    total: filtered.length,
    page,
    limit,
    totalPages: Math.ceil(filtered.length / limit),
  };
}
