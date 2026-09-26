import { ok } from "../utils/response.js";
import {
  decideListing,
  getAdminMetrics,
  getAuditLog,
  getControls,
  getDisputeDetail,
  getDisputes,
  getModerationQueue,
  getUserDetail,
  getUsers,
  ruleDispute,
  updateControl,
  updateUserStatus
} from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  return ok(res, await getUsers(req.query));
}

export async function userDetail(req, res) {
  return ok(res, await getUserDetail(req.params.id));
}

export async function userStatus(req, res) {
  return ok(res, await updateUserStatus(req.params.id, req.body, req.user));
}

export async function moderation(req, res) {
  return ok(res, await getModerationQueue(req.query));
}

export async function moderationDecision(req, res) {
  return ok(res, await decideListing(req.params.id, req.body, req.user));
}

export async function disputes(req, res) {
  return ok(res, await getDisputes(req.query));
}

export async function disputeDetail(req, res) {
  return ok(res, await getDisputeDetail(req.params.id));
}

export async function disputeRuling(req, res) {
  return ok(res, await ruleDispute(req.params.id, req.body, req.user));
}

export async function controls(req, res) {
  return ok(res, await getControls());
}

export async function platformControl(req, res) {
  return ok(res, await updateControl(req.params.key, req.body, req.user));
}

export async function auditLog(req, res) {
  return ok(res, await getAuditLog(req.query));
}
