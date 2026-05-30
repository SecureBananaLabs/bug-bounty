import { ok } from "../utils/response.js";
import {
  decideFlaggedJob,
  getAdminMetrics,
  getPlatformControls,
  listAdminUsers,
  listAuditLog,
  listDisputes,
  listFlaggedJobs,
  ruleOnDispute,
  setPlatformControl,
  setUserStatus
} from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  return ok(res, await listAdminUsers(req.query));
}

export async function updateUserStatus(req, res) {
  return ok(res, await setUserStatus(req.params.userId, req.body.status, req.user.sub));
}

export async function moderationQueue(req, res) {
  return ok(res, await listFlaggedJobs(req.query));
}

export async function moderateJob(req, res) {
  return ok(res, await decideFlaggedJob(req.params.flagId, req.body.decision, req.body.reason, req.user.sub));
}

export async function disputeQueue(req, res) {
  return ok(res, await listDisputes(req.query));
}

export async function resolveDispute(req, res) {
  return ok(res, await ruleOnDispute(req.params.disputeId, req.body.ruling, req.user.sub));
}

export async function controls(req, res) {
  return ok(res, await getPlatformControls());
}

export async function updateControl(req, res) {
  return ok(res, await setPlatformControl(req.params.control, req.body.enabled, req.user.sub));
}

export async function audit(req, res) {
  return ok(res, await listAuditLog(req.query));
}
