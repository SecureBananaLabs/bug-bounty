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

function parseBody(schema, req) {
  return schema.parse(req.body);
}

function validationMessage(error) {
  if (error && Array.isArray(error.issues) && error.issues.length > 0) {
    return error.issues[0].message;
  }

  return "Invalid request payload";
}

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
  try {
    const payload = parseBody(userActionSchema, req);
    const result = await updateUserStatus(req.params.userId, payload.action, adminId(req));

    if (!result) {
      return fail(res, "User not found", 404);
    }

    return ok(res, result);
  } catch (error) {
    return fail(res, validationMessage(error), 400);
  }
}

export async function jobs(req, res) {
  const { page, limit } = paginationSchema.parse(req.query);
  const { status } = req.query;
  return ok(res, await listAdminJobs({ page, limit, status }));
}

export async function jobAction(req, res) {
  try {
    const payload = parseBody(jobActionSchema, req);
    const result = await updateJobStatus(req.params.jobId, payload.action, payload.reason, adminId(req));
    if (!result) {
      return fail(res, "Job not found", 404);
    }

    return ok(res, result);
  } catch (error) {
    return fail(res, validationMessage(error), 400);
  }
}

export async function disputes(req, res) {
  const { page, limit } = paginationSchema.parse(req.query);
  const { status } = req.query;
  return ok(res, await listAdminDisputes({ page, limit, status }));
}

export async function disputeAction(req, res) {
  try {
    const payload = parseBody(disputeActionSchema, req);
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
  } catch (error) {
    return fail(res, validationMessage(error), 400);
  }
}

export async function settings(req, res) {
  try {
    if (req.method === "GET") {
      return ok(res, await getPlatformSettings());
    }

    const patch = parseBody(settingsSchema, req);
    return ok(res, await updatePlatformSettings(patch, adminId(req)));
  } catch (error) {
    return fail(res, validationMessage(error), 400);
  }
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
