import { fail, ok } from "../utils/response.js";
import {
  getAdminOverview,
  getNotifications,
  getPlatformControls,
  getUserProfile,
  listAuditLog,
  listDisputes,
  listFlaggedJobs,
  listUsers,
  moderateJob,
  ruleOnDispute,
  updatePlatformControl,
  updateUserStatus
} from "../services/adminService.js";

function handleAdminError(res, error) {
  const notFound = /not found/i.test(error.message);
  const invalid = /invalid|required|positive/i.test(error.message);
  return fail(res, error.message, notFound ? 404 : invalid ? 400 : 500);
}

export async function overview(req, res) {
  return ok(res, await getAdminOverview());
}

export async function users(req, res) {
  return ok(res, await listUsers(req.query));
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
    return ok(res, await updateUserStatus(req.user, req.params.userId, req.body.status));
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function flaggedJobs(req, res) {
  return ok(res, await listFlaggedJobs(req.query));
}

export async function decideJob(req, res) {
  try {
    return ok(
      res,
      await moderateJob(req.user, req.params.jobId, req.body.decision, req.body.reason)
    );
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function disputes(req, res) {
  return ok(res, await listDisputes(req.query));
}

export async function decideDispute(req, res) {
  try {
    return ok(
      res,
      await ruleOnDispute(req.user, req.params.disputeId, req.body.ruling, req.body.note)
    );
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function controls(req, res) {
  return ok(res, await getPlatformControls());
}

export async function setControl(req, res) {
  try {
    return ok(res, await updatePlatformControl(req.user, req.body.key, req.body.enabled));
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function auditLog(req, res) {
  return ok(res, await listAuditLog(req.query));
}

export async function notifications(req, res) {
  return ok(res, await getNotifications());
}
