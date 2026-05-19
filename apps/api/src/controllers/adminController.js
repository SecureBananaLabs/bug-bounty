import { ok, fail } from "../utils/response.js";
import {
  getAdminMetrics,
  getAdminUsers,
  adminGetUserDetail,
  adminSetUserStatus,
  getFlaggedJobs,
  moderateJob,
  getDisputes,
  getDisputeDetail,
  createDispute,
  ruleOnDispute,
  getPlatformControls,
  setPlatformControl,
  getAuditLog,
} from "../services/adminService.js";

// --- Metrics ---
export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

// --- User Management ---
export async function listUsers(req, res) {
  return ok(res, await getAdminUsers(req.query));
}

export async function getUserDetail(req, res) {
  const user = await adminGetUserDetail(req.params.id);
  if (!user) return fail(res, "User not found", 404);
  return ok(res, user);
}

export async function setUserStatus(req, res) {
  try {
    const { status } = req.body;
    if (!status) return fail(res, "status is required", 400);
    const user = await adminSetUserStatus(req.user.id, req.params.id, status);
    if (!user) return fail(res, "User not found", 404);
    return ok(res, user);
  } catch (e) {
    return fail(res, e.message, 400);
  }
}

// --- Job Moderation ---
export async function listFlaggedJobs(req, res) {
  return ok(res, await getFlaggedJobs(req.query));
}

export async function moderateJobHandler(req, res) {
  try {
    const { action, reason } = req.body;
    if (!action) return fail(res, "action is required", 400);
    const job = await moderateJob(req.user.id, req.params.id, action, reason);
    if (!job) return fail(res, "Job not found", 404);
    return ok(res, job);
  } catch (e) {
    return fail(res, e.message, 400);
  }
}

// --- Dispute Resolution ---
export async function listDisputes(req, res) {
  return ok(res, await getDisputes(req.query));
}

export async function getDispute(req, res) {
  const dispute = await getDisputeDetail(req.params.id);
  if (!dispute) return fail(res, "Dispute not found", 404);
  return ok(res, dispute);
}

export async function createDisputeHandler(req, res) {
  try {
    const { clientId, freelancerId, jobId, reason, evidence } = req.body;
    if (!clientId || !freelancerId || !jobId || !reason) {
      return fail(res, "clientId, freelancerId, jobId, and reason are required", 400);
    }
    const dispute = await createDispute(clientId, freelancerId, jobId, reason, evidence);
    return ok(res, dispute, 201);
  } catch (e) {
    return fail(res, e.message, 400);
  }
}

export async function ruleOnDisputeHandler(req, res) {
  try {
    const { ruling } = req.body;
    if (!ruling) return fail(res, "ruling is required", 400);
    const dispute = await ruleOnDispute(req.user.id, req.params.id, ruling);
    if (!dispute) return fail(res, "Dispute not found", 404);
    return ok(res, dispute);
  } catch (e) {
    return fail(res, e.message, 400);
  }
}

// --- Platform Controls ---
export async function getControls(req, res) {
  return ok(res, await getPlatformControls());
}

export async function updateControl(req, res) {
  try {
    const { control, value } = req.body;
    if (!control || value === undefined) {
      return fail(res, "control and value are required", 400);
    }
    const result = await setPlatformControl(req.user.id, control, value);
    return ok(res, result);
  } catch (e) {
    return fail(res, e.message, 400);
  }
}

// --- Audit Log ---
export async function listAuditLog(req, res) {
  return ok(res, await getAuditLog(req.query));
}
