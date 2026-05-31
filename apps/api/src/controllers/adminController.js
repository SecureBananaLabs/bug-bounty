import { AdminInputError, decideListing, getAdminMetrics, getPlatformControls, listAuditLog, listDisputes, listFlaggedListings, listUsers, ruleOnDispute, setPlatformControl, setUserStatus } from "../services/adminService.js";
import { fail, ok } from "../utils/response.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  return ok(res, await listUsers(req.query));
}

export async function updateUserStatus(req, res) {
  return handleAdminAction(res, () => setUserStatus({
    userId: req.params.userId,
    status: req.body.status,
    adminId: req.user.sub
  }));
}

export async function moderationQueue(req, res) {
  return ok(res, await listFlaggedListings(req.query));
}

export async function moderateListing(req, res) {
  return handleAdminAction(res, () => decideListing({
    listingId: req.params.listingId,
    decision: req.body.decision,
    reason: req.body.reason,
    adminId: req.user.sub
  }));
}

export async function disputeQueue(req, res) {
  return ok(res, await listDisputes(req.query));
}

export async function disputeRuling(req, res) {
  return handleAdminAction(res, () => ruleOnDispute({
    disputeId: req.params.disputeId,
    ruling: req.body.ruling,
    reason: req.body.reason,
    adminId: req.user.sub
  }));
}

export async function controls(req, res) {
  return ok(res, await getPlatformControls());
}

export async function updateControl(req, res) {
  return handleAdminAction(res, () => setPlatformControl({
    key: req.params.key,
    enabled: req.body.enabled,
    adminId: req.user.sub
  }));
}

export async function auditLog(req, res) {
  return ok(res, await listAuditLog(req.query));
}

async function handleAdminAction(res, action) {
  try {
    return ok(res, await action());
  } catch (error) {
    if (error instanceof AdminInputError) {
      return fail(res, error.message, error.status);
    }

    throw error;
  }
}
