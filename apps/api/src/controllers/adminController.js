import { ok, fail } from "../utils/response.js";
import {
  getAdminMetrics,
  listAllUsers,
  updateUserStatus,
  listFlaggedJobs,
  moderateJob,
  listDisputes,
  resolveDispute,
  getPlatformControls,
  updatePlatformControl,
  getAuditLogs
} from "../services/adminService.js";

export async function metrics(req, res) {
  try {
    const data = await getAdminMetrics();
    return ok(res, data);
  } catch (error) {
    return fail(res, error.message, 500);
  }
}

export async function getUsers(req, res) {
  try {
    const filters = {
      search: req.query.search,
      role: req.query.role,
      status: req.query.status,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 10
    };
    const data = await listAllUsers(filters);
    return ok(res, data);
  } catch (error) {
    return fail(res, error.message, 500);
  }
}

export async function postUserStatus(req, res) {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    if (!status) {
      return fail(res, "Status is required", 400);
    }
    const data = await updateUserStatus(req.user.sub, userId, status);
    return ok(res, data);
  } catch (error) {
    return fail(res, error.message, 500);
  }
}

export async function getFlaggedJobs(req, res) {
  try {
    const data = await listFlaggedJobs();
    return ok(res, data);
  } catch (error) {
    return fail(res, error.message, 500);
  }
}

export async function postModerateJob(req, res) {
  try {
    const { jobId } = req.params;
    const { action, reason } = req.body;
    if (!action) {
      return fail(res, "Action is required", 400);
    }
    const data = await moderateJob(req.user.sub, jobId, action, reason);
    return ok(res, data);
  } catch (error) {
    return fail(res, error.message, 500);
  }
}

export async function getDisputes(req, res) {
  try {
    const data = await listDisputes();
    return ok(res, data);
  } catch (error) {
    return fail(res, error.message, 500);
  }
}

export async function postResolveDispute(req, res) {
  try {
    const { disputeId } = req.params;
    const { decision, refundPercent } = req.body;
    if (!decision) {
      return fail(res, "Decision is required", 400);
    }
    const data = await resolveDispute(req.user.sub, disputeId, decision, refundPercent || 0);
    return ok(res, data);
  } catch (error) {
    return fail(res, error.message, 500);
  }
}

export async function getControls(req, res) {
  try {
    const data = await getPlatformControls();
    return ok(res, data);
  } catch (error) {
    return fail(res, error.message, 500);
  }
}

export async function postUpdateControl(req, res) {
  try {
    const { key, value } = req.body;
    if (key === undefined || value === undefined) {
      return fail(res, "Key and value are required", 400);
    }
    const data = await updatePlatformControl(req.user.sub, key, value);
    return ok(res, data);
  } catch (error) {
    return fail(res, error.message, 500);
  }
}

export async function getLogs(req, res) {
  try {
    const filters = {
      adminId: req.query.adminId,
      action: req.query.action,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    const data = await getAuditLogs(filters);
    return ok(res, data);
  } catch (error) {
    return fail(res, error.message, 500);
  }
}
