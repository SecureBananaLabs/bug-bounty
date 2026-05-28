import { ok, fail } from "../utils/response.js";
import {
  getAdminMetrics,
  listUsers,
  getUserDetail,
  updateUserStatus,
  listFlaggedJobs,
  moderateJob,
  listDisputes,
  getDisputeDetail,
  resolveDispute,
  getPlatformConfig,
  updatePlatformConfig,
  listAuditLogs,
  getTrustScoreDistribution,
} from "../services/adminService.js";

// ── Metrics ──────────────────────────────────────────────────────────────────

export async function metrics(req, res) {
  try {
    return ok(res, await getAdminMetrics());
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function trustScores(req, res) {
  try {
    return ok(res, await getTrustScoreDistribution());
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

// ── User Management ──────────────────────────────────────────────────────────

export async function getUsers(req, res) {
  try {
    const { page, limit, role, status, search } = req.query;
    return ok(
      res,
      await listUsers({
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        role,
        status,
        search,
      })
    );
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function getUser(req, res) {
  try {
    const user = await getUserDetail(req.params.id);
    if (!user) return fail(res, "User not found", 404);
    return ok(res, user);
  } catch (err) {
    return fail(res, err.message, err.message === "User not found" ? 404 : 500);
  }
}

export async function setUserStatus(req, res) {
  try {
    const { status } = req.body;
    if (!["ACTIVE", "SUSPENDED", "BANNED"].includes(status)) {
      return fail(res, "Invalid status", 400);
    }
    const user = await updateUserStatus(
      req.params.id,
      req.user.id,
      status
    );
    return ok(res, user);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

// ── Job Moderation ───────────────────────────────────────────────────────────

export async function getFlaggedJobs(req, res) {
  try {
    const { page, limit } = req.query;
    return ok(
      res,
      await listFlaggedJobs({
        page: Number(page) || 1,
        limit: Number(limit) || 20,
      })
    );
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function moderateJobHandler(req, res) {
  try {
    const { action, reason } = req.body;
    if (!["approve", "reject", "escalate"].includes(action)) {
      return fail(res, "Invalid action", 400);
    }
    const job = await moderateJob(req.params.id, req.user.id, action, reason);
    return ok(res, job);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

// ── Dispute Resolution ───────────────────────────────────────────────────────

export async function getDisputes(req, res) {
  try {
    const { page, limit, status } = req.query;
    return ok(
      res,
      await listDisputes({
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        status,
      })
    );
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function getDispute(req, res) {
  try {
    const dispute = await getDisputeDetail(req.params.id);
    if (!dispute) return fail(res, "Dispute not found", 404);
    return ok(res, dispute);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function resolveDisputeHandler(req, res) {
  try {
    const { ruling, resolution } = req.body;
    if (!ruling) return fail(res, "Ruling is required", 400);
    const dispute = await resolveDispute(
      req.params.id,
      req.user.id,
      ruling,
      resolution
    );
    return ok(res, dispute);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

// ── Platform Controls ────────────────────────────────────────────────────────

export async function getConfig(req, res) {
  try {
    return ok(res, await getPlatformConfig());
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function setConfig(req, res) {
  try {
    const { key, value } = req.body;
    if (!["allowRegistration", "allowJobPosting"].includes(key)) {
      return fail(res, "Invalid config key", 400);
    }
    return ok(res, await updatePlatformConfig(key, value, req.user.id));
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

// ── Audit Log ────────────────────────────────────────────────────────────────

export async function getAuditLogs(req, res) {
  try {
    const { page, limit, adminId, action, fromDate, toDate } = req.query;
    return ok(
      res,
      await listAuditLogs({
        page: Number(page) || 1,
        limit: Number(limit) || 50,
        adminId,
        action,
        fromDate,
        toDate,
      })
    );
  } catch (err) {
    return fail(res, err.message, 500);
  }
}
