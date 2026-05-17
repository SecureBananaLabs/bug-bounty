import { fail, ok } from "../utils/response.js";
import {
  getAdminMetrics,
  getDispute,
  getPlatformControls,
  getUserProfile,
  listAdminAuditLog,
  listDisputes,
  listModerationQueue,
  listUsers,
  moderateJob,
  resolveDispute,
  setPlatformControl,
  setUserStatus
} from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  return ok(res, await listUsers(req.query));
}

export async function userDetail(req, res) {
  const user = await getUserProfile(req.params.id);
  if (!user) {
    return fail(res, "User not found", 404);
  }

  return ok(res, user);
}

export async function updateUserStatus(req, res) {
  const result = await setUserStatus(req.params.id, req.body, req.user);
  if (!result) {
    return fail(res, "User not found", 404);
  }

  if (result.error) {
    return fail(res, result.error, 400);
  }

  return ok(res, result.user);
}

export async function moderationQueue(req, res) {
  return ok(res, await listModerationQueue(req.query));
}

export async function updateModerationItem(req, res) {
  const result = await moderateJob(req.params.id, req.body, req.user);
  if (!result) {
    return fail(res, "Flagged listing not found", 404);
  }

  if (result.error) {
    return fail(res, result.error, 400);
  }

  return ok(res, result.listing);
}

export async function disputes(req, res) {
  return ok(res, await listDisputes(req.query));
}

export async function disputeDetail(req, res) {
  const dispute = await getDispute(req.params.id);
  if (!dispute) {
    return fail(res, "Dispute not found", 404);
  }

  return ok(res, dispute);
}

export async function ruleDispute(req, res) {
  const result = await resolveDispute(req.params.id, req.body, req.user);
  if (!result) {
    return fail(res, "Dispute not found", 404);
  }

  if (result.error) {
    return fail(res, result.error, 400);
  }

  return ok(res, result.dispute);
}

export async function platformControls(req, res) {
  return ok(res, await getPlatformControls());
}

export async function updatePlatformControls(req, res) {
  const result = await setPlatformControl(req.body, req.user);
  if (result.error) {
    return fail(res, result.error, 400);
  }

  return ok(res, result.controls);
}

export async function auditLog(req, res) {
  return ok(res, await listAdminAuditLog(req.query));
}
