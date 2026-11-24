import { ok } from "../utils/response.js";
import {
  getAdminMetrics, getUsers, getUserDetail,
  suspendUser, reinstateUser, banUser, deleteUser,
  getFlaggedJobs, approveJob, rejectJob, escalateJob,
  getDisputes, getDisputeDetail, ruleDispute,
  getPlatformControls, updatePlatformControl,
  getAuditLog,
} from "../services/adminService.js";

export async function getMetrics(req, res) { return ok(res, await getAdminMetrics()); }

export async function listUsers(req, res) {
  const { page, limit, search, role, status } = req.query;
  return ok(res, await getUsers({ page: parseInt(page) || 1, limit: parseInt(limit) || 10, search, role, status }));
}

export async function getUser(req, res) {
  const user = await getUserDetail(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  return ok(res, user);
}

export async function handleSuspendUser(req, res) { return ok(res, await suspendUser(req.params.id)); }
export async function handleReinstateUser(req, res) { return ok(res, await reinstateUser(req.params.id)); }
export async function handleBanUser(req, res) { return ok(res, await banUser(req.params.id)); }
export async function handleDeleteUser(req, res) { return ok(res, await deleteUser(req.params.id)); }

export async function listFlaggedJobs(req, res) {
  const { page, limit } = req.query;
  return ok(res, await getFlaggedJobs({ page: parseInt(page) || 1, limit: parseInt(limit) || 10 }));
}

export async function handleApproveJob(req, res) { return ok(res, await approveJob(req.params.id)); }

export async function handleRejectJob(req, res) {
  const { reason } = req.body;
  return ok(res, await rejectJob(req.params.id, reason));
}

export async function handleEscalateJob(req, res) { return ok(res, await escalateJob(req.params.id)); }

export async function listDisputes(req, res) {
  const { page, limit, status } = req.query;
  return ok(res, await getDisputes({ page: parseInt(page) || 1, limit: parseInt(limit) || 10, status }));
}

export async function getDispute(req, res) {
  const dispute = await getDisputeDetail(req.params.id);
  if (!dispute) return res.status(404).json({ success: false, message: "Dispute not found" });
  return ok(res, dispute);
}

export async function handleRuleDispute(req, res) {
  return ok(res, await ruleDispute(req.params.id, req.body));
}

export async function getControls(req, res) { return ok(res, await getPlatformControls()); }

export async function updateControl(req, res) {
  const { key, value } = req.body;
  return ok(res, await updatePlatformControl(key, value));
}

export async function getAudit(req, res) {
  const { page, limit, action, performedBy, startDate, endDate } = req.query;
  return ok(res, await getAuditLog({ page: parseInt(page) || 1, limit: parseInt(limit) || 10, action, performedBy, startDate, endDate }));
}
