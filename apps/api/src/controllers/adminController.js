import { fail, ok } from "../utils/response.js";
import {
  getAdminMetrics,
  getControls,
  getUserDetails,
  listAuditLog,
  listDisputes,
  listFlaggedJobs,
  listUsers,
  moderateJob,
  ruleOnDispute,
  updateControl,
  updateUserStatus
} from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  return ok(res, await listUsers(req.query));
}

export async function userDetails(req, res) {
  const user = await getUserDetails(req.params.userId);
  return user ? ok(res, user) : fail(res, "User not found", 404);
}

export async function changeUserStatus(req, res) {
  const user = await updateUserStatus(req.params.userId, req.body.status, req.user.sub);
  return user ? ok(res, user) : fail(res, "User not found", 404);
}

export async function moderationQueue(req, res) {
  return ok(res, await listFlaggedJobs(req.query));
}

export async function changeListingStatus(req, res) {
  const listing = await moderateJob(req.params.jobId, req.body.action, req.body.reason, req.user.sub);
  return listing ? ok(res, listing) : fail(res, "Listing not found", 404);
}

export async function disputeQueue(req, res) {
  return ok(res, await listDisputes(req.query));
}

export async function changeDisputeStatus(req, res) {
  const dispute = await ruleOnDispute(req.params.disputeId, req.body.ruling, req.user.sub);
  return dispute ? ok(res, dispute) : fail(res, "Dispute not found", 404);
}

export async function platformControls(req, res) {
  return ok(res, await getControls());
}

export async function changePlatformControl(req, res) {
  const control = await updateControl(req.params.key, req.body.enabled, req.user.sub);
  return control ? ok(res, control) : fail(res, "Platform control not found", 404);
}

export async function auditLog(req, res) {
  return ok(res, await listAuditLog(req.query));
}
