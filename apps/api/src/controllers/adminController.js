import { ok } from "../utils/response.js";
import {
  getAdminMetrics,
  getPlatformControls,
  getUserProfile,
  listAuditLog,
  listDisputes,
  listModerationQueue,
  listUsers,
  moderateListing,
  resolveDispute,
  updatePlatformControls,
  updateUserStatus
} from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  return ok(res, await listUsers(req.query));
}

export async function userProfile(req, res) {
  return ok(res, await getUserProfile(req.params.id));
}

export async function userAction(req, res) {
  return ok(res, await updateUserStatus(req.params.id, req.body, req.user.sub));
}

export async function moderation(req, res) {
  return ok(res, await listModerationQueue(req.query));
}

export async function moderationAction(req, res) {
  return ok(res, await moderateListing(req.params.id, req.body, req.user.sub));
}

export async function disputes(req, res) {
  return ok(res, await listDisputes(req.query));
}

export async function disputeAction(req, res) {
  return ok(res, await resolveDispute(req.params.id, req.body, req.user.sub));
}

export async function controls(req, res) {
  return ok(res, await getPlatformControls());
}

export async function updateControls(req, res) {
  return ok(res, await updatePlatformControls(req.body, req.user.sub));
}

export async function auditLog(req, res) {
  return ok(res, await listAuditLog(req.query));
}
