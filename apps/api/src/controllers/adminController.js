import { ok } from "../utils/response.js";
import * as svc from "../services/adminService.js";

export async function getMetrics(req, res) { return ok(res, await svc.getAdminMetrics()); }

export async function listUsers(req, res) {
  const { role, status, search, page = 1, limit = 20 } = req.query;
  return ok(res, await svc.listUsers({ role, status, search, page: +page, limit: +limit }));
}
export async function getUserDetail(req, res) { return ok(res, await svc.getUserDetail(req.params.id)); }
export async function updateUserStatus(req, res) {
  const { status, reason } = req.body;
  return ok(res, await svc.updateUserStatus(req.params.id, status, req.user.sub, reason));
}

export async function listFlaggedJobs(req, res) {
  const { page = 1, limit = 20 } = req.query;
  return ok(res, await svc.listFlaggedJobs({ page: +page, limit: +limit }));
}
export async function moderateJob(req, res) {
  const { action, reason } = req.body;
  return ok(res, await svc.moderateJob(req.params.id, action, req.user.sub, reason));
}

export async function listDisputes(req, res) {
  const { status, page = 1, limit = 20 } = req.query;
  return ok(res, await svc.listDisputes({ status, page: +page, limit: +limit }));
}
export async function getDispute(req, res) { return ok(res, await svc.getDispute(req.params.id)); }
export async function resolveDispute(req, res) {
  const { ruling, reason } = req.body;
  return ok(res, await svc.resolveDispute(req.params.id, ruling, req.user.sub, reason));
}

export async function getPlatformSettings(req, res) { return ok(res, await svc.getPlatformSettings()); }
export async function updatePlatformSetting(req, res) {
  const { key, value } = req.body;
  return ok(res, await svc.updatePlatformSetting(key, value, req.user.sub));
}

export async function getAuditLog(req, res) {
  const { adminId, action, from, to, page = 1, limit = 50 } = req.query;
  return ok(res, await svc.getAuditLog({ adminId, action, from, to, page: +page, limit: +limit }));
}
