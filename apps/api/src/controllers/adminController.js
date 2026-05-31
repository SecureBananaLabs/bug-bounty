import {
  AdminServiceError,
  decideModerationJob,
  getAdminMetrics,
  getAdminUser,
  getDispute,
  getPlatformControls,
  listAdminUsers,
  listAuditLogs,
  listDisputes,
  listModerationJobs,
  ruleDispute,
  updatePlatformControl,
  updateUserStatus
} from "../services/adminService.js";
import { fail, ok } from "../utils/response.js";

function handleAdminError(error, res, next) {
  if (error instanceof AdminServiceError) {
    return fail(res, error.message, error.status);
  }

  return next(error);
}

function adminId(req) {
  return req.user?.sub ?? req.user?.id ?? "unknown_admin";
}

export async function metrics(req, res, next) {
  try {
    return ok(res, await getAdminMetrics());
  } catch (error) {
    return handleAdminError(error, res, next);
  }
}

export async function users(req, res, next) {
  try {
    return ok(res, await listAdminUsers(req.query));
  } catch (error) {
    return handleAdminError(error, res, next);
  }
}

export async function userDetails(req, res, next) {
  try {
    return ok(res, await getAdminUser(req.params.userId));
  } catch (error) {
    return handleAdminError(error, res, next);
  }
}

export async function userStatus(req, res, next) {
  try {
    return ok(res, await updateUserStatus(req.params.userId, req.body, adminId(req)));
  } catch (error) {
    return handleAdminError(error, res, next);
  }
}

export async function moderationJobs(req, res, next) {
  try {
    return ok(res, await listModerationJobs(req.query));
  } catch (error) {
    return handleAdminError(error, res, next);
  }
}

export async function moderationDecision(req, res, next) {
  try {
    return ok(res, await decideModerationJob(req.params.jobId, req.body, adminId(req)));
  } catch (error) {
    return handleAdminError(error, res, next);
  }
}

export async function disputeQueue(req, res, next) {
  try {
    return ok(res, await listDisputes(req.query));
  } catch (error) {
    return handleAdminError(error, res, next);
  }
}

export async function disputeDetails(req, res, next) {
  try {
    return ok(res, await getDispute(req.params.disputeId));
  } catch (error) {
    return handleAdminError(error, res, next);
  }
}

export async function disputeRuling(req, res, next) {
  try {
    return ok(res, await ruleDispute(req.params.disputeId, req.body, adminId(req)));
  } catch (error) {
    return handleAdminError(error, res, next);
  }
}

export async function platformControls(req, res, next) {
  try {
    return ok(res, await getPlatformControls());
  } catch (error) {
    return handleAdminError(error, res, next);
  }
}

export async function platformControlUpdate(req, res, next) {
  try {
    return ok(res, await updatePlatformControl(req.params.controlName, req.body, adminId(req)));
  } catch (error) {
    return handleAdminError(error, res, next);
  }
}

export async function auditLogs(req, res, next) {
  try {
    return ok(res, await listAuditLogs(req.query));
  } catch (error) {
    return handleAdminError(error, res, next);
  }
}
