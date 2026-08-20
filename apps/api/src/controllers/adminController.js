import { fail, ok } from "../utils/response.js";
import {
  getAdminMetrics,
  getAdminUser,
  getDispute,
  getPlatformControls,
  listAdminUsers,
  listAuditLog,
  listDisputes,
  listModerationJobs,
  moderateJob,
  ruleOnDispute,
  updateAdminUserStatus,
  updatePlatformControls
} from "../services/adminService.js";

function sendServiceResult(res, result, successKey) {
  if (result?.error) {
    return fail(res, result.error, result.status ?? 400);
  }

  return ok(res, successKey ? result[successKey] : result);
}

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  return ok(res, await listAdminUsers(req.query));
}

export async function userProfile(req, res) {
  const user = await getAdminUser(req.params.userId);
  if (!user) {
    return fail(res, "User not found", 404);
  }

  return ok(res, user);
}

export async function userStatus(req, res) {
  return sendServiceResult(
    res,
    await updateAdminUserStatus(req.params.userId, req.body, req.user)
  );
}

export async function moderationJobs(req, res) {
  return ok(res, await listModerationJobs(req.query));
}

export async function moderationAction(req, res) {
  return sendServiceResult(
    res,
    await moderateJob(req.params.jobId, req.body, req.user)
  );
}

export async function disputes(req, res) {
  return ok(res, await listDisputes(req.query));
}

export async function disputeDetails(req, res) {
  const dispute = await getDispute(req.params.disputeId);
  if (!dispute) {
    return fail(res, "Dispute not found", 404);
  }

  return ok(res, dispute);
}

export async function disputeRuling(req, res) {
  return sendServiceResult(
    res,
    await ruleOnDispute(req.params.disputeId, req.body, req.user)
  );
}

export async function controls(req, res) {
  return ok(res, await getPlatformControls());
}

export async function updateControls(req, res) {
  return sendServiceResult(res, await updatePlatformControls(req.body, req.user));
}

export async function auditLog(req, res) {
  return ok(res, await listAuditLog(req.query));
}
