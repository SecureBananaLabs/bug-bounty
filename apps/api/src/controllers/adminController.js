import { ok } from "../utils/response.js";
import {
  getAdminMetrics,
  getAdminUser,
  getDispute,
  getPlatformControls,
  listAdminNotifications,
  listAdminUsers,
  listAuditLog,
  listDisputes,
  listModerationQueue,
  moderateListing,
  ruleOnDispute,
  updatePlatformControl,
  updateUserStatus
} from "../services/adminService.js";

function adminId(req) {
  return req.user?.sub ?? "unknown-admin";
}

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  return ok(res, await listAdminUsers(req.query));
}

export async function userDetail(req, res) {
  return ok(res, await getAdminUser(req.params.userId));
}

export async function userStatus(req, res) {
  return ok(res, await updateUserStatus(req.params.userId, req.body.status, adminId(req)));
}

export async function moderationQueue(req, res) {
  return ok(res, await listModerationQueue(req.query));
}

export async function moderationAction(req, res) {
  return ok(res, await moderateListing(req.params.jobId, req.body.action, req.body.reason, adminId(req)));
}

export async function disputes(req, res) {
  return ok(res, await listDisputes(req.query));
}

export async function disputeDetail(req, res) {
  return ok(res, await getDispute(req.params.disputeId));
}

export async function disputeRuling(req, res) {
  return ok(res, await ruleOnDispute(req.params.disputeId, req.body.ruling, adminId(req)));
}

export async function controls(req, res) {
  return ok(res, await getPlatformControls());
}

export async function controlUpdate(req, res) {
  return ok(res, await updatePlatformControl(req.body.control, req.body.enabled, adminId(req)));
}

export async function audit(req, res) {
  return ok(res, await listAuditLog(req.query));
}

export async function adminNotifications(req, res) {
  return ok(res, await listAdminNotifications());
}
