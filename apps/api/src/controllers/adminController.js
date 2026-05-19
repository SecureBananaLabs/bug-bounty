import { ok, badRequest, serverError } from "../utils/response.js";
import {
  getUsers, updateUserStatus, getUserById,
  getFlaggedJobs, moderateJob,
  getDisputes, resolveDispute,
  getMetrics, getAuditLog,
  getPlatformSettings, updatePlatformSetting,
} from "../services/adminService.js";

export async function listUsers(req, res) {
  try {
    const { search, role, status, page, limit } = req.query;
    return ok(res, getUsers({ search, role, status, page: +page || 1, limit: +limit || 10 }));
  } catch (e) { return serverError(res, e.message); }
}

export async function getUser(req, res) {
  const user = getUserById(req.params.id);
  if (!user) return badRequest(res, "User not found");
  return ok(res, user);
}

export async function updateUser(req, res) {
  try {
    const { status } = req.body;
    if (!["active", "suspended", "banned"].includes(status))
      return badRequest(res, "Invalid status. Use: active, suspended, banned.");
    return ok(res, updateUserStatus(req.params.id, status, req.user.id));
  } catch (e) { return e.status === 404 ? badRequest(res, e.message) : serverError(res, e.message); }
}

export async function listFlaggedJobs(req, res) {
  const { page, limit } = req.query;
  return ok(res, getFlaggedJobs({ page: +page || 1, limit: +limit || 10 }));
}

export async function moderateJobAction(req, res) {
  try {
    const { action, reason } = req.body;
    if (!["approve", "reject", "escalate"].includes(action))
      return badRequest(res, "Invalid action. Use: approve, reject, escalate.");
    return ok(res, moderateJob(req.params.id, action, req.user.id, reason));
  } catch (e) { return e.status === 404 ? badRequest(res, e.message) : serverError(res, e.message); }
}

export async function listDisputes(req, res) {
  const { status, page, limit } = req.query;
  return ok(res, getDisputes({ status, page: +page || 1, limit: +limit || 10 }));
}

export async function resolveDisputeAction(req, res) {
  try {
    const { ruling } = req.body;
    if (!ruling || !["freelancer", "client", "refund"].includes(ruling.inFavor))
      return badRequest(res, "ruling.inFavor must be: freelancer, client, refund");
    return ok(res, resolveDispute(req.params.id, ruling, req.user.id));
  } catch (e) { return e.status === 404 ? badRequest(res, e.message) : serverError(res, e.message); }
}

export async function metrics(_req, res) { return ok(res, getMetrics()); }

export async function auditLog(req, res) {
  const { adminId, action, from, to, page, limit } = req.query;
  return ok(res, getAuditLog({ adminId, action, from, to, page: +page || 1, limit: +limit || 20 }));
}

export async function settings(_req, res) { return ok(res, getPlatformSettings()); }

export async function updateSettings(req, res) {
  try {
    const { key, value } = req.body;
    if (!["registrationOpen", "jobPostingOpen"].includes(key))
      return badRequest(res, "Invalid setting.");
    if (typeof value !== "boolean") return badRequest(res, "Value must be boolean");
    return ok(res, updatePlatformSetting(key, value, req.user.id));
  } catch (e) { return serverError(res, e.message); }
}
