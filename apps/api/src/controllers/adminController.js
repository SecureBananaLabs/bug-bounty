import { ok, badRequest, serverError } from "../utils/response.js";
import {
  getUsers, updateUserStatus, getUserById,
  getFlaggedJobs, moderateJob,
  getDisputes, resolveDispute,
  getMetrics,
  getAuditLog,
  getPlatformSettings, updatePlatformSetting,
} from "../services/adminService.js";

// User Management
export async function listUsers(req, res) {
  try {
    const { search, role, status, page, limit } = req.query;
    const result = getUsers({
      search,
      role,
      status,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    });
    return ok(res, result);
  } catch (e) {
    return serverError(res, e.message);
  }
}

export async function getUser(req, res) {
  const user = getUserById(req.params.id);
  if (!user) return badRequest(res, "User not found");
  return ok(res, user);
}

export async function updateUser(req, res) {
  try {
    const { status } = req.body;
    if (!["active", "suspended", "banned"].includes(status)) {
      return badRequest(res, "Invalid status. Use: active, suspended, or banned.");
    }
    const user = updateUserStatus(req.params.id, status, req.user.id);
    return ok(res, user);
  } catch (e) {
    return e.status === 404 ? badRequest(res, e.message) : serverError(res, e.message);
  }
}

// Job Moderation
export async function listFlaggedJobs(req, res) {
  const { page, limit } = req.query;
  return ok(res, getFlaggedJobs({ page: parseInt(page) || 1, limit: parseInt(limit) || 10 }));
}

export async function moderateJobAction(req, res) {
  try {
    const { action, reason } = req.body;
    if (!["approve", "reject", "escalate"].includes(action)) {
      return badRequest(res, "Invalid action. Use: approve, reject, or escalate.");
    }
    const job = moderateJob(req.params.id, action, req.user.id, reason);
    return ok(res, job);
  } catch (e) {
    return e.status === 404 ? badRequest(res, e.message) : serverError(res, e.message);
  }
}

// Dispute Resolution
export async function listDisputes(req, res) {
  const { status, page, limit } = req.query;
  return ok(res, getDisputes({ status, page: parseInt(page) || 1, limit: parseInt(limit) || 10 }));
}

export async function resolveDisputeAction(req, res) {
  try {
    const { ruling } = req.body;
    if (!ruling || !["freelancer", "client", "refund"].includes(ruling.inFavor)) {
      return badRequest(res, "ruling.inFavor must be: freelancer, client, or refund");
    }
    const dispute = resolveDispute(req.params.id, ruling, req.user.id);
    return ok(res, dispute);
  } catch (e) {
    return e.status === 404 ? badRequest(res, e.message) : serverError(res, e.message);
  }
}

// Metrics
export async function metrics(_req, res) {
  return ok(res, getMetrics());
}

// Audit Log
export async function auditLog(req, res) {
  const { adminId, action, from, to, page, limit } = req.query;
  return ok(res, getAuditLog({
    adminId, action, from, to,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
  }));
}

// Platform Controls
export async function settings(_req, res) {
  return ok(res, getPlatformSettings());
}

export async function updateSettings(req, res) {
  try {
    const { key, value } = req.body;
    const allowed = ["registrationOpen", "jobPostingOpen"];
    if (!allowed.includes(key)) {
      return badRequest(res, `Invalid setting. Allowed: ${allowed.join(", ")}`);
    }
    if (typeof value !== "boolean") {
      return badRequest(res, "Value must be a boolean");
    }
    const result = updatePlatformSetting(key, value, req.user.id);
    return ok(res, result);
  } catch (e) {
    return serverError(res, e.message);
  }
}
