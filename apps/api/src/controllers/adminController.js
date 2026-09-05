import { ok, fail } from "../utils/response.js";
import {
  getAdminMetrics, getUsers, updateUserStatus,
  getFlaggedJobs, moderateJob,
  getDisputes, resolveDispute,
  getAuditLog, updatePlatformSettings,
} from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function listUsers(req, res) {
  const { page, limit, role, status, search } = req.query;
  return ok(res, await getUsers({ page: +page || 1, limit: +limit || 10, role, status, search }));
}

export async function updateUser(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  if (!["active", "suspended", "banned"].includes(status)) return fail(res, "Invalid status", 400);
  return ok(res, await updateUserStatus(id, status, req.user.id));
}

export async function listFlaggedJobs(req, res) {
  const { page, limit } = req.query;
  return ok(res, await getFlaggedJobs({ page: +page || 1, limit: +limit || 10 }));
}

export async function moderateFlaggedJob(req, res) {
  const { id } = req.params;
  const { action, reason } = req.body;
  if (!["approved", "rejected", "escalated"].includes(action)) return fail(res, "Invalid action", 400);
  return ok(res, await moderateJob(id, action, reason, req.user.id));
}

export async function listDisputes(req, res) {
  const { page, limit, status } = req.query;
  return ok(res, await getDisputes({ page: +page || 1, limit: +limit || 10, status }));
}

export async function settleDispute(req, res) {
  const { id } = req.params;
  const { ruling } = req.body;
  if (!ruling) return fail(res, "Ruling is required", 400);
  return ok(res, await resolveDispute(id, ruling, req.user.id));
}

export async function listAuditLog(req, res) {
  const { page, limit, adminId, action } = req.query;
  return ok(res, await getAuditLog({ page: +page || 1, limit: +limit || 20, adminId, action }));
}

export async function patchSettings(req, res) {
  return ok(res, await updatePlatformSettings(req.body, req.user.id));
}
