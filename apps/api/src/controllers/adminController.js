import { ok } from "../utils/response.js";
import {
  getAdminMetrics,
  getUsers,
  getUserDetail,
  suspendUser,
  reinstateUser,
  banUser,
  getFlaggedJobs,
  approveJob,
  rejectJob,
  escalateJob,
  getDisputes,
  getDisputeDetail,
  ruleDispute,
  getPlatformControls,
  updatePlatformControl,
  getAuditLog,
} from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function listUsers(req, res) {
  const { page = 1, pageSize = 10, search = "", role = "", status = "" } = req.query;
  return ok(res, await getUsers({ page: Number(page), pageSize: Number(pageSize), search, role, status }));
}

export async function handleUserDetail(req, res) {
  const user = await getUserDetail(req.params.id);
  if (!user) return ok(res, { error: "User not found" }, 404);
  return ok(res, user);
}

export async function handleSuspendUser(req, res) {
  return ok(res, await suspendUser(req.params.id));
}

export async function handleReinstateUser(req, res) {
  return ok(res, await reinstateUser(req.params.id));
}

export async function handleBanUser(req, res) {
  return ok(res, await banUser(req.params.id));
}

export async function listFlaggedJobs(req, res) {
  const { page = 1, pageSize = 10 } = req.query;
  return ok(res, await getFlaggedJobs({ page: Number(page), pageSize: Number(pageSize) }));
}

export async function handleApproveJob(req, res) {
  return ok(res, await approveJob(req.params.id));
}

export async function handleRejectJob(req, res) {
  const { reason } = req.body;
  return ok(res, await rejectJob(req.params.id, reason));
}

export async function handleEscalateJob(req, res) {
  return ok(res, await escalateJob(req.params.id));
}

export async function listDisputes(req, res) {
  const { page = 1, pageSize = 10, status = "" } = req.query;
  return ok(res, await getDisputes({ page: Number(page), pageSize: Number(pageSize), status }));
}

export async function handleDisputeDetail(req, res) {
  const dispute = await getDisputeDetail(req.params.id);
  if (!dispute) return ok(res, { error: "Dispute not found" }, 404);
  return ok(res, dispute);
}

export async function handleRuleDispute(req, res) {
  const { ruling, ruledInFavor, adminNotes } = req.body;
  return ok(res, await ruleDispute(req.params.id, { ruling, ruledInFavor, adminNotes }));
}

export async function getControls(req, res) {
  return ok(res, await getPlatformControls());
}

export async function updateControl(req, res) {
  const { key, value } = req.body;
  const adminId = req.user?.id || "unknown";
  return ok(res, await updatePlatformControl(key, value, adminId));
}

export async function getAuditLogs(req, res) {
  const { page = 1, pageSize = 20, adminId = "", action = "", startDate = "", endDate = "" } = req.query;
  return ok(res, await getAuditLog({ page: Number(page), pageSize: Number(pageSize), adminId, action, startDate, endDate }));
}
