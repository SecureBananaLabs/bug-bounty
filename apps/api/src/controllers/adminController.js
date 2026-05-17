import { ok, fail } from "../utils/response.js";
import {
  getAdminMetrics, getTrustDistribution,
  getUsers, updateUserStatus, getUserById,
  getFlaggedJobs, moderateFlaggedJob,
  getDisputes, ruleDispute,
  toggleRegistrations, togglePostings,
  getAuditLog,
} from "../services/adminService.js";

// ── Metrics ──

export async function metrics(req, res) {
  const data = await getAdminMetrics();
  return ok(res, { ...data, trustDistribution: getTrustDistribution() });
}

// ── Users ──

export async function listUsers(req, res) {
  const { search, role, status, page, limit } = req.query;
  return ok(res, getUsers({ search, role, status, page: Number(page) || 1, limit: Number(limit) || 10 }));
}

export async function setUserStatus(req, res) {
  const { userId, status } = req.body;
  if (!userId || !status) return fail(res, "userId and status required");
  const valid = ["active", "suspended", "banned"];
  if (!valid.includes(status)) return fail(res, `Status must be one of: ${valid.join(", ")}`);
  const result = updateUserStatus(req.user.id, userId, status);
  if (!result) return fail(res, "User not found", 404);
  return ok(res, result);
}

export async function userDetail(req, res) {
  const user = getUserById(req.params.userId);
  if (!user) return fail(res, "User not found", 404);
  return ok(res, user);
}

// ── Flagged Jobs ──

export async function listFlaggedJobs(req, res) {
  const { page, limit } = req.query;
  return ok(res, getFlaggedJobs({ page: Number(page) || 1, limit: Number(limit) || 10 }));
}

export async function moderateJob(req, res) {
  const { flagId, action, reason } = req.body;
  if (!flagId || !action) return fail(res, "flagId and action required");
  const valid = ["approved", "rejected", "escalated"];
  if (!valid.includes(action)) return fail(res, `Action must be one of: ${valid.join(", ")}`);
  const result = moderateFlaggedJob(req.user.id, flagId, action, reason);
  if (!result) return fail(res, "Flag not found", 404);
  return ok(res, result);
}

// ── Disputes ──

export async function listDisputes(req, res) {
  const { status, page, limit } = req.query;
  return ok(res, getDisputes({ status, page: Number(page) || 1, limit: Number(limit) || 10 }));
}

export async function resolveDispute(req, res) {
  const { disputeId, ruling } = req.body;
  if (!disputeId || !ruling) return fail(res, "disputeId and ruling required");
  const result = ruleDispute(req.user.id, disputeId, ruling);
  if (!result) return fail(res, "Dispute not found", 404);
  return ok(res, result);
}

// ── Platform Controls ──

export async function setRegistrations(req, res) {
  const { enabled } = req.body;
  if (typeof enabled !== "boolean") return fail(res, "enabled (boolean) required");
  return ok(res, toggleRegistrations(req.user.id, enabled));
}

export async function setPostings(req, res) {
  const { enabled } = req.body;
  if (typeof enabled !== "boolean") return fail(res, "enabled (boolean) required");
  return ok(res, togglePostings(req.user.id, enabled));
}

// ── Audit Log ──

export async function auditLog(req, res) {
  const { adminId, action, from, to, page, limit } = req.query;
  return ok(res, getAuditLog({ adminId, action, from, to, page: Number(page) || 1, limit: Number(limit) || 20 }));
}
