import { ok } from "../utils/response.js";
import {
  getAdminOverview,
  listAdminUsers,
  listAuditLog,
  listDisputes,
  listFlaggedListings,
  moderateListing,
  resolveDispute,
  updatePlatformControl,
  updateUserStatus
} from "../services/adminService.js";

function adminId(req) {
  return req.user?.sub ?? "usr_admin";
}

export async function overview(req, res) {
  return ok(res, await getAdminOverview());
}

export async function users(req, res) {
  return ok(res, await listAdminUsers(req.query));
}

export async function setUserStatus(req, res) {
  return ok(res, await updateUserStatus(req.params.userId, req.body.status, adminId(req)));
}

export async function moderationQueue(req, res) {
  return ok(res, await listFlaggedListings(req.query));
}

export async function moderateJob(req, res) {
  return ok(res, await moderateListing(req.params.listingId, req.body.action, req.body.reason, adminId(req)));
}

export async function disputeQueue(req, res) {
  return ok(res, await listDisputes(req.query));
}

export async function ruleDispute(req, res) {
  return ok(res, await resolveDispute(req.params.disputeId, req.body.ruling, adminId(req)));
}

export async function setPlatformControl(req, res) {
  return ok(res, await updatePlatformControl(req.params.control, req.body.enabled, adminId(req)));
}

export async function audit(req, res) {
  return ok(res, await listAuditLog(req.query));
}
