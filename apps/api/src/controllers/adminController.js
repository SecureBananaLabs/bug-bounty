import { ok, fail } from "../utils/response.js";
import {
  getAdminMetrics,
  getUsers,
  getUserDetail,
  suspendUser,
  reinstateUser,
  banUser,
  getFlaggedJobs,
  approveJob,
  rejectJob,
  escalateJob,
  getDisputes,
  getDisputeDetail,
  ruleDispute,
  getPlatformControls,
  updatePlatformControl,
  getAuditLog,
} from "../services/adminService.js";

// Dashboard

export async function metrics(req, res) {
  const data = await getAdminMetrics();
  return ok(res, data);
}

// User management

export async function listUsers(req, res) {
  const { search, role, status, page, limit } = req.query;
  const data = await getUsers({ search, role, status, page, limit });
  return ok(res, data);
}

export async function userDetail(req, res) {
  const user = await getUserDetail(req.params.userId);
  if (!user) return fail(res, "User not found", 404);
  return ok(res, user);
}

export async function suspendUserHandler(req, res) {
  const user = await suspendUser(req.params.userId);
  if (!user) return fail(res, "User not found", 404);
  return ok(res, user);
}

export async function reinstateUserHandler(req, res) {
  const user = await reinstateUser(req.params.userId);
  if (!user) return fail(res, "User not found", 404);
  return ok(res, user);
}

export async function banUserHandler(req, res) {
  const user = await banUser(req.params.userId);
  if (!user) return fail(res, "User not found", 404);
  return ok(res, user);
}

// Content moderation

export async function listFlaggedJobs(req, res) {
  const { page, limit } = req.query;
  const data = await getFlaggedJobs({ page, limit });
  return ok(res, data);
}

export async function approveJobHandler(req, res) {
  const job = await approveJob(req.params.jobId);
  if (!job) return fail(res, "Job not found", 404);
  return ok(res, job);
}

export async function rejectJobHandler(req, res) {
  const { reason } = req.body;
  const job = await rejectJob(req.params.jobId, reason);
  if (!job) return fail(res, "Job not found", 404);
  return ok(res, job);
}

export async function escalateJobHandler(req, res) {
  const job = await escalateJob(req.params.jobId);
  if (!job) return fail(res, "Job not found", 404);
  return ok(res, job);
}

// Dispute handling

export async function listDisputes(req, res) {
  const { status, page, limit } = req.query;
  const data = await getDisputes({ status, page, limit });
  return ok(res, data);
}

export async function disputeDetail(req, res) {
  const dispute = await getDisputeDetail(req.params.disputeId);
  if (!dispute) return fail(res, "Dispute not found", 404);
  return ok(res, dispute);
}

export async function ruleDisputeHandler(req, res) {
  const { resolution } = req.body;
  if (!resolution) return fail(res, "Resolution is required", 400);
  const dispute = await ruleDispute(req.params.disputeId, resolution, req.user?.id || "admin-001");
  if (!dispute) return fail(res, "Dispute not found", 404);
  return ok(res, dispute);
}

// Platform controls

export async function listPlatformControls(req, res) {
  const data = await getPlatformControls();
  return ok(res, data);
}

export async function updatePlatformControlHandler(req, res) {
  const { value } = req.body;
  if (value === undefined || value === null) return fail(res, "Value is required", 400);
  const cfg = await updatePlatformControl(req.params.key, value, req.user?.id || "admin-001");
  if (!cfg) return fail(res, "Config key not found", 404);
  return ok(res, cfg);
}

// Audit log

export async function listAuditLog(req, res) {
  const { action, entityType, page, limit } = req.query;
  const data = await getAuditLog({ action, entityType, page, limit });
  return ok(res, data);
}
