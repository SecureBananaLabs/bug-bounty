import { fail, ok } from "../utils/response.js";
import {
  getAdminMetrics,
  listAdminUsers,
  listAuditLog,
  listDisputes,
  listFlaggedJobs,
  moderateJob,
  ruleDispute,
  updatePlatformControl,
  updateUserStatus
} from "../services/adminService.js";

function adminId(req) {
  return req.user?.sub ?? req.user?.id ?? "admin";
}

function handleAdminError(res, error) {
  const message = error instanceof Error ? error.message : "Admin action failed";
  const status = message.includes("not found") ? 404 : 400;
  return fail(res, message, status);
}

export async function metrics(_req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  return ok(res, await listAdminUsers(req.query));
}

export async function setUserStatus(req, res) {
  try {
    return ok(
      res,
      await updateUserStatus(adminId(req), req.params.userId, req.body?.status)
    );
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function moderationQueue(req, res) {
  return ok(res, await listFlaggedJobs(req.query));
}

export async function moderateListing(req, res) {
  try {
    return ok(
      res,
      await moderateJob(
        adminId(req),
        req.params.jobId,
        req.body?.action,
        req.body?.reason
      )
    );
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function disputeQueue(req, res) {
  return ok(res, await listDisputes(req.query));
}

export async function resolveDispute(req, res) {
  try {
    return ok(
      res,
      await ruleDispute(
        adminId(req),
        req.params.disputeId,
        req.body?.ruling,
        req.body?.note
      )
    );
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function platformControl(req, res) {
  try {
    return ok(
      res,
      await updatePlatformControl(
        adminId(req),
        req.params.key,
        req.body?.enabled
      )
    );
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function auditLog(req, res) {
  return ok(res, await listAuditLog(req.query));
}
