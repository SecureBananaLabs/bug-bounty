import { ok, fail } from "../utils/response.js";
import {
  getAdminMetrics,
  getAdminUsers,
  updateUserStatus,
  getFlaggedJobs,
  moderateJob,
  getDisputes,
  resolveDispute,
  getPlatformControls,
  togglePlatformControl,
  getAuditLogs
} from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function listUsers(req, res) {
  const { search, role, status, page, limit } = req.query;
  const result = await getAdminUsers({ search, role, status, page, limit });
  return ok(res, result);
}

export async function changeUserStatus(req, res) {
  const { id } = req.params;
  const { status, reason } = req.body;
  if (!status || !["active", "suspended", "banned"].includes(status)) {
    return fail(res, "Invalid user status. Allowed: active, suspended, banned", 400);
  }
  try {
    const updated = await updateUserStatus(id, status, req.user?.id, reason);
    return ok(res, updated);
  } catch (err) {
    return fail(res, err.message, 404);
  }
}

export async function listFlaggedJobs(req, res) {
  const { status, page, limit } = req.query;
  return ok(res, await getFlaggedJobs({ status, page, limit }));
}

export async function moderateJobAction(req, res) {
  const { id } = req.params;
  const { action, reason } = req.body;
  if (!action || !["approved", "rejected", "escalated"].includes(action)) {
    return fail(res, "Invalid moderation action. Allowed: approved, rejected, escalated", 400);
  }
  try {
    const result = await moderateJob(id, action, req.user?.id, reason);
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 404);
  }
}

export async function listDisputes(req, res) {
  const { status, page, limit } = req.query;
  return ok(res, await getDisputes({ status, page, limit }));
}

export async function resolveDisputeAction(req, res) {
  const { id } = req.params;
  const { ruling, notes } = req.body;
  if (!ruling || !["favor_client", "favor_freelancer", "refund", "escalate"].includes(ruling)) {
    return fail(res, "Invalid ruling decision", 400);
  }
  try {
    const result = await resolveDispute(id, ruling, req.user?.id, notes);
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 404);
  }
}

export async function getControls(req, res) {
  return ok(res, await getPlatformControls());
}

export async function toggleControl(req, res) {
  const { controlName, enabled } = req.body;
  if (!controlName || enabled === undefined) {
    return fail(res, "controlName and enabled boolean are required", 400);
  }
  try {
    const result = await togglePlatformControl(controlName, enabled, req.user?.id);
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 400);
  }
}

export async function listAuditLogs(req, res) {
  const { actionType, page, limit } = req.query;
  return ok(res, await getAuditLogs({ actionType, page, limit }));
}
