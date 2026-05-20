import { fail, ok } from "../utils/response.js";
import {
  getAdminMetrics,
  getAuditLog,
  getControls,
  listDisputes,
  listFlaggedJobs,
  listUsers,
  moderateJob,
  ruleDispute,
  setControl,
  setUserStatus
} from "../services/adminService.js";

export async function metrics(req, res) {
  return sendAdminResponse(res, getAdminMetrics());
}

export async function users(req, res) {
  return sendAdminResponse(res, listUsers(req.query));
}

export async function updateUserStatus(req, res) {
  return sendAdminResponse(res, setUserStatus({
    userId: req.params.userId,
    status: req.body.status,
    adminId: req.user.sub
  }));
}

export async function flaggedJobs(req, res) {
  return sendAdminResponse(res, listFlaggedJobs(req.query));
}

export async function moderateFlaggedJob(req, res) {
  return sendAdminResponse(res, moderateJob({
    jobId: req.params.jobId,
    decision: req.body.decision,
    reason: req.body.reason,
    adminId: req.user.sub
  }));
}

export async function disputes(req, res) {
  return sendAdminResponse(res, listDisputes(req.query));
}

export async function ruleOnDispute(req, res) {
  return sendAdminResponse(res, ruleDispute({
    disputeId: req.params.disputeId,
    ruling: req.body.ruling,
    adminId: req.user.sub
  }));
}

export async function controls(req, res) {
  return sendAdminResponse(res, getControls());
}

export async function updateControl(req, res) {
  return sendAdminResponse(res, setControl({
    key: req.params.controlKey,
    enabled: req.body.enabled,
    adminId: req.user.sub
  }));
}

export async function auditLog(req, res) {
  return sendAdminResponse(res, getAuditLog(req.query));
}

async function sendAdminResponse(res, operation) {
  try {
    return ok(res, await operation);
  } catch (error) {
    return fail(res, error.message ?? "Invalid admin request", error.status ?? 400);
  }
}
