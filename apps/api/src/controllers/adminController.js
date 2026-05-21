import { fail, ok } from "../utils/response.js";
import {
  getAdminOverview,
  getAdminUserProfile,
  getDisputeDetail,
  getPlatformControls,
  listAdminUsers,
  listAuditLog,
  listDisputes,
  listModerationQueue,
  moderateListing,
  ruleOnDispute,
  setUserStatus,
  updatePlatformControl
} from "../services/adminService.js";

function adminId(req) {
  return req.user?.sub ?? "unknown-admin";
}

function handleAdminError(res, error) {
  return fail(res, error.message ?? "Admin operation failed", error.statusCode ?? 500);
}

export async function overview(req, res) {
  try {
    return ok(res, await getAdminOverview());
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function users(req, res) {
  try {
    return ok(res, await listAdminUsers(req.query));
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function userProfile(req, res) {
  try {
    return ok(res, await getAdminUserProfile(req.params.userId));
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function updateUserStatus(req, res) {
  try {
    return ok(res, await setUserStatus(req.params.userId, req.body.status, req.body.reason, adminId(req)));
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function moderationQueue(req, res) {
  try {
    return ok(res, await listModerationQueue(req.query));
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function updateModerationStatus(req, res) {
  try {
    return ok(res, await moderateListing(req.params.jobId, req.body.action, req.body.reason, adminId(req)));
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function disputes(req, res) {
  try {
    return ok(res, await listDisputes(req.query));
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function disputeDetail(req, res) {
  try {
    return ok(res, await getDisputeDetail(req.params.disputeId));
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function disputeRuling(req, res) {
  try {
    return ok(res, await ruleOnDispute(req.params.disputeId, req.body.ruling, req.body.reason, adminId(req)));
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function controls(req, res) {
  try {
    return ok(res, await getPlatformControls());
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function updateControl(req, res) {
  try {
    return ok(res, await updatePlatformControl(req.body.key, req.body.enabled, adminId(req)));
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function auditLog(req, res) {
  try {
    return ok(res, await listAuditLog(req.query));
  } catch (error) {
    return handleAdminError(res, error);
  }
}
