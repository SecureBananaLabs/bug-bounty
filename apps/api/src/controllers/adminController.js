import { ok, fail } from "../utils/response.js";
import {
  getAdminMetrics,
  listUsers,
  getUserDetail,
  suspendUser,
  reinstateUser,
  banUser,
  listFlaggedJobs,
  approveJob,
  rejectJob,
  escalateJob,
  listDisputes,
  getDisputeDetail,
  resolveDispute,
  escalateDispute,
  getPlatformControls,
  togglePlatformControl,
  listAuditLog,
} from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function getUsers(req, res) {
  const { role, status, page, limit } = req.query;
  const result = await listUsers({
    role,
    status,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
  });
  return ok(res, result);
}

export async function getUser(req, res) {
  const user = await getUserDetail(req.params.id);
  if (!user) return fail(res, "User not found", 404);
  return ok(res, user);
}

export async function suspend(req, res) {
  try {
    const user = await suspendUser(req.params.id, req.user.userId, req.body.reason);
    return ok(res, user);
  } catch (err) {
    return fail(res, err.message, 400);
  }
}

export async function reinstate(req, res) {
  try {
    const user = await reinstateUser(req.params.id, req.user.userId);
    return ok(res, user);
  } catch (err) {
    return fail(res, err.message, 400);
  }
}

export async function ban(req, res) {
  try {
    const user = await banUser(req.params.id, req.user.userId, req.body.reason);
    return ok(res, user);
  } catch (err) {
    return fail(res, err.message, 400);
  }
}

export async function getFlaggedJobs(req, res) {
  const { status, page, limit } = req.query;
  const result = await listFlaggedJobs({
    status,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
  });
  return ok(res, result);
}

export async function approve(req, res) {
  try {
    const job = await approveJob(req.params.id, req.user.userId);
    return ok(res, job);
  } catch (err) {
    return fail(res, err.message, 400);
  }
}

export async function reject(req, res) {
  try {
    const job = await rejectJob(req.params.id, req.user.userId, req.body.reason);
    return ok(res, job);
  } catch (err) {
    return fail(res, err.message, 400);
  }
}

export async function escalate(req, res) {
  try {
    const job = await escalateJob(req.params.id, req.user.userId);
    return ok(res, job);
  } catch (err) {
    return fail(res, err.message, 400);
  }
}

export async function getDisputes(req, res) {
  const { status, page, limit } = req.query;
  const result = await listDisputes({
    status,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
  });
  return ok(res, result);
}

export async function getDispute(req, res) {
  const dispute = await getDisputeDetail(req.params.id);
  if (!dispute) return fail(res, "Dispute not found", 404);
  return ok(res, dispute);
}

export async function resolve(req, res) {
  try {
    const { ruling, triggerRefund } = req.body;
    if (!ruling || (ruling !== "freelancer" && ruling !== "client")) {
      return fail(res, "ruling must be 'freelancer' or 'client'", 400);
    }
    const dispute = await resolveDispute(
      req.params.id,
      req.user.userId,
      ruling,
      !!triggerRefund
    );
    return ok(res, dispute);
  } catch (err) {
    return fail(res, err.message, 400);
  }
}

export async function escalateDispute(req, res) {
  try {
    const dispute = await escalateDispute(req.params.id, req.user.userId);
    return ok(res, dispute);
  } catch (err) {
    return fail(res, err.message, 400);
  }
}

export async function getControls(req, res) {
  return ok(res, await getPlatformControls());
}

export async function toggleControl(req, res) {
  try {
    const { key, value } = req.body;
    if (typeof key !== "string" || typeof value !== "boolean") {
      return fail(res, "key (string) and value (boolean) required", 400);
    }
    const controls = await togglePlatformControl(key, value, req.user.userId);
    return ok(res, controls);
  } catch (err) {
    return fail(res, err.message, 400);
  }
}

export async function getAuditLog(req, res) {
  const { adminId, action, dateFrom, dateTo, page, limit } = req.query;
  const result = await listAuditLog({
    adminId,
    action,
    dateFrom,
    dateTo,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 50,
  });
  return ok(res, result);
}
