import { ok } from "../utils/response.js";
import { fail } from "../utils/response.js";
import {
  getAdminMetrics,
  getPlatformControls,
  listAdminUsers,
  listAuditLog,
  listDisputes,
  listModerationQueue,
  moderateListing,
  ruleDispute,
  updatePlatformControl,
  updateUserStatus
} from "../services/adminService.js";

async function handleAdminAction(res, action) {
  try {
    return ok(res, await action());
  } catch (error) {
    const notFound = error.message.includes("not found");
    return fail(res, error.message, notFound ? 404 : 400);
  }
}

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  return ok(res, await listAdminUsers(req.query));
}

export async function setUserStatus(req, res) {
  return handleAdminAction(res, () => updateUserStatus(req.params.userId, req.body.status, req.user.sub));
}

export async function moderationQueue(req, res) {
  return ok(res, await listModerationQueue(req.query));
}

export async function moderateJob(req, res) {
  return handleAdminAction(res, () => moderateListing(req.params.listingId, req.body, req.user.sub));
}

export async function disputeQueue(req, res) {
  return ok(res, await listDisputes(req.query));
}

export async function disputeRuling(req, res) {
  return handleAdminAction(res, () => ruleDispute(req.params.disputeId, req.body, req.user.sub));
}

export async function controls(req, res) {
  return ok(res, await getPlatformControls());
}

export async function setControl(req, res) {
  return handleAdminAction(res, () => updatePlatformControl(req.params.control, req.body.enabled, req.user.sub));
}

export async function audit(req, res) {
  return ok(res, await listAuditLog(req.query));
}
