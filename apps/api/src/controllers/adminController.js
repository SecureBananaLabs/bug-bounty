import { ok } from "../utils/response.js";
import {
  applyDisputeRuling,
  applyModerationDecision,
  getAdminMetrics,
  getAdminOverview,
  getAdminUserProfile,
  getPlatformControls,
  listAdminUsers,
  listAuditLogs,
  listDisputes,
  listFlaggedListings,
  updateAdminUserStatus,
  updatePlatformControl
} from "../services/adminService.js";
import { fail } from "../utils/response.js";
import {
  auditLogQuerySchema,
  disputeQuerySchema,
  disputeRulingSchema,
  moderationDecisionSchema,
  moderationQuerySchema,
  platformControlSchema,
  userQuerySchema,
  userStatusSchema
} from "../validators/admin.js";

function adminId(req) {
  return req.user?.sub ?? "unknown_admin";
}

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function overview(req, res) {
  return ok(res, await getAdminOverview());
}

export async function users(req, res) {
  const query = userQuerySchema.parse(req.query);
  return ok(res, await listAdminUsers(query));
}

export async function userProfile(req, res) {
  const profile = await getAdminUserProfile(req.params.userId);
  if (!profile) return fail(res, "User not found", 404);
  return ok(res, profile);
}

export async function updateUserStatus(req, res) {
  const payload = userStatusSchema.parse(req.body);
  const result = await updateAdminUserStatus(req.params.userId, payload, adminId(req));
  if (!result) return fail(res, "User not found", 404);
  return ok(res, result);
}

export async function moderationQueue(req, res) {
  const query = moderationQuerySchema.parse(req.query);
  return ok(res, await listFlaggedListings(query));
}

export async function moderationDecision(req, res) {
  const payload = moderationDecisionSchema.parse(req.body);
  const result = await applyModerationDecision(req.params.listingId, payload, adminId(req));
  if (!result) return fail(res, "Flagged listing not found", 404);
  return ok(res, result);
}

export async function disputeQueue(req, res) {
  const query = disputeQuerySchema.parse(req.query);
  return ok(res, await listDisputes(query));
}

export async function disputeRuling(req, res) {
  const payload = disputeRulingSchema.parse(req.body);
  const result = await applyDisputeRuling(req.params.disputeId, payload, adminId(req));
  if (!result) return fail(res, "Dispute not found", 404);
  return ok(res, result);
}

export async function controls(req, res) {
  return ok(res, await getPlatformControls());
}

export async function updateControl(req, res) {
  const payload = platformControlSchema.parse(req.body);
  const result = await updatePlatformControl(req.params.control, payload, adminId(req));
  if (!result) return fail(res, "Unknown platform control", 404);
  return ok(res, result);
}

export async function auditLog(req, res) {
  const query = auditLogQuerySchema.parse(req.query);
  return ok(res, await listAuditLogs(query));
}
