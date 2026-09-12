import { ok, error } from "../utils/response.js";
import {
  getAdminMetrics,
  listUsers,
  updateUserStatus,
  listFlaggedJobs,
  moderateJob,
  listDisputes,
  resolveDispute,
  getAuditLog,
  getPlatformConfig,
  updatePlatformConfig,
} from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function listUsers(req, res) {
  try {
    const result = await listUsers(req.query);
    return ok(res, result);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
}

export async function moderateUser(req, res) {
  try {
    const result = await updateUserStatus(req.params.userId, req.body);
    return ok(res, result);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
}

export async function listFlaggedJobs(req, res) {
  try {
    const result = await listFlaggedJobs(req.query);
    return ok(res, result);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
}

export async function moderateJob(req, res) {
  try {
    const result = await moderateJob(req.params.jobId, req.body);
    return ok(res, result);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
}

export async function listDisputes(req, res) {
  try {
    const result = await listDisputes(req.query);
    return ok(res, result);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
}

export async function resolveDispute(req, res) {
  try {
    const result = await resolveDispute(req.params.disputeId, req.body);
    return ok(res, result);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
}

export async function getAuditLog(req, res) {
  try {
    const result = await getAuditLog(req.query);
    return ok(res, result);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
}

export async function getConfig(req, res) {
  return ok(res, await getPlatformConfig());
}

export async function updateConfig(req, res) {
  try {
    const result = await updatePlatformConfig(req.body);
    return ok(res, result);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
}
