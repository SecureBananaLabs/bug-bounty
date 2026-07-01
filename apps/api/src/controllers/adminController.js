import { ok, fail } from "../utils/response.js";
import {
  getAdminMetrics,
  getAdminOverview,
  getAdminUserProfile,
  getPlatformControls,
  listAdminUsers,
  listAuditLogs,
  listDisputes,
  listFlaggedListings,
  moderateListing,
  ruleOnDispute,
  updatePlatformControl,
  updateUserStatus
} from "../services/adminService.js";

function adminId(req) {
  return req.user?.sub ?? "unknown_admin";
}

function sendError(res, error) {
  return fail(res, error.message ?? "Admin action failed", error.status ?? 400);
}

export async function metrics(req, res) {
  try {
    return ok(res, await getAdminMetrics());
  } catch (error) {
    return sendError(res, error);
  }
}

export async function overview(req, res) {
  try {
    return ok(res, await getAdminOverview());
  } catch (error) {
    return sendError(res, error);
  }
}

export async function users(req, res) {
  try {
    return ok(res, await listAdminUsers(req.query));
  } catch (error) {
    return sendError(res, error);
  }
}

export async function userProfile(req, res) {
  try {
    return ok(res, await getAdminUserProfile(req.params.userId));
  } catch (error) {
    return sendError(res, error);
  }
}

export async function setUserStatus(req, res) {
  try {
    return ok(res, await updateUserStatus(req.params.userId, req.body.status, adminId(req)));
  } catch (error) {
    return sendError(res, error);
  }
}

export async function moderationQueue(req, res) {
  try {
    return ok(res, await listFlaggedListings(req.query));
  } catch (error) {
    return sendError(res, error);
  }
}

export async function decideListing(req, res) {
  try {
    return ok(res, await moderateListing(req.params.jobId, req.body, adminId(req)));
  } catch (error) {
    return sendError(res, error);
  }
}

export async function disputeQueue(req, res) {
  try {
    return ok(res, await listDisputes(req.query));
  } catch (error) {
    return sendError(res, error);
  }
}

export async function disputeRuling(req, res) {
  try {
    return ok(res, await ruleOnDispute(req.params.disputeId, req.body, adminId(req)));
  } catch (error) {
    return sendError(res, error);
  }
}

export async function controls(req, res) {
  try {
    return ok(res, await getPlatformControls());
  } catch (error) {
    return sendError(res, error);
  }
}

export async function setControl(req, res) {
  try {
    return ok(res, await updatePlatformControl(req.params.control, req.body.enabled, adminId(req)));
  } catch (error) {
    return sendError(res, error);
  }
}

export async function audit(req, res) {
  try {
    return ok(res, await listAuditLogs(req.query));
  } catch (error) {
    return sendError(res, error);
  }
}
