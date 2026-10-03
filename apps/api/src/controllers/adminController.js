import { ok } from "../utils/response.js";
import {
  getAdminMetrics,
  getPlatformControls,
  listAdminUsers,
  listAuditLog,
  listDisputes,
  listFlaggedJobs,
  moderateJob,
  ruleOnDispute,
  updatePlatformControl,
  updateUserStatus
} from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res, next) {
  try {
    return ok(res, await listAdminUsers(req.query));
  } catch (error) {
    return next(error);
  }
}

export async function setUserStatus(req, res, next) {
  try {
    return ok(res, await updateUserStatus(req.params.userId, req.body.status, req.user.sub));
  } catch (error) {
    return next(error);
  }
}

export async function flaggedJobs(req, res, next) {
  try {
    return ok(res, await listFlaggedJobs(req.query));
  } catch (error) {
    return next(error);
  }
}

export async function setJobModeration(req, res, next) {
  try {
    return ok(res, await moderateJob(req.params.jobId, req.body.decision, req.body.reason, req.user.sub));
  } catch (error) {
    return next(error);
  }
}

export async function disputeQueue(req, res, next) {
  try {
    return ok(res, await listDisputes(req.query));
  } catch (error) {
    return next(error);
  }
}

export async function setDisputeRuling(req, res, next) {
  try {
    return ok(res, await ruleOnDispute(req.params.disputeId, req.body.ruling, req.user.sub));
  } catch (error) {
    return next(error);
  }
}

export async function controls(req, res, next) {
  try {
    return ok(res, await getPlatformControls());
  } catch (error) {
    return next(error);
  }
}

export async function setControl(req, res, next) {
  try {
    return ok(res, await updatePlatformControl(req.params.key, req.body.enabled, req.user.sub));
  } catch (error) {
    return next(error);
  }
}

export async function auditLog(req, res, next) {
  try {
    return ok(res, await listAuditLog(req.query));
  } catch (error) {
    return next(error);
  }
}
