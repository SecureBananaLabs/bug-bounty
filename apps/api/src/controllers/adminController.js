import { ok } from "../utils/response.js";
import {
  getAdminMetrics,
  getAuditLog,
  getControls,
  getDispute,
  getDisputes,
  getFlaggedJobs,
  getUser,
  getUsers,
  moderateFlaggedJob,
  ruleOnDispute,
  setControl,
  setUserStatus
} from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  return ok(res, await getUsers(req.query));
}

export async function userDetail(req, res) {
  return ok(res, await getUser(req.params.id));
}

export async function updateUserStatus(req, res) {
  return ok(res, await setUserStatus(req.params.id, req.body, req.user), 200);
}

export async function flaggedJobs(req, res) {
  return ok(res, await getFlaggedJobs(req.query));
}

export async function moderateJob(req, res) {
  return ok(res, await moderateFlaggedJob(req.params.id, req.body, req.user));
}

export async function disputes(req, res) {
  return ok(res, await getDisputes(req.query));
}

export async function disputeDetail(req, res) {
  return ok(res, await getDispute(req.params.id));
}

export async function ruleDispute(req, res) {
  return ok(res, await ruleOnDispute(req.params.id, req.body, req.user));
}

export async function controls(req, res) {
  return ok(res, await getControls());
}

export async function toggleControl(req, res) {
  return ok(res, await setControl(req.params.key, req.body, req.user));
}

export async function auditLog(req, res) {
  return ok(res, await getAuditLog(req.query));
}
