import { ok, fail } from "../utils/response.js";
import {
  getAdminMetrics,
  listUsers,
  updateUserStatus,
  getUserDetail,
  listFlaggedJobs,
  updateJobFlag,
  sendJobRejectionNotice,
  listDisputes,
  getDisputeDetail,
  resolveDispute,
  listAuditLogs,
  getPlatformSettings,
  updatePlatformSetting,
} from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function getUsers(req, res) {
  try {
    const { page = "1", role, status, search } = req.query;
    const data = await listUsers({
      page: parseInt(page, 10),
      role,
      status,
      search,
    });
    return ok(res, data);
  } catch (err) {
    return fail(res, err.message);
  }
}

export async function patchUserStatus(req, res) {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    if (!["ACTIVE", "SUSPENDED", "BANNED"].includes(status)) {
      return fail(res, "Invalid status value", 400);
    }
    const updated = await updateUserStatus(userId, status, req.user.sub);
    return ok(res, updated);
  } catch (err) {
    return fail(res, err.message);
  }
}

export async function getUserDetails(req, res) {
  try {
    const { userId } = req.params;
    const data = await getUserDetail(userId);
    return ok(res, data);
  } catch (err) {
    return fail(res, err.message);
  }
}

export async function getFlaggedJobs(req, res) {
  try {
    const { page = "1", status } = req.query;
    const data = await listFlaggedJobs({
      page: parseInt(page, 10),
      status,
    });
    return ok(res, data);
  } catch (err) {
    return fail(res, err.message);
  }
}

export async function patchJobFlag(req, res) {
  try {
    const { jobId } = req.params;
    const { action, reason } = req.body;
    if (!["approve", "reject", "escalate"].includes(action)) {
      return fail(res, "Invalid action", 400);
    }
    const updated = await updateJobFlag(jobId, action, req.user.sub);
    if (action === "reject" && reason) {
      await sendJobRejectionNotice(jobId, reason);
    }
    return ok(res, updated);
  } catch (err) {
    return fail(res, err.message);
  }
}

export async function getDisputes(req, res) {
  try {
    const { page = "1", status } = req.query;
    const data = await listDisputes({ page: parseInt(page, 10), status });
    return ok(res, data);
  } catch (err) {
    return fail(res, err.message);
  }
}

export async function getDisputeDetails(req, res) {
  try {
    const { disputeId } = req.params;
    const data = await getDisputeDetail(disputeId);
    return ok(res, data);
  } catch (err) {
    return fail(res, err.message);
  }
}

export async function patchDispute(req, res) {
  try {
    const { disputeId } = req.params;
    const { ruling, reason, action } = req.body;
    if (!["RULE_FREELANCER", "RULE_CLIENT", "TRIGGER_REFUND", "ESCALATE"].includes(action)) {
      return fail(res, "Invalid action", 400);
    }
    const data = await resolveDispute(disputeId, action, ruling, reason, req.user.sub);
    return ok(res, data);
  } catch (err) {
    return fail(res, err.message);
  }
}

export async function getLogs(req, res) {
  try {
    const { page = "1", adminId, action, startDate, endDate } = req.query;
    const data = await listAuditLogs({
      page: parseInt(page, 10),
      adminId,
      action,
      startDate,
      endDate,
    });
    return ok(res, data);
  } catch (err) {
    return fail(res, err.message);
  }
}

export async function getSettings(req, res) {
  try {
    const data = await getPlatformSettings();
    return ok(res, data);
  } catch (err) {
    return fail(res, err.message);
  }
}

export async function patchSettings(req, res) {
  try {
    const { key, value } = req.body;
    if (!["allowRegistration", "allowJobPosting"].includes(key)) {
      return fail(res, "Invalid setting key", 400);
    }
    if (typeof value !== "boolean") {
      return fail(res, "Value must be a boolean", 400);
    }
    const updated = await updatePlatformSetting(key, value, req.user.sub);
    return ok(res, updated);
  } catch (err) {
    return fail(res, err.message);
  }
}
