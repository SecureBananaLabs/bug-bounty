import { fail, ok } from "../utils/response.js";
import {
  decideListing,
  getAdminMetrics,
  getDispute,
  getPlatformControls,
  getUserProfile,
  listAuditLog,
  listDisputes,
  listModerationQueue,
  listUsers,
  ruleOnDispute,
  updatePlatformControls,
  updateUserStatus
} from "../services/adminService.js";

function adminId(req) {
  return req.user?.sub ?? req.user?.id ?? "unknown-admin";
}

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  return ok(res, await listUsers(req.query));
}

export async function userProfile(req, res) {
  const user = await getUserProfile(req.params.userId);
  if (!user) {
    return fail(res, "User not found", 404);
  }

  return ok(res, user);
}

export async function userStatus(req, res) {
  try {
    const user = await updateUserStatus(req.params.userId, req.body.status, adminId(req));
    if (!user) {
      return fail(res, "User not found", 404);
    }

    return ok(res, user);
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

export async function moderationQueue(req, res) {
  return ok(res, await listModerationQueue(req.query));
}

export async function moderationDecision(req, res) {
  try {
    const result = await decideListing(req.params.listingId, req.body.decision, req.body.reason, adminId(req));
    if (!result) {
      return fail(res, "Listing not found", 404);
    }

    return ok(res, result);
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

export async function disputes(req, res) {
  return ok(res, await listDisputes(req.query));
}

export async function disputeDetail(req, res) {
  const dispute = await getDispute(req.params.disputeId);
  if (!dispute) {
    return fail(res, "Dispute not found", 404);
  }

  return ok(res, dispute);
}

export async function disputeRuling(req, res) {
  try {
    const result = await ruleOnDispute(req.params.disputeId, req.body, adminId(req));
    if (!result) {
      return fail(res, "Dispute not found", 404);
    }

    return ok(res, result);
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

export async function controls(req, res) {
  return ok(res, await getPlatformControls());
}

export async function setControls(req, res) {
  return ok(res, await updatePlatformControls(req.body, adminId(req)));
}

export async function auditLog(req, res) {
  return ok(res, await listAuditLog(req.query));
}
