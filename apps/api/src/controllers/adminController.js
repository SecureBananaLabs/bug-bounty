import { ok } from "../utils/response.js";
import {
  decideModerationListing,
  getAdminMetrics,
  getAdminOverview,
  getPlatformControls,
  listAdminAuditLog,
  listAdminDisputes,
  listAdminUsers,
  listModerationQueue,
  resolveDispute,
  updatePlatformControl,
  updateUserStatus
} from "../services/adminService.js";

export async function overview(req, res) {
  return ok(res, await getAdminOverview());
}

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  return ok(res, await listAdminUsers(req.query));
}

export async function userStatusUpdate(req, res) {
  return ok(
    res,
    await updateUserStatus(req.params.userId, req.body, req.user?.sub ?? "admin")
  );
}

export async function moderation(req, res) {
  return ok(res, await listModerationQueue(req.query));
}

export async function moderationDecision(req, res) {
  return ok(
    res,
    await decideModerationListing(req.params.jobId, req.body, req.user?.sub ?? "admin")
  );
}

export async function disputes(req, res) {
  return ok(res, await listAdminDisputes(req.query));
}

export async function disputeRuling(req, res) {
  return ok(
    res,
    await resolveDispute(req.params.disputeId, req.body, req.user?.sub ?? "admin")
  );
}

export async function controls(req, res) {
  return ok(res, await getPlatformControls());
}

export async function controlUpdate(req, res) {
  return ok(
    res,
    await updatePlatformControl(req.params.controlKey, req.body, req.user?.sub ?? "admin")
  );
}

export async function auditLog(req, res) {
  return ok(res, await listAdminAuditLog(req.query));
}
