import { fail, ok } from "../utils/response.js";
import {
  decideListing,
  getAdminMetrics,
  getAdminUser,
  getDispute,
  getPlatformControls,
  listAdminUsers,
  listAuditLog,
  listDisputes,
  listModerationQueue,
  ruleDispute,
  updatePlatformControl,
  updateUserStatus
} from "../services/adminService.js";

const allowedUserStatuses = new Set(["active", "suspended", "banned"]);
const allowedListingDecisions = new Set(["approved", "rejected", "escalated"]);
const allowedDisputeRulings = new Set(["client", "freelancer", "refund", "escalate"]);

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  return ok(res, await listAdminUsers(req.query));
}

export async function userDetail(req, res) {
  const user = await getAdminUser(req.params.userId);
  return user ? ok(res, user) : fail(res, "User not found", 404);
}

export async function setUserStatus(req, res) {
  if (!allowedUserStatuses.has(req.body.status)) {
    return fail(res, "Status must be active, suspended, or banned", 422);
  }

  const result = await updateUserStatus(req.params.userId, req.body.status, req.user.sub);
  return result ? ok(res, result) : fail(res, "User not found", 404);
}

export async function moderationQueue(req, res) {
  return ok(res, await listModerationQueue(req.query));
}

export async function setListingDecision(req, res) {
  if (!allowedListingDecisions.has(req.body.decision)) {
    return fail(res, "Decision must be approved, rejected, or escalated", 422);
  }

  const result = await decideListing(req.params.listingId, req.body.decision, req.body.reason ?? "", req.user.sub);
  return result ? ok(res, result) : fail(res, "Listing not found", 404);
}

export async function disputes(req, res) {
  return ok(res, await listDisputes(req.query));
}

export async function disputeDetail(req, res) {
  const dispute = await getDispute(req.params.disputeId);
  return dispute ? ok(res, dispute) : fail(res, "Dispute not found", 404);
}

export async function setDisputeRuling(req, res) {
  if (!allowedDisputeRulings.has(req.body.ruling)) {
    return fail(res, "Ruling must be client, freelancer, refund, or escalate", 422);
  }

  const result = await ruleDispute(req.params.disputeId, req.body.ruling, req.user.sub, req.body.note ?? "");
  return result ? ok(res, result) : fail(res, "Dispute not found", 404);
}

export async function controls(req, res) {
  return ok(res, await getPlatformControls());
}

export async function setControl(req, res) {
  const result = await updatePlatformControl(req.params.key, req.body.enabled, req.user.sub);
  return result ? ok(res, result) : fail(res, "Platform control not found", 404);
}

export async function auditLog(req, res) {
  return ok(res, await listAuditLog(req.query));
}
