import { ok } from "../utils/response.js";
import {
  applyDisputeAction,
  applyJobModerationAction,
  applyPlatformSettings,
  applyUserAction,
  getAdminMetrics,
  getAuditLog,
  getDisputes,
  getFlaggedJobs,
  getPlatformSettings,
  getUserDetail,
  getUsers
} from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  return ok(res, await getUsers(req.query));
}

export async function userDetail(req, res) {
  return ok(res, await getUserDetail(req.params.id));
}

export async function userAction(req, res) {
  return ok(res, await applyUserAction(req.params.id, req.body, req.user));
}

export async function flaggedJobs(req, res) {
  return ok(res, await getFlaggedJobs(req.query));
}

export async function jobModerationAction(req, res) {
  return ok(res, await applyJobModerationAction(req.params.id, req.body, req.user));
}

export async function disputes(req, res) {
  return ok(res, await getDisputes(req.query));
}

export async function disputeAction(req, res) {
  return ok(res, await applyDisputeAction(req.params.id, req.body, req.user));
}

export async function platformSettings(req, res) {
  return ok(res, await getPlatformSettings());
}

export async function updatePlatformSettings(req, res) {
  return ok(res, await applyPlatformSettings(req.body, req.user));
}

export async function auditLog(req, res) {
  return ok(res, await getAuditLog(req.query));
}
