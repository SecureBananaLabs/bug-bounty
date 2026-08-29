import {
  users,
  jobs,
  disputes,
  auditLog,
  platformControls,
  trustScoreDistribution,
  logAction,
  recomputeTrustDistribution,
} from "./adminStore.js";

// ---- Pagination helper (server-side, never full-table client fetches) ----
export function paginate(items, page = 1, pageSize = 10) {
  const total = items.length;
  const pageNum = Math.max(1, parseInt(page));
  const size = Math.max(1, Math.min(parseInt(pageSize) ?? 10, 100));
  const totalPages = Math.max(1, Math.ceil(total / size));
  const normalizedPage = Math.min(pageNum, totalPages);
  const start = (normalizedPage - 1) * size;
  const end = start + size;
  const slice = items.slice(start, end);
  return {
    items: slice,
    page: normalizedPage,
    pageSize: size,
    total,
    totalPages,
    hasNext: normalizedPage < totalPages,
    hasPrev: normalizedPage > 1,
  };
}

// ============================ USER MANAGEMENT ============================
export async function listUsers({ search, role, status, joinedBefore, page, pageSize }) {
  let result = users.slice();

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }
  if (role) result = result.filter((u) => u.role === role.toUpperCase());
  if (status) result = result.filter((u) => u.status === status.toUpperCase());
  if (joinedBefore) {
    const cutoff = new Date(joinedBefore);
    result = result.filter((u) => new Date(u.joinedAt) < cutoff);
  }

  return paginate(result, page, pageSize);
}

export async function getUserProfile(userId) {
  const user = users.find((u) => u.id === userId);
  if (!user) return null;
  const activeJobs = jobs.filter((j) => j.clientId === userId && ["OPEN", "IN_PROGRESS"].includes(j.status));
  const userDisputes = disputes.filter((d) => d.freelancerId === userId || d.clientId === userId);
  return { ...user, activeJobs, disputeHistory: userDisputes };
}

export async function updateUserStatus(adminId, userId, status) {
  const user = users.find((u) => u.id === userId);
  if (!user) return null;
  const prev = user.status;
  user.status = status;
  logAction(adminId, "user_status_change", userId, { from: prev, to: status });
  return user;
}

export async function banUser(adminId, userId, reason) {
  return updateUserStatus(adminId, userId, "BANNED");
}
export async function suspendUser(adminId, userId, reason) {
  return updateUserStatus(adminId, userId, "SUSPENDED");
}
export async function reinstateUser(adminId, userId) {
  return updateUserStatus(adminId, userId, "ACTIVE");
}

// ============================ JOB MODERATION ============================
export async function listFlaggedJobs({ search, page, pageSize }) {
  let result = jobs.filter((j) => j.flagged).map((j) => ({ ...j }));
  if (search) {
    const q = search.toLowerCase();
    result = result.filter((j) => j.title.toLowerCase().includes(q));
  }
  return paginate(result, page, pageSize);
}

export async function getModerationJob(jobId) {
  return jobs.find((j) => j.id === jobId) ?? null;
}

export async function moderateListing(adminId, jobId, decision, reason) {
  const job = jobs.find((j) => j.id === jobId);
  if (!job) return null;
  let meta = { decision, reason };
  if (decision === "approve") {
    job.flagged = false;
    job.flagReason = null;
    meta = { ...meta, status: job.status };
  } else if (decision === "reject") {
    job.flagged = false;
    job.flagReason = reason;
    job.moderationStatus = "rejected";
    // Trigger a notification to the posting user (service-layer side effect).
    meta = { ...meta, notifiedUserId: job.clientId };
  } else if (decision === "escalate") {
    job.moderationStatus = "escalated";
    meta.status = "escalated";
  }
  logAction(adminId, "listing_moderation", jobId, meta);
  return job;
}

// ============================ DISPUTE RESOLUTION ============================
export async function listDisputes({ status, search, page, pageSize }) {
  let result = disputes.map((d) => ({ ...d }));
  if (status) result = result.filter((d) => d.status === status);
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (d) =>
        d.thread?.some((t) => t.body.toLowerCase().includes(q)) ||
        d.id.toLowerCase().includes(q)
    );
  }
  return paginate(result, page, pageSize);
}

export async function getDispute(disputeId) {
  return disputes.find((d) => d.id === disputeId) ?? null;
}

export async function resolveDispute(adminId, disputeId, ruling, { refund = false, reason } = {}) {
  const dispute = disputes.find((d) => d.id === disputeId);
  if (!dispute) return null;
  const prev = dispute.status;
  if (ruling === "escalate") {
    dispute.status = "escalated";
  } else {
    dispute.status = "resolved";
    dispute.resolution = { inFavorOf: ruling, refund, reason, resolvedAt: new Date().toISOString() };
  }
  logAction(adminId, "dispute_resolution", disputeId, {
    from: prev,
    to: dispute.status,
    inFavorOf: ruling,
    refund,
    reason,
  });
  return dispute;
}

// ============================ PLATFORM CONTROLS ============================
export async function getPlatformControls() {
  return { ...platformControls };
}

export async function setPlatformControls(adminId, controls, logActionFn = logAction) {
  const changes = {};
  if ("registrationsEnabled" in controls) {
    changes.registrationsEnabled = { from: platformControls.registrationsEnabled, to: controls.registrationsEnabled };
    platformControls.registrationsEnabled = controls.registrationsEnabled;
  }
  if ("jobPostingsEnabled" in controls) {
    changes.jobPostingsEnabled = { from: platformControls.jobPostingsEnabled, to: controls.jobPostingsEnabled };
    platformControls.jobPostingsEnabled = controls.jobPostingsEnabled;
  }
  logActionFn(adminId, "platform_controls_update", null, changes);
  return { ...platformControls };
}

// ============================ AUDIT LOG ============================
export async function getAuditLog({ admin, action, from, to, page, pageSize }) {
  let result = auditLog.slice();
  if (admin) result = result.filter((a) => a.adminId === admin);
  if (action) result = result.filter((a) => a.action === action);
  const fromIdx = from ? new Date(from) : null;
  const toIdx = to ? new Date(to) : null;
  if (fromIdx) result = result.filter((a) => new Date(a.createdAt) >= fromIdx);
  if (toIdx) result = result.filter((a) => new Date(a.createdAt) <= toIdx);
  return paginate(result, page, pageSize);
}

// ============================ METRICS ============================
export async function getAdminMetrics() {
  recomputeTrustDistribution();
  const totalUsers = users.length;
  const activeJobs = jobs.filter((j) => ["OPEN", "IN_PROGRESS"].includes(j.status)).length;
  const openDisputes = disputes.filter((d) => d.status === "open" || d.status === "under_review").length;
  const flaggedListings = jobs.filter((j) => j.flagged).length;
  return {
    totalUsers,
    activeJobs,
    openDisputes,
    flaggedListings,
    monthlyVolume: 128900,
    trustScoreDistribution: { ...trustScoreDistribution },
  };
}
