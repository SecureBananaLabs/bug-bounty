import { ok } from "../utils/response.js";
import { getAdminMetrics, getUsers, suspendUserById, banUserById, approveListingById, rejectListingById, resolveDisputeAction, toggleSetting, getAuditLog } from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  const { search, role, status, page = 1, limit = 20 } = req.query;
  return ok(res, await getUsers({ search, role, status, page: parseInt(page), limit: parseInt(limit) }));
}

export async function suspendUser(req, res) {
  const { userId, reason } = req.body;
  return ok(res, await suspendUserById(userId, reason, req.user.id));
}

export async function banUser(req, res) {
  const { userId, reason } = req.body;
  return ok(res, await banUserById(userId, reason, req.user.id));
}

export async function approveListing(req, res) {
  const { listingId } = req.body;
  return ok(res, await approveListingById(listingId, req.user.id));
}

export async function rejectListing(req, res) {
  const { listingId, reason } = req.body;
  return ok(res, await rejectListingById(listingId, reason, req.user.id));
}

export async function resolveDispute(req, res) {
  const { disputeId, ruling } = req.body;
  return ok(res, await resolveDisputeAction(disputeId, ruling, req.user.id));
}

export async function togglePlatformSetting(req, res) {
  const { setting, enabled } = req.body;
  return ok(res, await toggleSetting(setting, enabled, req.user.id));
}

export async function auditLog(req, res) {
  const { action, adminId, dateFrom, dateTo, page = 1, limit = 50 } = req.query;
  return ok(res, await getAuditLog({ action, adminId, dateFrom, dateTo, page: parseInt(page), limit: parseInt(limit) }));
}
