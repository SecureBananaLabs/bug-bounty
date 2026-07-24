import { fail, ok } from "../utils/response.js";
import {
  decideListing,
  getAdminOverview,
  getPlatformSettings,
  getUserProfile,
  listAuditLog,
  listDisputes,
  listModerationQueue,
  listUsers,
  ruleDispute,
  updatePlatformSetting,
  updateUserStatus
} from "../services/adminService.js";

function handleAdminError(res, error) {
  const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : "Admin operation failed";
  return fail(res, message, statusCode);
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
    return ok(res, await listUsers(req.query));
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function userProfile(req, res) {
  try {
    return ok(res, await getUserProfile(req.params.userId));
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function setUserStatus(req, res) {
  try {
    return ok(res, await updateUserStatus(req.params.userId, req.body.status, req.user));
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function moderation(req, res) {
  try {
    return ok(res, await listModerationQueue(req.query));
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function listingDecision(req, res) {
  try {
    return ok(res, await decideListing(req.params.listingId, req.body.decision, req.body.reason, req.user));
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

export async function disputeRuling(req, res) {
  try {
    return ok(res, await ruleDispute(req.params.disputeId, req.body.ruling, req.user));
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function settings(req, res) {
  try {
    return ok(res, await getPlatformSettings());
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function platformSetting(req, res) {
  try {
    return ok(res, await updatePlatformSetting(req.params.setting, req.body.enabled, req.user));
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function audit(req, res) {
  try {
    return ok(res, await listAuditLog(req.query));
  } catch (error) {
    return handleAdminError(res, error);
  }
}
