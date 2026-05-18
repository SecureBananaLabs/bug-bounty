import { ok, fail } from "../utils/response.js";
import {
  getAdminMetrics,
  listUsers,
  getUserById,
  updateUserStatus,
  listFlaggedJobs,
  moderateJob,
  listDisputes,
  getDisputeById,
  ruleOnDispute,
  getControls,
  updateControls,
  getAuditLog
} from "../services/adminService.js";
import {
  updateUserStatusSchema,
  moderateJobSchema,
  ruleDisputeSchema,
  updateControlsSchema,
  paginationSchema,
  auditLogFilterSchema
} from "../validators/admin.js";

// ── Dashboard ───────────────────────────────────────────────────────────────
export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

// ── User Management ─────────────────────────────────────────────────────────
export async function getAdminUsers(req, res) {
  const query = paginationSchema.parse({ ...req.query, role: req.query.role, status: req.query.status, search: req.query.search });
  return ok(res, await listUsers({
    ...query,
    role: req.query.role,
    status: req.query.status,
    search: req.query.search
  }));
}

export async function getAdminUserById(req, res) {
  const user = await getUserById(req.params.id);
  if (!user) return fail(res, "User not found", 404);
  return ok(res, user);
}

export async function patchUserStatus(req, res) {
  const { status } = updateUserStatusSchema.parse(req.body);
  const result = await updateUserStatus(
    req.user.sub,
    req.user.name || "Admin",
    req.params.id,
    status,
    req.body.reason
  );
  if (!result) return fail(res, "User not found", 404);
  const adminName = req.user.name || "Admin";
  const actionDescriptions = {
    suspended: `Suspended user ${req.params.id}`,
    banned: `Banned user ${req.params.id}`,
    active: `Reinstated user ${req.params.id}`
  };
  return ok(res, result);
}

// ── Job Moderation ──────────────────────────────────────────────────────────
export async function getFlaggedJobs(req, res) {
  const query = paginationSchema.parse({ ...req.query, moderationStatus: req.query.moderationStatus });
  return ok(res, await listFlaggedJobs({
    ...query,
    moderationStatus: req.query.moderationStatus
  }));
}

export async function postModerateJob(req, res) {
  const { action, reason } = moderateJobSchema.parse(req.body);
  const result = await moderateJob(
    req.user.sub,
    req.user.name || "Admin",
    req.params.id,
    action,
    reason
  );
  if (result.error) return fail(res, result.error, 404);
  return ok(res, result);
}

// ── Dispute Resolution ──────────────────────────────────────────────────────
export async function getDisputes(req, res) {
  const query = paginationSchema.parse({ ...req.query, status: req.query.status });
  return ok(res, await listDisputes({
    ...query,
    status: req.query.status
  }));
}

export async function getDisputeByIdHandler(req, res) {
  const dispute = await getDisputeById(req.params.id);
  if (!dispute) return fail(res, "Dispute not found", 404);
  return ok(res, dispute);
}

export async function postRuleDispute(req, res) {
  const { ruling, notes } = ruleDisputeSchema.parse(req.body);
  const result = await ruleOnDispute(
    req.user.sub,
    req.user.name || "Admin",
    req.params.id,
    ruling,
    notes
  );
  if (result.error) return fail(res, result.error, 404);
  return ok(res, result);
}

// ── Platform Controls ───────────────────────────────────────────────────────
export async function getPlatformControls(req, res) {
  return ok(res, await getControls());
}

export async function patchPlatformControls(req, res) {
  const updates = updateControlsSchema.parse(req.body);
  const result = await updateControls(
    req.user.sub,
    req.user.name || "Admin",
    updates
  );
  return ok(res, result);
}

// ── Audit Log ───────────────────────────────────────────────────────────────
export async function getAuditLogHandler(req, res) {
  const query = auditLogFilterSchema.parse({
    ...req.query,
    adminId: req.query.adminId,
    action: req.query.action
  });
  return ok(res, await getAuditLog({
    ...query,
    adminId: req.query.adminId,
    action: req.query.action
  }));
}
