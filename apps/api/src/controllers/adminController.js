import { ok, fail } from "../utils/response.js";
import {
  listUsers,
  getUserProfile as fetchUserProfile,
  suspendUser,
  reinstateUser,
  banUser,
  listFlaggedJobs,
  getModerationJob as fetchModerationJob,
  moderateListing,
  listDisputes,
  getDispute as fetchDispute,
  resolveDispute as resolveDisputeRecord,
  getPlatformControls,
  setPlatformControls,
  getAuditLog,
  getAdminMetrics,
} from "../services/adminService.js";

// ---- User Management ----
export async function getUsers(req, res) {
  const result = await listUsers({
    search: req.query.search,
    role: req.query.role,
    status: req.query.status,
    joinedBefore: req.query.joinedBefore,
    page: req.query.page,
    pageSize: req.query.pageSize,
  });
  return ok(res, result);
}

export async function getUserProfile(req, res) {
  const user = await fetchUserProfile(req.params.userId);
  if (!user) return fail(res, "User not found", 404);
  return ok(res, user);
}

export async function updateUserStatus(req, res) {
  const { action } = req.params;
  const { reason } = req.body || {};
  const fn = {
    suspend: suspendUser,
    reinstate: reinstateUser,
    ban: banUser,
  }[action];
  if (!fn) return fail(res, "Invalid status action", 400);
  const user = await fn(req.user.sub, req.params.userId, reason);
  if (!user) return fail(res, "User not found", 404);
  return ok(res, user);
}

// ---- Job & Listing Moderation ----
export async function getFlaggedJobs(req, res) {
  const result = await listFlaggedJobs({
    search: req.query.search,
    page: req.query.page,
    pageSize: req.query.pageSize,
  });
  return ok(res, result);
}

export async function getModerationJob(req, res) {
  const job = await fetchModerationJob(req.params.jobId);
  if (!job) return fail(res, "Job not found", 404);
  return ok(res, job);
}

export async function moderateJob(req, res) {
  const { decision } = req.params;
  const { reason } = req.body || {};
  if (!["approve", "reject", "escalate"].includes(decision)) {
    return fail(res, "Invalid decision", 400);
  }
  const job = await moderateListing(req.user.sub, req.params.jobId, decision, reason);
  if (!job) return fail(res, "Job not found", 404);
  return ok(res, job);
}

// ---- Dispute Resolution ----
export async function getDisputes(req, res) {
  const result = await listDisputes({
    status: req.query.status,
    search: req.query.search,
    page: req.query.page,
    pageSize: req.query.pageSize,
  });
  return ok(res, result);
}

export async function getDispute(req, res) {
  const dispute = await fetchDispute(req.params.disputeId);
  if (!dispute) return fail(res, "Dispute not found", 404);
  return ok(res, dispute);
}

export async function resolveDispute(req, res) {
  const { ruling } = req.params;
  const { refund, reason } = req.body || {};
  if (!["freelancer", "client", "escalate"].includes(ruling)) {
    return fail(res, "Invalid ruling", 400);
  }
  const dispute = await resolveDisputeRecord(req.user.sub, req.params.disputeId, ruling, { refund: !!refund, reason });
  if (!dispute) return fail(res, "Dispute not found", 404);
  return ok(res, dispute);
}

// ---- Platform Controls ----
export async function getControls(req, res) {
  return ok(res, await getPlatformControls());
}

export async function updateControls(req, res) {
  const { registrationsEnabled, jobPostingsEnabled } = req.body || {};
  const result = await setPlatformControls(req.user.sub, { registrationsEnabled, jobPostingsEnabled });
  return ok(res, result);
}

// ---- Audit Log ----
export async function getAudit(req, res) {
  const result = await getAuditLog({
    admin: req.query.admin,
    action: req.query.action,
    from: req.query.from,
    to: req.query.to,
    page: req.query.page,
    pageSize: req.query.pageSize,
  });
  return ok(res, result);
}

// ---- Metrics ----
export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}
