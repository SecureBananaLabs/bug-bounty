import { fail, ok } from "../utils/response.js";
import {
  decideListing,
  getAdminMetrics,
  getPlatformControls,
  listAuditLog,
  listDisputes,
  listModerationQueue,
  listUsers,
  ruleOnDispute,
  updatePlatformControls,
  updateUserStatus
} from "../services/adminService.js";

function serviceError(res, error) {
  const message = error instanceof Error ? error.message : "Admin action failed";
  const status = message.toLowerCase().includes("not found") ? 404 : 400;
  return fail(res, message, status);
}

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  return ok(res, await listUsers(req.query));
}

export async function setUserStatus(req, res) {
  try {
    return ok(
      res,
      await updateUserStatus(req.params.userId, req.body.status, req.user.sub)
    );
  } catch (error) {
    return serviceError(res, error);
  }
}

export async function moderationQueue(req, res) {
  return ok(res, await listModerationQueue(req.query));
}

export async function moderateListing(req, res) {
  try {
    return ok(
      res,
      await decideListing(req.params.listingId, req.body.action, req.body.reason, req.user.sub)
    );
  } catch (error) {
    return serviceError(res, error);
  }
}

export async function disputes(req, res) {
  return ok(res, await listDisputes(req.query));
}

export async function resolveDispute(req, res) {
  try {
    return ok(
      res,
      await ruleOnDispute(req.params.disputeId, req.body.ruling, req.body.note, req.user.sub)
    );
  } catch (error) {
    return serviceError(res, error);
  }
}

export async function controls(req, res) {
  return ok(res, await getPlatformControls());
}

export async function setControls(req, res) {
  return ok(res, await updatePlatformControls(req.body, req.user.sub));
}

export async function audit(req, res) {
  return ok(res, await listAuditLog(req.query));
}
