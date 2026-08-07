import { fail, ok } from "../utils/response.js";
import {
  getAdminMetrics,
  getAuditLog,
  getDispute,
  getModerationQueue,
  getPlatformControls,
  getUserDetail,
  listDisputes,
  listUsers,
  recordListingDecision,
  recordDisputeRuling,
  updatePlatformControls,
  updateUserStatus
} from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  return ok(res, await listUsers(req.query));
}

export async function user(req, res) {
  const detail = await getUserDetail(req.params.id);
  if (!detail) {
    return fail(res, "User not found", 404);
  }

  return ok(res, detail);
}

export async function updateUser(req, res) {
  try {
    const result = await updateUserStatus(req.params.id, req.body, req.user.sub);
    if (!result) {
      return fail(res, "User not found", 404);
    }

    return ok(res, result);
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

export async function moderationQueue(req, res) {
  return ok(res, await getModerationQueue(req.query));
}

export async function moderateListing(req, res) {
  try {
    const result = await recordListingDecision(req.params.id, req.body, req.user.sub);
    if (!result) {
      return fail(res, "Flagged listing not found", 404);
    }

    return ok(res, result);
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

export async function disputes(req, res) {
  return ok(res, await listDisputes(req.query));
}

export async function dispute(req, res) {
  const detail = await getDispute(req.params.id);
  if (!detail) {
    return fail(res, "Dispute not found", 404);
  }

  return ok(res, detail);
}

export async function updateDispute(req, res) {
  try {
    const result = await recordDisputeRuling(req.params.id, req.body, req.user.sub);
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

export async function updateControls(req, res) {
  return ok(res, await updatePlatformControls(req.body, req.user.sub));
}

export async function auditLog(req, res) {
  return ok(res, await getAuditLog(req.query));
}
