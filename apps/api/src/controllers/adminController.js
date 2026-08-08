import { fail, ok } from "../utils/response.js";
import {
  decideFlaggedListing,
  getAdminMetrics,
  getPlatformControls,
  listAdminUsers,
  listAuditLog,
  listDisputes,
  listFlaggedListings,
  ruleOnDispute,
  updatePlatformControl,
  updateUserStatus
} from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

function adminId(req) {
  return req.user?.sub ?? "unknown-admin";
}

export async function users(req, res) {
  return ok(res, await listAdminUsers(req.query));
}

export async function setUserStatus(req, res) {
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
  return ok(res, await listFlaggedListings(req.query));
}

export async function decideListing(req, res) {
  try {
    const listing = await decideFlaggedListing(
      req.params.listingId,
      req.body.decision,
      req.body.reason,
      adminId(req)
    );

    if (!listing) {
      return fail(res, "Listing not found", 404);
    }

    return ok(res, listing);
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

export async function disputeQueue(req, res) {
  return ok(res, await listDisputes(req.query));
}

export async function decideDispute(req, res) {
  try {
    const dispute = await ruleOnDispute(req.params.disputeId, req.body.ruling, adminId(req));

    if (!dispute) {
      return fail(res, "Dispute not found", 404);
    }

    return ok(res, dispute);
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

export async function controls(req, res) {
  return ok(res, await getPlatformControls());
}

export async function setControl(req, res) {
  try {
    return ok(res, await updatePlatformControl(req.params.control, req.body.enabled, adminId(req)));
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

export async function audit(req, res) {
  return ok(res, await listAuditLog(req.query));
}
