import { ok, fail } from "../utils/response.js";
import * as svc from "../services/adminService.js";

// ─── Users ────────────────────────────────────────────
export async function listUsers(req, res) {
  const { page, limit, role, status, search } = req.query;
  try {
    const data = await svc.listUsers({
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 20, 100),
      role,
      status,
      search,
    });
    return ok(res, data);
  } catch (e) {
    return fail(res, e.message, 500);
  }
}

export async function suspendUser(req, res) {
  await svc.setUserStatus(req.params.id, "SUSPENDED");
  await svc.writeAuditLog({ adminId: req.user.id, action: "SUSPEND_USER", entityType: "User", entityId: req.params.id, details: "User suspended" });
  return ok(res, { message: "User suspended" });
}

export async function resumeUser(req, res) {
  await svc.setUserStatus(req.params.id, "ACTIVE");
  await svc.writeAuditLog({ adminId: req.user.id, action: "RESUME_USER", entityType: "User", entityId: req.params.id, details: "User resumed" });
  return ok(res, { message: "User resumed" });
}

export async function banUser(req, res) {
  await svc.setUserStatus(req.params.id, "BANNED");
  await svc.writeAuditLog({ adminId: req.user.id, action: "BAN_USER", entityType: "User", entityId: req.params.id, details: "User permanently banned" });
  return ok(res, { message: "User permanently banned" });
}

// ─── Job Moderation ────────────────────────────────────
export async function listFlaggedJobs(req, res) {
  const { page, limit } = req.query;
  const data = await svc.listFlaggedJobs({ page: parseInt(page) || 1, limit: Math.min(parseInt(limit) || 20, 100) });
  return ok(res, data);
}

export async function approveJob(req, res) {
  await svc.moderateJob(req.params.id, "APPROVED", null);
  await svc.writeAuditLog({ adminId: req.user.id, action: "APPROVE_JOB", entityType: "Job", entityId: req.params.id, details: "Job approved" });
  return ok(res, { message: "Job approved" });
}

export async function rejectJob(req, res) {
  const { reason } = req.body;
  if (!reason) return fail(res, "Rejection reason required", 400);
  await svc.moderateJob(req.params.id, "REJECTED", reason);
  await svc.writeAuditLog({ adminId: req.user.id, action: "REJECT_JOB", entityType: "Job", entityId: req.params.id, details: reason });
  return ok(res, { message: "Job rejected" });
}

export async function escalateJob(req, res) {
  await svc.moderateJob(req.params.id, "ESCALATED", null);
  await svc.writeAuditLog({ adminId: req.user.id, action: "ESCALATE_JOB", entityType: "Job", entityId: req.params.id, details: "Job escalated" });
  return ok(res, { message: "Job escalated to senior admin" });
}

// ─── Disputes ──────────────────────────────────────────
export async function listDisputes(req, res) {
  const { page, limit, status } = req.query;
  const data = await svc.listDisputes({ page: parseInt(page) || 1, limit: Math.min(parseInt(limit) || 20, 100), status });
  return ok(res, data);
}

export async function getDispute(req, res) {
  const dispute = await svc.getDispute(req.params.id);
  if (!dispute) return fail(res, "Dispute not found", 404);
  return ok(res, dispute);
}

export async function resolveDispute(req, res) {
  const { resolution } = req.body;
  if (!resolution) return fail(res, "Resolution required", 400);
  const dispute = await svc.resolveDispute(req.params.id, resolution, req.user.id);
  await svc.writeAuditLog({ adminId: req.user.id, action: "RESOLVE_DISPUTE", entityType: "Dispute", entityId: req.params.id, details: resolution });
  return ok(res, dispute);
}

// ─── Dashboard ─────────────────────────────────────────
export async function metrics(req, res) {
  try {
    const data = await svc.getDashboardMetrics();
    return ok(res, data);
  } catch (e) {
    return fail(res, e.message, 500);
  }
}

// ─── Platform Settings ────────────────────────────────
export async function getSettings(req, res) {
  const settings = await svc.getSettings();
  return ok(res, settings);
}

export async function updateSettings(req, res) {
  const { allowRegistration, allowJobPosting } = req.body;
  const updates = {};
  if (typeof allowRegistration === "boolean") updates.allowRegistration = allowRegistration;
  if (typeof allowJobPosting === "boolean") updates.allowJobPosting = allowJobPosting;
  if (Object.keys(updates).length === 0) return fail(res, "No valid settings provided", 400);
  const settings = await svc.updateSettings(updates, req.user.id);
  await svc.writeAuditLog({ adminId: req.user.id, action: "UPDATE_SETTINGS", entityType: "PlatformSettings", entityId: "default", details: JSON.stringify(updates) });
  return ok(res, settings);
}

// ─── Audit Log ─────────────────────────────────────────
export async function listAuditLogs(req, res) {
  const { page, limit, adminId, action } = req.query;
  const data = await svc.listAuditLogs({ page: parseInt(page) || 1, limit: Math.min(parseInt(limit) || 50, 200), adminId, action });
  return ok(res, data);
}
