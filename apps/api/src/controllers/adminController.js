import { fail, ok } from "../utils/response.js";
import {
  getAdminMetrics, listUsers, getUserDetail,
  suspendUser, reinstateUser, banUser,
  listModeration, approveJob, rejectJob,
  listDisputes, getDisputeDetail, ruleOnDispute,
  getControls, updateControls, getAuditLog,
} from "../services/adminService.js";

function adminId(req) {
  return req.user?.sub || "unknown";
}

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  try {
    const result = await listUsers({
      search: req.query.search,
      role: req.query.role,
      status: req.query.status,
      page: parseInt(req.query.page) || 1,
      perPage: parseInt(req.query.perPage) || 20,
    });
    return ok(res, result);
  } catch (e) {
    return fail(res, e.message, 400);
  }
}

export async function userDetail(req, res) {
  try {
    return ok(res, await getUserDetail(req.params.id));
  } catch (e) {
    return fail(res, e.message, 404);
  }
}

export async function userSuspend(req, res) {
  try {
    return ok(res, await suspendUser(adminId(req), req.params.id));
  } catch (e) {
    return fail(res, e.message, 404);
  }
}

export async function userReinstate(req, res) {
  try {
    return ok(res, await reinstateUser(adminId(req), req.params.id));
  } catch (e) {
    return fail(res, e.message, 404);
  }
}

export async function userBan(req, res) {
  try {
    return ok(res, await banUser(adminId(req), req.params.id));
  } catch (e) {
    return fail(res, e.message, 404);
  }
}

export async function moderation(req, res) {
  const result = await listModeration({
    page: parseInt(req.query.page) || 1,
    perPage: parseInt(req.query.perPage) || 20,
    status: req.query.status,
  });
  return ok(res, result);
}

export async function moderationApprove(req, res) {
  try {
    return ok(res, await approveJob(adminId(req), req.params.id));
  } catch (e) {
    return fail(res, e.message, 404);
  }
}

export async function moderationReject(req, res) {
  try {
    const { reason } = req.body;
    return ok(res, await rejectJob(adminId(req), req.params.id, reason || "No reason provided"));
  } catch (e) {
    return fail(res, e.message, 404);
  }
}

export async function disputes(req, res) {
  const result = await listDisputes({
    page: parseInt(req.query.page) || 1,
    perPage: parseInt(req.query.perPage) || 20,
    status: req.query.status,
  });
  return ok(res, result);
}

export async function disputeDetail(req, res) {
  try {
    return ok(res, await getDisputeDetail(req.params.id));
  } catch (e) {
    return fail(res, e.message, 404);
  }
}

export async function disputeRule(req, res) {
  try {
    const { ruling, party } = req.body;
    return ok(res, await ruleOnDispute(adminId(req), req.params.id, ruling, party));
  } catch (e) {
    return fail(res, e.message, 400);
  }
}

export async function controls(req, res) {
  return ok(res, await getControls());
}

export async function controlsUpdate(req, res) {
  try {
    return ok(res, await updateControls(adminId(req), req.body));
  } catch (e) {
    return fail(res, e.message, 400);
  }
}

export async function auditLog(req, res) {
  const result = await getAuditLog({
    adminId: req.query.adminId,
    action: req.query.action,
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
    page: parseInt(req.query.page) || 1,
    perPage: parseInt(req.query.perPage) || 50,
  });
  return ok(res, result);
}
