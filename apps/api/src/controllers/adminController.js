import { ok, fail } from "../utils/response.js";
import {
  getAdminMetrics,
  getAdminUserDetail,
  getDisputeDetail,
  getPlatformControls,
  listAdminUsers,
  listAuditLogs,
  listDisputes,
  listModerationQueue,
  moderateListing,
  ruleDispute,
  updatePlatformControl,
  updateUserStatus
} from "../services/adminService.js";

function serviceFailure(res, error) {
  return fail(res, error.message || "Admin request failed", error.statusCode || 400);
}

export async function metrics(req, res) {
  try {
    return ok(res, await getAdminMetrics());
  } catch (error) {
    return serviceFailure(res, error);
  }
}

export async function users(req, res) {
  try {
    return ok(res, await listAdminUsers(req.query));
  } catch (error) {
    return serviceFailure(res, error);
  }
}

export async function userDetail(req, res) {
  try {
    return ok(res, await getAdminUserDetail(req.params.id));
  } catch (error) {
    return serviceFailure(res, error);
  }
}

export async function changeUserStatus(req, res) {
  try {
    return ok(res, await updateUserStatus(req.params.id, req.body, req.user));
  } catch (error) {
    return serviceFailure(res, error);
  }
}

export async function moderationQueue(req, res) {
  try {
    return ok(res, await listModerationQueue(req.query));
  } catch (error) {
    return serviceFailure(res, error);
  }
}

export async function moderateJob(req, res) {
  try {
    return ok(res, await moderateListing(req.params.id, req.body, req.user));
  } catch (error) {
    return serviceFailure(res, error);
  }
}

export async function disputes(req, res) {
  try {
    return ok(res, await listDisputes(req.query));
  } catch (error) {
    return serviceFailure(res, error);
  }
}

export async function disputeDetail(req, res) {
  try {
    return ok(res, await getDisputeDetail(req.params.id));
  } catch (error) {
    return serviceFailure(res, error);
  }
}

export async function disputeRuling(req, res) {
  try {
    return ok(res, await ruleDispute(req.params.id, req.body, req.user));
  } catch (error) {
    return serviceFailure(res, error);
  }
}

export async function platformControls(req, res) {
  try {
    return ok(res, await getPlatformControls());
  } catch (error) {
    return serviceFailure(res, error);
  }
}

export async function platformControlUpdate(req, res) {
  try {
    return ok(res, await updatePlatformControl(req.params.key, req.body, req.user));
  } catch (error) {
    return serviceFailure(res, error);
  }
}

export async function auditLogs(req, res) {
  try {
    return ok(res, await listAuditLogs(req.query));
  } catch (error) {
    return serviceFailure(res, error);
  }
}
