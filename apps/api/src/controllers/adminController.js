import { ok, fail } from "../utils/response.js";
import {
  getAdminMetrics,
  listUsers,
  getUser,
  updateUserStatus,
  listFlaggedJobs,
  moderateJob,
  listDisputes,
  getDispute,
  resolveDispute,
  getPlatformSettings,
  togglePlatformSetting,
  getAuditLog,
} from "../services/adminService.js";

// ── Metrics ───────────────────────────────────────────────────────────

export async function metrics(req, res) {
  try {
    return ok(res, await getAdminMetrics());
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

// ── User Management ───────────────────────────────────────────────────

export async function getUsers(req, res) {
  try {
    const { page, limit, role, status, search } = req.query;
    const result = await listUsers({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      role,
      status,
      search,
    });
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function getUserById(req, res) {
  try {
    const user = await getUser(Number(req.params.id));
    return ok(res, user);
  } catch (err) {
    return fail(res, err.message, 404);
  }
}

export async function suspendUser(req, res) {
  try {
    const user = await updateUserStatus(
      Number(req.params.id),
      "suspended",
      req.user.id
    );
    return ok(res, user);
  } catch (err) {
    return fail(res, err.message, 404);
  }
}

export async function reinstateUser(req, res) {
  try {
    const user = await updateUserStatus(
      Number(req.params.id),
      "active",
      req.user.id
    );
    return ok(res, user);
  } catch (err) {
    return fail(res, err.message, 404);
  }
}

export async function banUser(req, res) {
  try {
    const user = await updateUserStatus(
      Number(req.params.id),
      "banned",
      req.user.id
    );
    return ok(res, user);
  } catch (err) {
    return fail(res, err.message, 404);
  }
}

// ── Job Moderation ────────────────────────────────────────────────────

export async function getFlaggedJobs(req, res) {
  try {
    const { page, limit } = req.query;
    const result = await listFlaggedJobs({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function moderateJobAction(req, res) {
  try {
    const { action, reason } = req.body;
    if (!["approved", "rejected", "escalated"].includes(action)) {
      return fail(res, "Invalid action. Use: approved, rejected, escalated", 400);
    }
    const job = await moderateJob(
      Number(req.params.id),
      action,
      reason,
      req.user.id
    );
    return ok(res, job);
  } catch (err) {
    return fail(res, err.message, 404);
  }
}

// ── Dispute Resolution ────────────────────────────────────────────────

export async function getDisputes(req, res) {
  try {
    const { page, limit, status } = req.query;
    const result = await listDisputes({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status,
    });
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function getDisputeById(req, res) {
  try {
    const dispute = await getDispute(Number(req.params.id));
    return ok(res, dispute);
  } catch (err) {
    return fail(res, err.message, 404);
  }
}

export async function resolveDisputeAction(req, res) {
  try {
    const { ruling } = req.body;
    if (!ruling) return fail(res, "ruling is required", 400);
    const dispute = await resolveDispute(
      Number(req.params.id),
      ruling,
      req.user.id
    );
    return ok(res, dispute);
  } catch (err) {
    return fail(res, err.message, 404);
  }
}

// ── Platform Controls ─────────────────────────────────────────────────

export async function getSettings(req, res) {
  try {
    return ok(res, await getPlatformSettings());
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function updateSetting(req, res) {
  try {
    const { key, value } = req.body;
    if (!key || typeof value !== "boolean") {
      return fail(res, "key (string) and value (boolean) are required", 400);
    }
    const settings = await togglePlatformSetting(key, value, req.user.id);
    return ok(res, settings);
  } catch (err) {
    return fail(res, err.message, 400);
  }
}

// ── Audit Log ─────────────────────────────────────────────────────────

export async function getAudit(req, res) {
  try {
    const { page, limit, adminId, action, from, to } = req.query;
    const result = await getAuditLog({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      adminId: adminId ? Number(adminId) : undefined,
      action,
      from,
      to,
    });
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}
