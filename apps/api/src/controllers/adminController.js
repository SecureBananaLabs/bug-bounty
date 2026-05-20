import { fail, ok } from "../utils/response.js";
import {
  getAdminMetrics,
  getPlatformSettings,
  listAdminDisputes,
  listAdminJobs,
  listAdminUsers,
  listAuditLog,
  listNotifications,
  updateDisputeStatus,
  updateJobStatus,
  updatePlatformSettings,
  updateUserStatus
} from "../services/adminService.js";
import {
  disputeActionSchema,
  jobActionSchema,
  paginationSchema,
  settingsSchema,
  userActionSchema
} from "../validators/admin.js";

function adminId(req) {
  return req.user?.sub ?? "admin";
}

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  const { page, limit } = paginationSchema.parse(req.query);
  const { role, status, query, joinedAfter, joinedBefore } = req.query;
  return ok(
    res,
    await listAdminUsers({
      page,
      limit,
      role,
      status,
      query,
      joinedAfter,
      joinedBefore
    })
  );
}

export async function userAction(req, res) {
  const payload = userActionSchema.parse(req.body);
  const result = await updateUserStatus(req.params.userId, payload.action, adminId(req));
  if (!result) {
    return fail(res, "User not found", 404);
  }

  return ok(res, result);
}

export async function jobs(req, res) {
  const { page, limit } = paginationSchema.parse(req.query);
  const { status } = req.query;
  return ok(res, await listAdminJobs({ page, limit, status }));
}

export async function jobAction(req, res) {
  const payload = jobActionSchema.parse(req.body);
  const result = await updateJobStatus(req.params.jobId, payload.action, payload.reason, adminId(req));
  if (!result) {
    return fail(res, "Job not found", 404);
  }

  return ok(res, result);
}

export async function disputes(req, res) {
  const { page, limit } = paginationSchema.parse(req.query);
  const { status } = req.query;
  return ok(res, await listAdminDisputes({ page, limit, status }));
}

export async function disputeAction(req, res) {
  const payload = disputeActionSchema.parse(req.body);
  const result = await updateDisputeStatus(
    req.params.disputeId,
    payload.action,
    payload.reason,
    adminId(req)
  );

  if (!result) {
    return fail(res, "Dispute not found", 404);
  }

  return ok(res, result);
}

export async function settings(req, res) {
  if (req.method === "GET") {
    return ok(res, await getPlatformSettings());
  }

  const patch = settingsSchema.parse(req.body);
  return ok(res, await updatePlatformSettings(patch, adminId(req)));
}

export async function auditLog(req, res) {
  const { page, limit } = paginationSchema.parse(req.query);
  const { admin, action, from, to } = req.query;
  return ok(res, await listAuditLog({ page, limit, admin, action, from, to }));
}

export async function notifications(req, res) {
  const { page, limit } = paginationSchema.parse(req.query);
  const { recipient } = req.query;
  return ok(res, await listNotifications({ page, limit, recipient }));
}
