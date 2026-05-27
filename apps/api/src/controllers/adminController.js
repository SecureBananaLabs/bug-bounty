import { ok, fail } from "../utils/response.js";
import {
  getAdminMetrics,
  getAdminUser,
  getDispute,
  getPlatformControls,
  getPlatformHealth,
  listAdminUsers,
  listAuditLog,
  listDisputes,
  listModerationJobs,
  moderateJob,
  resolveDispute,
  updatePlatformControl,
  updateUserStatus
} from "../services/adminService.js";

function handleAdminError(res, error) {
  return fail(res, error.message, error.statusCode ?? 500);
}

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function health(req, res) {
  return ok(res, await getPlatformHealth());
}

export async function users(req, res) {
  return ok(res, await listAdminUsers(req.query));
}

export async function userDetails(req, res) {
  try {
    return ok(res, await getAdminUser(req.params.userID));
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function setUserStatus(req, res) {
  try {
    return ok(res, await updateUserStatus(req.params.userID, req.body, req.user));
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function moderationJobs(req, res) {
  return ok(res, await listModerationJobs(req.query));
}

export async function setModerationDecision(req, res) {
  try {
    return ok(res, await moderateJob(req.params.jobID, req.body, req.user));
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function disputes(req, res) {
  return ok(res, await listDisputes(req.query));
}

export async function disputeDetails(req, res) {
  try {
    return ok(res, await getDispute(req.params.disputeID));
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function setDisputeRuling(req, res) {
  try {
    return ok(res, await resolveDispute(req.params.disputeID, req.body, req.user));
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function controls(req, res) {
  return ok(res, await getPlatformControls());
}

export async function setControl(req, res) {
  try {
    return ok(res, await updatePlatformControl(req.body, req.user));
  } catch (error) {
    return handleAdminError(res, error);
  }
}

export async function auditLog(req, res) {
  return ok(res, await listAuditLog());
}
