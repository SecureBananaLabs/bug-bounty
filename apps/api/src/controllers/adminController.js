import { ok } from "../utils/response.js";
import {
  getAdminDashboardMetrics,
  listAdminUsers,
  getUserProfile,
  suspendUser,
  reinstateUser,
  banUser,
  listFlaggedJobs,
  approveFlaggedJob,
  rejectFlaggedJob,
  escalateFlaggedJob,
  listDisputes,
  getDisputeDetail,
  ruleOnDispute,
  getPlatformSettings,
  updatePlatformSetting,
} from "../services/adminService.js";

// ── Dashboard / Metrics ────────────────────────────────────────────────────

export async function metrics(req, res) {
  return ok(res, await getAdminDashboardMetrics());
}

// ── User Management ────────────────────────────────────────────────────────

export async function listUsers(req, res) {
  const { page = 1, limit = 20, search, role, status, joinFrom, joinTo } = req.query;
  return ok(res, await listAdminUsers({ page: Number(page), limit: Number(limit), search, role, status, joinFrom, joinTo }));
}

export async function getUser(req, res) {
  return ok(res, await getUserProfile(req.params.userId));
}

export async function suspendUserAction(req, res) {
  return ok(res, await suspendUser(req.params.userId));
}

export async function reinstateUserAction(req, res) {
  return ok(res, await reinstateUser(req.params.userId));
}

export async function banUserAction(req, res) {
  return ok(res, await banUser(req.params.userId));
}

// ── Job Moderation ─────────────────────────────────────────────────────────

export async function listFlagged(req, res) {
  const { status, page = 1, limit = 20 } = req.query;
  return ok(res, await listFlaggedJobs({ status, page: Number(page), limit: Number(limit) }));
}

export async function approveFlag(req, res) {
  return ok(res, await approveFlaggedJob(req.params.flagId));
}

export async function rejectFlag(req, res) {
  return ok(res, await rejectFlaggedJob(req.params.flagId, req.body.reason));
}

export async function escalateFlag(req, res) {
  return ok(res, await escalateFlaggedJob(req.params.flagId));
}

// ── Dispute Resolution ─────────────────────────────────────────────────────

export async function listDisputesAction(req, res) {
  const { status, page = 1, limit = 20 } = req.query;
  return ok(res, await listDisputes({ status, page: Number(page), limit: Number(limit) }));
}

export async function getDispute(req, res) {
  return ok(res, await getDisputeDetail(req.params.disputeId));
}

export async function ruleOnDisputeAction(req, res) {
  const { rulingSide, rulingNote } = req.body;
  return ok(res, await ruleOnDispute(req.params.disputeId, rulingSide, rulingNote));
}

// ── Platform Settings ──────────────────────────────────────────────────────

export async function getSettings(req, res) {
  return ok(res, await getPlatformSettings());
}

export async function updateSetting(req, res) {
  const { key, value } = req.body;
  return ok(res, await updatePlatformSetting(key, value));
}
