import { fail, ok } from "../utils/response.js";
import {
  decideFlaggedJob,
  getAdminMetrics,
  getDispute,
  getPlatformControls,
  listAuditLog,
  listDisputes,
  listFlaggedJobs,
  listUsers,
  ruleDispute,
  setPlatformControl,
  updateUserStatus
} from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  return ok(res, await listUsers(req.query));
}

export async function setUserStatus(req, res) {
  const result = await updateUserStatus(req.params.userId, req.body, req.user);
  if (!result) {
    return fail(res, "User not found or invalid status", 404);
  }

  return ok(res, result);
}

export async function flaggedJobs(req, res) {
  return ok(res, await listFlaggedJobs(req.query));
}

export async function setJobDecision(req, res) {
  const result = await decideFlaggedJob(req.params.jobId, req.body, req.user);
  if (!result) {
    return fail(res, "Job not found or invalid decision", 404);
  }

  return ok(res, result);
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

export async function setDisputeRuling(req, res) {
  const result = await ruleDispute(req.params.disputeId, req.body, req.user);
  if (!result) {
    return fail(res, "Dispute not found or invalid ruling", 404);
  }

  return ok(res, result);
}

export async function platformControls(req, res) {
  return ok(res, await getPlatformControls());
}

export async function setControl(req, res) {
  const result = await setPlatformControl(req.params.controlKey, req.body, req.user);
  if (!result) {
    return fail(res, "Control not found or invalid payload", 404);
  }

  return ok(res, result);
}

export async function auditLog(req, res) {
  return ok(res, await listAuditLog(req.query));
}
