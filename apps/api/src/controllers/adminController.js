import { fail, ok } from "../utils/response.js";
import {
  applyDisputeRuling,
  getAdminMetrics,
  getAdminUser,
  getDispute,
  getPlatformControls,
  listAdminUsers,
  listAuditLog,
  listDisputes,
  listModerationJobs,
  moderateJob,
  setPlatformControl,
  setUserStatus
} from "../services/adminService.js";

function adminId(req) {
  return req.user?.sub ?? req.user?.id ?? "admin";
}

async function handle(res, operation, status = 200) {
  try {
    return ok(res, await operation(), status);
  } catch (error) {
    return fail(res, error.message ?? "Admin request failed", error.statusCode ?? 500);
  }
}

export async function metrics(req, res) {
  return handle(res, () => getAdminMetrics());
}

export async function users(req, res) {
  return handle(res, () => listAdminUsers(req.query));
}

export async function userDetail(req, res) {
  return handle(res, () => getAdminUser(req.params.id));
}

export async function updateUserStatus(req, res) {
  return handle(res, () =>
    setUserStatus(req.params.id, req.body.status, req.body.reason, adminId(req))
  );
}

export async function moderationJobs(req, res) {
  return handle(res, () => listModerationJobs(req.query));
}

export async function updateJobModeration(req, res) {
  return handle(res, () =>
    moderateJob(req.params.id, req.body.action, req.body.reason, adminId(req))
  );
}

export async function disputes(req, res) {
  return handle(res, () => listDisputes(req.query));
}

export async function disputeDetail(req, res) {
  return handle(res, () => getDispute(req.params.id));
}

export async function ruleDispute(req, res) {
  return handle(res, () =>
    applyDisputeRuling(req.params.id, req.body.ruling, req.body.reason, adminId(req))
  );
}

export async function controls(req, res) {
  return handle(res, () => getPlatformControls());
}

export async function updateControl(req, res) {
  return handle(res, () =>
    setPlatformControl(req.params.key, req.body.enabled, req.body.reason, adminId(req))
  );
}

export async function auditLog(req, res) {
  return handle(res, () => listAuditLog(req.query));
}
