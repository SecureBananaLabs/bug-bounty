import {
  getAdminMetrics, listUsers, updateUserStatus,
  listFlaggedJobs, moderateJob,
  listDisputes, resolveDispute,
  listAuditLog, getPlatformControls, setPlatformControl,
} from "../services/adminService.js";
import { ok, forbidden, badRequest } from "../utils/response.js";

function requireAdmin(req, res) {
  if (!req.user || req.user.role !== "admin") {
    forbidden(res, "Admin access required");
    return false;
  }
  return true;
}

export async function metrics(req, res) {
  if (!requireAdmin(req, res)) return;
  return ok(res, await getAdminMetrics());
}

export async function getUsers(req, res) {
  if (!requireAdmin(req, res)) return;
  const { page = 1, limit = 20, role, status, search } = req.query;
  return ok(res, await listUsers({ page: +page, limit: +limit, role, status, search }));
}

export async function patchUser(req, res) {
  if (!requireAdmin(req, res)) return;
  const { id } = req.params;
  const { action } = req.body; // suspend | reinstate | ban
  if (!["suspend", "reinstate", "ban"].includes(action))
    return badRequest(res, "action must be suspend, reinstate, or ban");
  return ok(res, await updateUserStatus(id, action, req.user.id));
}

export async function getFlaggedJobs(req, res) {
  if (!requireAdmin(req, res)) return;
  const { page = 1, limit = 20 } = req.query;
  return ok(res, await listFlaggedJobs({ page: +page, limit: +limit }));
}

export async function patchJob(req, res) {
  if (!requireAdmin(req, res)) return;
  const { id } = req.params;
  const { action, reason } = req.body; // approve | reject | escalate
  if (!["approve", "reject", "escalate"].includes(action))
    return badRequest(res, "action must be approve, reject, or escalate");
  return ok(res, await moderateJob(id, action, reason, req.user.id));
}

export async function getDisputes(req, res) {
  if (!requireAdmin(req, res)) return;
  const { page = 1, limit = 20, status } = req.query;
  return ok(res, await listDisputes({ page: +page, limit: +limit, status }));
}

export async function patchDispute(req, res) {
  if (!requireAdmin(req, res)) return;
  const { id } = req.params;
  const { ruling, notes } = req.body; // freelancer | client | escalate
  if (!["freelancer", "client", "escalate"].includes(ruling))
    return badRequest(res, "ruling must be freelancer, client, or escalate");
  return ok(res, await resolveDispute(id, ruling, notes, req.user.id));
}

export async function getAuditLog(req, res) {
  if (!requireAdmin(req, res)) return;
  const { page = 1, limit = 50, adminId, action, from, to } = req.query;
  return ok(res, await listAuditLog({ page: +page, limit: +limit, adminId, action, from, to }));
}

export async function getControls(req, res) {
  if (!requireAdmin(req, res)) return;
  return ok(res, await getPlatformControls());
}

export async function patchControl(req, res) {
  if (!requireAdmin(req, res)) return;
  const { key } = req.params;
  const { enabled } = req.body;
  if (typeof enabled !== "boolean") return badRequest(res, "enabled must be boolean");
  return ok(res, await setPlatformControl(key, enabled, req.user.id));
}
