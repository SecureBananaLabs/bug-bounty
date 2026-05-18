import { ok, fail } from "../utils/response.js";
import * as adminService from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await adminService.getAdminMetrics());
}

export async function getUsers(req, res) {
  const { page = 1, limit = 10, search, role, status } = req.query;
  const result = await adminService.listUsers({ page: parseInt(page), limit: parseInt(limit), search, role, status });
  return ok(res, result);
}

export async function updateUserStatus(req, res) {
  const { id } = req.params;
  const { status, reason } = req.body;
  
  if (!["active", "suspended", "banned"].includes(status)) {
    return fail(res, "Invalid status", 400);
  }

  const result = await adminService.setUserStatus(id, status, reason, req.user.sub);
  return ok(res, result);
}

export async function getModerationQueue(req, res) {
  const result = await adminService.getFlaggedContent();
  return ok(res, result);
}

export async function handleModeration(req, res) {
  const { id, action } = req.params;
  const { reason } = req.body;
  
  if (!["approve", "reject", "escalate"].includes(action)) {
    return fail(res, "Invalid action", 400);
  }

  const result = await adminService.processModeration(id, action, reason, req.user.sub);
  return ok(res, result);
}

export async function getDisputes(req, res) {
  const result = await adminService.listDisputes();
  return ok(res, result);
}

export async function resolveDispute(req, res) {
  const { id } = req.params;
  const { winner, resolution, refundAmount } = req.body;
  
  const result = await adminService.closeDispute(id, { winner, resolution, refundAmount }, req.user.sub);
  return ok(res, result);
}

export async function getAuditLogs(req, res) {
  const result = await adminService.fetchAuditLogs();
  return ok(res, result);
}

export async function updatePlatformControls(req, res) {
  const { type, enabled } = req.body;
  const result = await adminService.setPlatformControl(type, enabled, req.user.sub);
  return ok(res, result);
}
