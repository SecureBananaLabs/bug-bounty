import { ok } from "../utils/response.js";
import {
  decideJobListing,
  getAdminMetrics,
  getAuditLog,
  getDisputes,
  getModerationJobs,
  getPlatformControls,
  getUsers,
  setPlatformControl,
  setUserStatus,
  submitDisputeRuling,
} from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  return ok(res, await getUsers(req.query));
}

export async function updateUserStatus(req, res) {
  return ok(res, await setUserStatus(req.params.id, req.body, req.user));
}

export async function moderationJobs(req, res) {
  return ok(res, await getModerationJobs(req.query));
}

export async function decideModerationJob(req, res) {
  return ok(res, await decideJobListing(req.params.id, req.body, req.user));
}

export async function disputes(req, res) {
  return ok(res, await getDisputes(req.query));
}

export async function ruleDispute(req, res) {
  return ok(res, await submitDisputeRuling(req.params.id, req.body, req.user));
}

export async function platformControls(req, res) {
  return ok(res, await getPlatformControls());
}

export async function updatePlatformControl(req, res) {
  return ok(res, await setPlatformControl(req.body, req.user));
}

export async function audit(req, res) {
  return ok(res, await getAuditLog(req.query));
}
