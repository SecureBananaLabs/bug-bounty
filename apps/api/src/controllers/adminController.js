import { fail, ok } from "../utils/response.js";
import {
  decideFlaggedListing,
  getAdminMetrics,
  getDispute,
  getPlatformControls,
  listAuditLog,
  listDisputes,
  listFlaggedListings,
  listUsers,
  ruleOnDispute,
  setPlatformControls,
  setUserStatus
} from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  return ok(res, await listUsers(req.query));
}

export async function updateUser(req, res) {
  const result = await setUserStatus(req.params.id, req.body, req.user);
  if (!result) return fail(res, "User not found", 404);
  if (result.error) return fail(res, result.error, 400);
  return ok(res, result);
}

export async function jobModeration(req, res) {
  return ok(res, await listFlaggedListings(req.query));
}

export async function updateListing(req, res) {
  const result = await decideFlaggedListing(req.params.id, req.body, req.user);
  if (!result) return fail(res, "Flagged listing not found", 404);
  if (result.error) return fail(res, result.error, 400);
  return ok(res, result);
}

export async function disputes(req, res) {
  return ok(res, await listDisputes(req.query));
}

export async function disputeDetails(req, res) {
  const dispute = await getDispute(req.params.id);
  if (!dispute) return fail(res, "Dispute not found", 404);
  return ok(res, dispute);
}

export async function ruleDispute(req, res) {
  const result = await ruleOnDispute(req.params.id, req.body, req.user);
  if (!result) return fail(res, "Dispute not found", 404);
  if (result.error) return fail(res, result.error, 400);
  return ok(res, result);
}

export async function controls(req, res) {
  return ok(res, await getPlatformControls());
}

export async function updateControls(req, res) {
  const result = await setPlatformControls(req.body, req.user);
  if (result.error) return fail(res, result.error, 400);
  return ok(res, result);
}

export async function auditLog(req, res) {
  return ok(res, await listAuditLog(req.query));
}
