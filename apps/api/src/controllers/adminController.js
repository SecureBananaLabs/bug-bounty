import { ok } from "../utils/response.js";
import {
  getAdminMetrics,
  getUsers,
  getUserDetail,
  suspendUser,
  reinstateUser,
  banUser,
  getFlaggedJobs,
  moderateJob,
  getDisputes,
  resolveDispute,
  getPlatformSettings,
  updatePlatformSetting,
  getAuditLog,
} from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function listUsers(req, res) {
  return ok(res, await getUsers(req.query));
}

export async function userDetail(req, res) {
  const user = await getUserDetail(req.params.id);
  if (!user) return ok(res, { error: "User not found" }, 404);
  return ok(res, user);
}

export async function suspend(req, res) {
  const user = await suspendUser(req.user.sub, req.params.id, req.body.reason);
  if (!user) return ok(res, { error: "User not found" }, 404);
  return ok(res, { message: "User suspended", user });
}

export async function reinstate(req, res) {
  const user = await reinstateUser(req.user.sub, req.params.id);
  if (!user) return ok(res, { error: "User not found" }, 404);
  return ok(res, { message: "User reinstated", user });
}

export async function ban(req, res) {
  const user = await banUser(req.user.sub, req.params.id, req.body.reason);
  if (!user) return ok(res, { error: "User not found" }, 404);
  return ok(res, { message: "User banned", user });
}

export async function flaggedJobs(req, res) {
  return ok(res, await getFlaggedJobs(req.query));
}

export async function moderate(req, res) {
  const job = await moderateJob(req.user.sub, req.params.id, req.body.action, req.body.reason);
  if (!job) return ok(res, { error: "Job not found" }, 404);
  return ok(res, { message: `Job ${req.body.action}d`, job });
}

export async function disputes(req, res) {
  return ok(res, await getDisputes(req.query));
}

export async function resolve(req, res) {
  const job = await resolveDispute(req.user.sub, req.params.id, req.body.ruling, req.body.refund);
  if (!job) return ok(res, { error: "Job not found" }, 404);
  return ok(res, { message: "Dispute resolved", job });
}

export async function settings(req, res) {
  return ok(res, getPlatformSettings());
}

export async function updateSetting(req, res) {
  const result = updatePlatformSetting(req.user.sub, req.params.key, req.body.value);
  if (!result) return ok(res, { error: "Invalid setting key" }, 400);
  return ok(res, { message: "Setting updated", settings: result });
}

export async function auditLogs(req, res) {
  return ok(res, getAuditLog(req.query));
}
