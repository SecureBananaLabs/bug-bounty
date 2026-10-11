import { ok } from "../utils/response.js";
import {
  decideModerationItem,
  getAdminMetrics,
  getAuditLog,
  getControls,
  listDisputes,
  listModerationQueue,
  listUsers,
  ruleOnDispute,
  setControls,
  setUserStatus
} from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  return ok(res, await listUsers(req.query));
}

export async function updateUserStatus(req, res) {
  return ok(res, await setUserStatus(req.params.id, req.body, req.user));
}

export async function moderation(req, res) {
  return ok(res, await listModerationQueue(req.query));
}

export async function updateModeration(req, res) {
  return ok(res, await decideModerationItem(req.params.id, req.body, req.user));
}

export async function disputes(req, res) {
  return ok(res, await listDisputes(req.query));
}

export async function ruleDispute(req, res) {
  return ok(res, await ruleOnDispute(req.params.id, req.body, req.user));
}

export async function controls(req, res) {
  return ok(res, await getControls());
}

export async function updateControls(req, res) {
  return ok(res, await setControls(req.body, req.user));
}

export async function auditLog(req, res) {
  return ok(res, await getAuditLog(req.query));
}
