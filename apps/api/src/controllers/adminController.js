import { ok } from "../utils/response.js";
import {
  getAdminMetrics,
  listAuditEvents,
  listDisputes,
  listModerationQueue,
  listPlatformControls,
  listUsers,
  setPlatformControl,
  setUserStatus,
  updateDisputeStatus,
  updateListingStatus
} from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  return ok(res, await listUsers(req.query));
}

export async function updateUser(req, res) {
  return ok(res, await setUserStatus(req.params.id, req.body, req.user));
}

export async function moderation(req, res) {
  return ok(res, await listModerationQueue(req.query));
}

export async function updateListing(req, res) {
  return ok(res, await updateListingStatus(req.params.id, req.body, req.user));
}

export async function disputes(req, res) {
  return ok(res, await listDisputes(req.query));
}

export async function updateDispute(req, res) {
  return ok(res, await updateDisputeStatus(req.params.id, req.body, req.user));
}

export async function controls(req, res) {
  return ok(res, await listPlatformControls());
}

export async function updateControl(req, res) {
  return ok(res, await setPlatformControl(req.params.key, req.body, req.user));
}

export async function audit(req, res) {
  return ok(res, await listAuditEvents(req.query));
}
