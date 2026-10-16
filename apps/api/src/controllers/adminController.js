import { ok, fail } from "../utils/response.js";
import {
  getAdminMetrics,
  getTrustScoreDistribution,
  getUsers,
  getUserById,
  setUserStatus,
  getFlaggedJobList,
  moderateJobById,
  getDisputes,
  resolveDisputeById,
  getPlatformConfig,
  updatePlatformConfig,
  getAuditLogList
} from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function trustScores(req, res) {
  return ok(res, await getTrustScoreDistribution());
}

export async function listUsers(req, res) {
  const { search, role, status, page = "1", limit = "20" } = req.query;
  return ok(
    res,
    await getUsers({
      search,
      role,
      status,
      page: Number(page),
      limit: Number(limit)
    })
  );
}

export async function getUserDetail(req, res) {
  const user = await getUserById(req.params.id);
  if (!user) return fail(res, "User not found", 404);
  return ok(res, user);
}

export async function updateUserStatus(req, res) {
  const { status } = req.body;
  const validStatuses = ["ACTIVE", "SUSPENDED", "BANNED"];
  if (!status || !validStatuses.includes(status)) {
    return fail(res, "Invalid status. Must be one of: ACTIVE, SUSPENDED, BANNED");
  }
  const user = await setUserStatus(req.params.id, status, req.user.sub);
  if (!user) return fail(res, "User not found", 404);
  return ok(res, user);
}

export async function getFlaggedJobs(req, res) {
  return ok(res, await getFlaggedJobList());
}

export async function moderateJob(req, res) {
  const { action } = req.body;
  const validActions = ["approve", "reject", "escalate"];
  if (!action || !validActions.includes(action)) {
    return fail(res, "Invalid action. Must be one of: approve, reject, escalate");
  }
  const job = await moderateJobById(req.params.id, action, req.user.sub);
  if (!job) return fail(res, "Job not found", 404);
  return ok(res, job);
}

export async function listDisputes(req, res) {
  const { status } = req.query;
  return ok(res, await getDisputes({ status }));
}

export async function resolveDispute(req, res) {
  const { ruling } = req.body;
  if (!ruling || typeof ruling !== "string" || ruling.trim().length === 0) {
    return fail(res, "Ruling text is required");
  }
  const dispute = await resolveDisputeById(req.params.id, ruling, req.user.sub);
  if (!dispute) return fail(res, "Dispute not found", 404);
  return ok(res, dispute);
}

export async function getConfig(req, res) {
  return ok(res, await getPlatformConfig());
}

export async function updateConfig(req, res) {
  const { registrationEnabled, jobPostingEnabled } = req.body;
  const config = await updatePlatformConfig(
    { registrationEnabled, jobPostingEnabled },
    req.user.sub
  );
  return ok(res, config);
}

export async function getAuditLogs(req, res) {
  const { action, startDate, endDate, page = "1", limit = "50" } = req.query;
  return ok(
    res,
    await getAuditLogList({
      action,
      startDate,
      endDate,
      page: Number(page),
      limit: Number(limit)
    })
  );
}
