import { ok, fail } from "../utils/response.js";
import * as adminService from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await adminService.getAdminMetrics());
}

export async function getUsers(req, res) {
  const { page = 1, limit = 10, role, status, q } = req.query;
  const data = await adminService.getUsers({ page, limit, role, status, q });
  return ok(res, data);
}

export async function updateUserStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  if (!['active', 'suspended', 'banned'].includes(status)) {
    return fail(res, "Invalid status", 400);
  }
  const result = await adminService.updateUserStatus(req.user.id, id, status);
  return ok(res, result);
}

export async function getModerationQueue(req, res) {
  const { page = 1, limit = 10 } = req.query;
  const data = await adminService.getModerationQueue({ page, limit });
  return ok(res, data);
}

export async function moderateJob(req, res) {
  const { id } = req.params;
  const { status, reason } = req.body;
  if (!['approved', 'rejected', 'escalated'].includes(status)) {
    return fail(res, "Invalid status", 400);
  }
  const result = await adminService.moderateJob(req.user.id, id, status, reason);
  return ok(res, result);
}

export async function getDisputes(req, res) {
  const { page = 1, limit = 10, status } = req.query;
  const data = await adminService.getDisputes({ page, limit, status });
  return ok(res, data);
}

export async function resolveDispute(req, res) {
  const { id } = req.params;
  const { ruling, refund, escalationReason } = req.body;
  const result = await adminService.resolveDispute(req.user.id, id, { ruling, refund, escalationReason });
  return ok(res, result);
}

export async function toggleControl(req, res) {
  const { setting, enabled } = req.body;
  const result = await adminService.toggleControl(req.user.id, setting, enabled);
  return ok(res, result);
}

export async function getAuditLog(req, res) {
  const { page = 1, limit = 20, adminId, actionType } = req.query;
  const data = await adminService.getAuditLog({ page, limit, adminId, actionType });
  return ok(res, data);
}
