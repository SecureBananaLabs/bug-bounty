import { ok } from "../utils/response.js";
import {
  changeUserStatus,
  getAdminMetrics,
  getPlatformControls,
  listAdminUsers,
  listAuditLog,
  listDisputes,
  listModerationQueue,
  resolveDispute,
  updateModerationItem,
  updatePlatformControl
} from "../services/adminService.js";

function failFromError(res, error) {
  return res.status(error.status ?? 400).json({
    success: false,
    message: error.message ?? "Admin action failed"
  });
}

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  return ok(res, await listAdminUsers(req.query));
}

export async function updateUserStatus(req, res) {
  try {
    return ok(res, await changeUserStatus(req.params.userId, req.body, req.user));
  } catch (error) {
    return failFromError(res, error);
  }
}

export async function moderationQueue(req, res) {
  return ok(res, await listModerationQueue(req.query));
}

export async function updateModerationStatus(req, res) {
  try {
    return ok(res, await updateModerationItem(req.params.jobId, req.body, req.user));
  } catch (error) {
    return failFromError(res, error);
  }
}

export async function disputes(req, res) {
  return ok(res, await listDisputes(req.query));
}

export async function updateDispute(req, res) {
  try {
    return ok(res, await resolveDispute(req.params.disputeId, req.body, req.user));
  } catch (error) {
    return failFromError(res, error);
  }
}

export async function platformControls(req, res) {
  return ok(res, await getPlatformControls());
}

export async function updateControl(req, res) {
  try {
    return ok(res, await updatePlatformControl(req.params.controlKey, req.body, req.user));
  } catch (error) {
    return failFromError(res, error);
  }
}

export async function auditLog(req, res) {
  return ok(res, await listAuditLog(req.query));
}
