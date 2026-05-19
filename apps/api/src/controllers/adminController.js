import { fail, ok } from "../utils/response.js";
import {
  getAdminMetrics,
  getAdminUser,
  getPlatformControls,
  listAdminUsers,
  listAuditLog,
  listDisputes,
  listModerationJobs,
  moderateJob,
  ruleOnDispute,
  updatePlatformControl,
  updateUserStatus
} from "../services/adminService.js";

function sendResult(res, result, status = 200) {
  if (result?.error) {
    return fail(res, result.error, result.statusCode ?? 400);
  }

  return ok(res, result, status);
}

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  return ok(res, await listAdminUsers(req.query));
}

export async function userProfile(req, res) {
  const user = await getAdminUser(req.params.userId);
  if (!user) {
    return fail(res, "User not found", 404);
  }

  return ok(res, user);
}

export async function userStatus(req, res) {
  const result = await updateUserStatus(req.params.userId, req.body?.status, req.user);
  return sendResult(res, result);
}

export async function moderationJobs(req, res) {
  return ok(res, await listModerationJobs(req.query));
}

export async function moderationAction(req, res) {
  const result = await moderateJob(req.params.jobId, req.body, req.user);
  return sendResult(res, result);
}

export async function disputes(req, res) {
  return ok(res, await listDisputes(req.query));
}

export async function disputeRuling(req, res) {
  const result = await ruleOnDispute(req.params.disputeId, req.body, req.user);
  return sendResult(res, result);
}

export async function controls(req, res) {
  return ok(res, await getPlatformControls());
}

export async function controlUpdate(req, res) {
  const result = await updatePlatformControl(req.params.controlName, req.body, req.user);
  return sendResult(res, result);
}

export async function auditLog(req, res) {
  return ok(res, await listAuditLog(req.query));
}
