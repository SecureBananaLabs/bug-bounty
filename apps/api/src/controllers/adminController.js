import { fail, ok } from "../utils/response.js";
import {
  decideListing,
  getAdminMetrics,
  getAdminOverview,
  listAuditLog,
  listDisputes,
  listModerationQueue,
  listUsers,
  ruleDispute,
  updatePlatformControl,
  updateUserStatus
} from "../services/adminService.js";

function adminId(req) {
  return req.user?.sub ?? req.user?.id ?? "unknown-admin";
}

async function handle(res, action, status = 200) {
  try {
    return ok(res, await action(), status);
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

export async function metrics(req, res) {
  return handle(res, () => getAdminMetrics());
}

export async function overview(req, res) {
  return handle(res, () => getAdminOverview());
}

export async function users(req, res) {
  return handle(res, () => listUsers(req.query));
}

export async function setUserStatus(req, res) {
  return handle(res, () => updateUserStatus(adminId(req), req.params.userId, req.body.status));
}

export async function moderation(req, res) {
  return handle(res, () => listModerationQueue(req.query));
}

export async function setListingDecision(req, res) {
  return handle(res, () =>
    decideListing(adminId(req), req.params.listingId, req.body.decision, req.body.reason)
  );
}

export async function disputes(req, res) {
  return handle(res, () => listDisputes(req.query));
}

export async function setDisputeRuling(req, res) {
  return handle(res, () => ruleDispute(adminId(req), req.params.disputeId, req.body.ruling));
}

export async function setPlatformControl(req, res) {
  return handle(res, () =>
    updatePlatformControl(adminId(req), req.params.key, req.body.enabled)
  );
}

export async function audit(req, res) {
  return handle(res, () => listAuditLog(req.query));
}
