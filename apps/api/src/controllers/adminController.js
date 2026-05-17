import { ok } from "../utils/response.js";
import {
  getAdminMetrics,
  getAuditLog,
  getControls,
  getDashboardOverview,
  getDisputes,
  getModerationQueue,
  getUsers,
  moderateFlaggedListing,
  updateControl,
  updateDisputeRuling,
  updateUserStatus
} from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function overview(req, res) {
  return ok(res, await getDashboardOverview());
}

export async function users(req, res) {
  return ok(res, await getUsers(req.query));
}

export async function setUserStatus(req, res) {
  return ok(res, await updateUserStatus(req.params.id, req.body.status, req.user.sub));
}

export async function moderationQueue(req, res) {
  return ok(res, await getModerationQueue(req.query));
}

export async function moderateListing(req, res) {
  return ok(
    res,
    await moderateFlaggedListing(req.params.id, req.body.action, req.body.reason, req.user.sub)
  );
}

export async function disputes(req, res) {
  return ok(res, await getDisputes(req.query));
}

export async function ruleDispute(req, res) {
  return ok(
    res,
    await updateDisputeRuling(req.params.id, req.body.outcome, req.body.note, req.user.sub)
  );
}

export async function controls(req, res) {
  return ok(res, await getControls());
}

export async function setControl(req, res) {
  return ok(res, await updateControl(req.params.key, Boolean(req.body.enabled), req.user.sub));
}

export async function auditLog(req, res) {
  return ok(res, await getAuditLog(req.query));
}
