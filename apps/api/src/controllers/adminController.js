import { fail, ok } from "../utils/response.js";
import {
  getAdminMetrics,
  getPlatformControls,
  getUserProfile,
  listAuditLog,
  listDisputes,
  listModerationQueue,
  listNotifications,
  listUsers,
  resolveListing,
  ruleOnDispute,
  updatePlatformControl,
  updateUserStatus
} from "../services/adminService.js";

function adminId(req) {
  return req.user?.sub ?? req.user?.id ?? "unknown_admin";
}

function handleAdminError(res, error) {
  return fail(res, error.message ?? "Admin action failed", error.status ?? 500);
}

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  return ok(res, await listUsers(req.query));
}

export async function userProfile(req, res) {
  try {
    return ok(res, await getUserProfile(req.params.userId));
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function changeUserStatus(req, res) {
  try {
    return ok(res, await updateUserStatus(adminId(req), req.params.userId, req.body.status));
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function moderationQueue(req, res) {
  return ok(res, await listModerationQueue(req.query));
}

export async function moderateListing(req, res) {
  try {
    return ok(
      res,
      await resolveListing(adminId(req), req.params.jobId, req.body.action, req.body.reason)
    );
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function disputes(req, res) {
  return ok(res, await listDisputes(req.query));
}

export async function disputeRuling(req, res) {
  try {
    return ok(
      res,
      await ruleOnDispute(adminId(req), req.params.disputeId, req.body.ruling, req.body.note)
    );
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function controls(req, res) {
  return ok(res, await getPlatformControls());
}

export async function changeControl(req, res) {
  try {
    return ok(res, await updatePlatformControl(adminId(req), req.params.key, req.body.enabled));
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function auditLog(req, res) {
  return ok(res, await listAuditLog(req.query));
}

export async function notifications(req, res) {
  return ok(res, await listNotifications());
}
