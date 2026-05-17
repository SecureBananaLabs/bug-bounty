import { ok } from "../utils/response.js";
import { fail } from "../utils/response.js";
import {
  decideModerationItem,
  getAdminMetrics,
  getAdminUserProfile,
  getDisputeDetails,
  getPlatformControls,
  listAdminUsers,
  listAuditLog,
  listDisputes,
  listModerationQueue,
  ruleOnDispute,
  updateAdminUserStatus,
  updatePlatformControl
} from "../services/adminService.js";

function serviceError(res, error) {
  return fail(res, error.message ?? "Admin request failed", error.status ?? 400);
}

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics(req.user));
}

export async function users(req, res) {
  return ok(res, await listAdminUsers(req.query));
}

export async function userProfile(req, res) {
  try {
    return ok(res, await getAdminUserProfile(req.params.userId));
  } catch (error) {
    return serviceError(res, error);
  }
}

export async function userStatus(req, res) {
  try {
    return ok(res, await updateAdminUserStatus(req.user, req.params.userId, req.body));
  } catch (error) {
    return serviceError(res, error);
  }
}

export async function moderation(req, res) {
  return ok(res, await listModerationQueue(req.query));
}

export async function moderationDecision(req, res) {
  try {
    return ok(res, await decideModerationItem(req.user, req.params.itemId, req.body));
  } catch (error) {
    return serviceError(res, error);
  }
}

export async function disputes(req, res) {
  return ok(res, await listDisputes(req.query));
}

export async function disputeDetails(req, res) {
  try {
    return ok(res, await getDisputeDetails(req.params.disputeId));
  } catch (error) {
    return serviceError(res, error);
  }
}

export async function disputeRuling(req, res) {
  try {
    return ok(res, await ruleOnDispute(req.user, req.params.disputeId, req.body));
  } catch (error) {
    return serviceError(res, error);
  }
}

export async function audit(req, res) {
  return ok(res, await listAuditLog(req.query));
}

export async function controls(req, res) {
  return ok(res, await getPlatformControls());
}

export async function controlUpdate(req, res) {
  try {
    return ok(res, await updatePlatformControl(req.user, req.params.controlKey, req.body));
  } catch (error) {
    return serviceError(res, error);
  }
}
