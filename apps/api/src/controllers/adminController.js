import { fail, ok } from "../utils/response.js";
import {
  getAdminMetrics,
  getPlatformControls,
  listAdminUsers,
  listAuditLog,
  listDisputes,
  listFlaggedListings,
  moderateListing,
  resolveDispute,
  updatePlatformControls,
  updateUserStatus
} from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  return ok(res, await listAdminUsers(req.query));
}

export async function setUserStatus(req, res) {
  try {
    return ok(res, await updateUserStatus(req.params.userId, req.body.status, req));
  } catch (error) {
    return fail(res, error.message, error.message.includes("not found") ? 404 : 400);
  }
}

export async function moderationQueue(req, res) {
  return ok(res, await listFlaggedListings(req.query));
}

export async function moderate(req, res) {
  try {
    return ok(res, await moderateListing(req.params.flagId, req.body.action, req.body.reason, req));
  } catch (error) {
    return fail(res, error.message, error.message.includes("not found") ? 404 : 400);
  }
}

export async function disputeQueue(req, res) {
  return ok(res, await listDisputes(req.query));
}

export async function ruleDispute(req, res) {
  try {
    return ok(res, await resolveDispute(req.params.disputeId, req.body.ruling, req.body.note, req));
  } catch (error) {
    return fail(res, error.message, error.message.includes("not found") ? 404 : 400);
  }
}

export async function controls(req, res) {
  return ok(res, await getPlatformControls());
}

export async function setControls(req, res) {
  return ok(res, await updatePlatformControls(req.body, req));
}

export async function audit(req, res) {
  return ok(res, await listAuditLog());
}
