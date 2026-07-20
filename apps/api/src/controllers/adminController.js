import { fail, ok } from "../utils/response.js";
import {
  decideFlaggedListing,
  getAdminMetrics,
  getAdminOverview,
  getAuditLog,
  getPlatformControls,
  listDisputes,
  listFlaggedListings,
  listUsers,
  ruleOnDispute,
  setPlatformControl,
  setUserStatus
} from "../services/adminService.js";

function adminId(req) {
  return req.user?.sub ?? req.user?.email ?? "admin";
}

function handleAdminError(res, error) {
  if (error?.status) {
    return fail(res, error.message, error.status);
  }

  throw error;
}

export async function overview(req, res) {
  return ok(res, await getAdminOverview());
}

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  return ok(res, await listUsers(req.query));
}

export async function updateUserStatus(req, res) {
  try {
    return ok(res, await setUserStatus(req.params.id, req.body, adminId(req)));
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function moderationQueue(req, res) {
  return ok(res, await listFlaggedListings(req.query));
}

export async function listingDecision(req, res) {
  try {
    return ok(res, await decideFlaggedListing(req.params.id, req.body, adminId(req)));
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function disputes(req, res) {
  return ok(res, await listDisputes(req.query));
}

export async function disputeRuling(req, res) {
  try {
    return ok(res, await ruleOnDispute(req.params.id, req.body, adminId(req)));
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function controls(req, res) {
  return ok(res, await getPlatformControls());
}

export async function updateControl(req, res) {
  try {
    return ok(res, await setPlatformControl(req.params.key, req.body, adminId(req)));
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function auditLog(req, res) {
  return ok(res, await getAuditLog(req.query));
}
