import { fail, ok } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";
import * as adminService from "../services/adminService.js";

export function metrics(req, res) {
  adminService.getAdminMetrics().then((data) => ok(res, data)).catch((err) => fail(res, err.message, 500));
}

export function usersList(req, res) {
  const { page, pageSize, search, role, status, from, to } = req.query;
  adminService.listUsers({ page: Number(page) || 1, pageSize: Number(pageSize) || 10, search, role, status, from, to }).then((data) => ok(res, data)).catch((err) => fail(res, err.message, 500));
}

export function userProfile(req, res) {
  const userId = req.params.id;
  adminService.getUserProfile(userId).then((data) => { if (!data) return fail(res, "User not found", 404); ok(res, data); }).catch((err) => fail(res, err.message, 500));
}

export function userStatusUpdate(req, res) {
  const admin = req.user;
  if (admin.role !== "ADMIN") return fail(res, "Forbidden", 403);
  const userId = req.params.id;
  const { action, reason } = req.body;
  adminService.updateUserStatus(userId, action, reason, admin.sub).then((data) => { if (!data) return fail(res, "User not found", 404); ok(res, data); }).catch((err) => fail(res, err.message, 500));
}

export function flaggedJobs(req, res) {
  const { page, pageSize } = req.query;
  adminService.listFlaggedJobs({ page: Number(page) || 1, pageSize: Number(pageSize) || 10 }).then((data) => ok(res, data)).catch((err) => fail(res, err.message, 500));
}

export function moderateListing(req, res) {
  const admin = req.user;
  if (admin.role !== "ADMIN") return fail(res, "Forbidden", 403);
  const { decision } = req.body;
  adminService.moderateJob(req.params.id, decision, admin.sub).then((data) => { if (!data) return fail(res, "Job not found", 404); ok(res, data); }).catch((err) => fail(res, err.message, 500));
}

export function disputesList(req, res) {
  const { page, pageSize, status } = req.query;
  adminService.listDisputes({ page: Number(page) || 1, pageSize: Number(pageSize) || 10, status }).then((data) => ok(res, data)).catch((err) => fail(res, err.message, 500));
}

export function disputeDetail(req, res) {
  adminService.getDispute(req.params.id).then((data) => { if (!data) return fail(res, "Dispute not found", 404); ok(res, data); }).catch((err) => fail(res, err.message, 500));
}

export function resolveDispute(req, res) {
  const admin = req.user;
  if (admin.role !== "ADMIN") return fail(res, "Forbidden", 403);
  const { ruling } = req.body;
  adminService.resolveDispute(req.params.id, ruling, admin.sub).then((data) => { if (!data) return fail(res, "Dispute not found", 404); ok(res, data); }).catch((err) => fail(res, err.message, 500));
}

export function trustDistribution(req, res) {
  adminService.getTrustDistribution().then((data) => ok(res, data)).catch((err) => fail(res, err.message, 500));
}

export function platformControls(req, res) {
  adminService.getPlatformControls().then((data) => ok(res, data)).catch((err) => fail(res, err.message, 500));
}

export function updatePlatformControl(req, res) {
  const admin = req.user;
  if (admin.role !== "ADMIN") return fail(res, "Forbidden", 403);
  const { control, enabled } = req.body;
  adminService.updatePlatformControl(control, enabled, admin.sub).then((data) => ok(res, data)).catch((err) => fail(res, err.message, 500));
}

export function auditLogList(req, res) {
  const { adminId, action, from, to } = req.query;
  adminService.listAuditLog({ adminId, action, from, to }).then((data) => ok(res, data)).catch((err) => fail(res, err.message, 500));
}
