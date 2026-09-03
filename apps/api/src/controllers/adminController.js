import {
  getAdminMetrics,
  getPlatformSettings,
  updatePlatformSettings,
  listUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  listJobs,
  updateJobStatus,
  listDisputes,
  resolveDispute,
  getAuditLog,
  appendAuditEntry,
  getFlaggedItems,
  clearFlag,
} from "../services/adminService.js";
import { ok, fail } from "../utils/response.js";

// ---------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------

export async function metrics(req, res) {
  const data = await getAdminMetrics();
  return ok(res, data);
}

// ---------------------------------------------------------------
// Platform settings
// ---------------------------------------------------------------

export async function settings_read(req, res) {
  const data = await getPlatformSettings();
  return ok(res, data);
}

export async function settings_update(req, res) {
  const patch = req.body;
  if (!patch || typeof patch !== "object") {
    return fail(res, "Request body must be an object of settings keys");
  }
  const updated = await updatePlatformSettings(patch);
  await appendAuditEntry({ adminId: req.user.sub, action: "settings_update", target: "platform", details: JSON.stringify(patch) });
  return ok(res, updated);
}

// ---------------------------------------------------------------
// Users
// ---------------------------------------------------------------

export async function users_list(req, res) {
  const { status, role, fullDetails } = req.query;
  const data = await listUsers({ status, role, fullDetails: fullDetails === "true" });
  return ok(res, data);
}

export async function users_get(req, res) {
  const user = await getUserById(req.params.userId);
  if (!user) return fail(res, "User not found", 404);
  return ok(res, user);
}

export async function users_updateStatus(req, res) {
  const { status } = req.body;
  if (!status) return fail(res, "`status` is required");

  const user = await updateUserStatus(req.params.userId, status);
  if (!user) return fail(res, "User not found", 404);

  await appendAuditEntry({ adminId: req.user.sub, action: `user_${status}`, target: req.params.userId, details: `Status set to ${status}` });
  return ok(res, user);
}

export async function users_updateRole(req, res) {
  const { role } = req.body;
  if (!role) return fail(res, "`role` is required");

  const user = await updateUserRole(req.params.userId, role);
  if (!user) return fail(res, "User not found", 404);

  await appendAuditEntry({ adminId: req.user.sub, action: "role_change", target: req.params.userId, details: `Role set to ${role}` });
  return ok(res, user);
}

// ---------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------

export async function jobs_list(req, res) {
  const { status } = req.query;
  const data = await listJobs({ status });
  return ok(res, data);
}

export async function jobs_updateStatus(req, res) {
  const { status } = req.body;
  if (!status) return fail(res, "`status` is required");

  const job = await updateJobStatus(req.params.jobId, status);
  if (!job) return fail(res, "Job not found", 404);

  await appendAuditEntry({ adminId: req.user.sub, action: `job_${status}`, target: req.params.jobId, details: `Job status set to ${status}` });
  return ok(res, job);
}

// ---------------------------------------------------------------
// Disputes
// ---------------------------------------------------------------

export async function disputes_list(req, res) {
  const { status } = req.query;
  const data = await listDisputes({ status });
  return ok(res, data);
}

export async function disputes_resolve(req, res) {
  const { ruling, refundAmount, message } = req.body;
  if (!ruling) return fail(res, "`ruling` is required");

  const dispute = await resolveDispute(req.params.disputeId, { ruling, refundAmount, message });
  if (!dispute) return fail(res, "Dispute not found", 404);

  await appendAuditEntry({ adminId: req.user.sub, action: "dispute_resolve", target: req.params.disputeId, details: `Ruling: ${ruling}` });
  return ok(res, dispute);
}

// ---------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------

export async function audit_list(req, res) {
  const { action, adminId } = req.query;
  const data = await getAuditLog({ action, adminId });
  return ok(res, data);
}

// ---------------------------------------------------------------
// Flag management
// ---------------------------------------------------------------

export async function flags_list(req, res) {
  const data = await getFlaggedItems();
  return ok(res, data);
}

export async function flags_clear(req, res) {
  const { type, id } = req.params;
  const result = await clearFlag(type, id);
  if (!result) return fail(res, "Flagged item not found", 404);

  await appendAuditEntry({ adminId: req.user.sub, action: "flag_clear", target: id, details: `Cleared flag on ${type}` });
  return ok(res, result);
}
